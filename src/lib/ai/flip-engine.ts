/**
 * Flip Prompting Engine — Motor Principal
 *
 * Implementa el patrón "preguntar antes de generar":
 * 1. Recibe input parcial del docente
 * 2. Detecta campos faltantes (nivel, asignatura, OA, contexto)
 * 3. Genera preguntas clarificadoras (FLIP)
 * 4. Solo tras respuesta completa → genera planificación
 *
 * Routing dinámico con fallback y manejo resiliente de errores 429.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    flipResponseSchema,
    projectPlanSchema,
    type TeacherInput,
    type FlipResponse,
    type ProjectPlan,
} from "./schemas";
import { buildFlipPrompt, buildGeneratePrompt, buildRubricPrompt, buildIteratePrompt, buildWorksheetPrompt } from "./prompts";
import { searchCurriculum } from "@/lib/rag";
import {
    searchOfficialCurriculum,
    formatOfficialOA,
    verifyOfficialReferences,
    type OfficialCurriculumEntry,
} from "@/lib/rag/official-firestore";
import { type ZodType } from "zod";
import { type Rubric, rubricSchema, type Worksheet, worksheetSchema, type OAAlignment, type LearningCycle } from "./schemas";
import { logAnalyticsEvent } from "@/lib/firebase/analytics";

// ─── Model Configuration ─────────────────────────────────────────

// Intentaremos generar en cascada con esta lista de modelos 
// para saltarnos los límites por-modelo del free tier.
const MODEL_CASCADE = [
    process.env.AI_MODEL_PRIMARY || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    process.env.AI_MODEL_FALLBACK || "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro"
];

const MAX_HEAL_RETRIES = 1;
const THINKING_LEVELS = ["low", "medium", "high"] as const;
type ThinkingLevel = typeof THINKING_LEVELS[number];

// ─── Custom Error Types ──────────────────────────────────────────

export class QuotaExceededError extends Error {
    code = 429 as const;
    retryAfterSeconds: number;

    constructor(retryAfterSeconds = 60) {
        super(
            "Límite de uso gratuito alcanzado. Por favor, espera 60 segundos y vuelve a intentar."
        );
        this.name = "QuotaExceededError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export class AIGenerationError extends Error {
    code: number;

    constructor(message: string, code = 500) {
        super(message);
        this.name = "AIGenerationError";
        this.code = code;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Función de sanitización básica (Ley 19.628 - Protección de Datos).
 * Elimina patrones obvios que parezcan RUTs o nombres completos explícitos
 * antes de pasarlo al modelo de lenguaje.
 */
function scrubPII(text: string | undefined | null): string {
    if (!text) return "";
    let clean = text;
    // Remueve RUTs (ej: 12.345.678-9, 12345678-k)
    clean = clean.replace(/\b\d{1,2}\.?\d{3}\.?\d{3}[-][0-9kK]\b/g, "[RUT REMOVIDO]");
    // Remueve nombres que parezcan "Estudiante Nombre Apellido" para anonimizar NEE
    clean = clean.replace(/\b(el alumno|la alumna|el estudiante|la estudiante)\s+([A-ZÁÉÍÓÚ][a-záéíóú]+\s+)+/gi, "$1 [NOMBRE REMOVIDO] ");
    return clean;
}

/**
 * Detecta si un error es de cuota/rate-limit (429).
 */
function isQuotaError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return (
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("too many requests") ||
        msg.includes("resource has been exhausted") ||
        msg.includes("rate limit")
    );
}

/**
 * Extrae retry-after en segundos del error, o devuelve 60 por defecto.
 */
function extractRetryAfter(error: unknown): number {
    if (error instanceof Error) {
        const match = error.message.match(/retry after (\d+)/i);
        if (match) return parseInt(match[1], 10);
    }
    return 60;
}

function getGoogleAI() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new AIGenerationError(
            "GOOGLE_GENERATIVE_AI_API_KEY no está configurada. Revise su archivo .env.local.",
            503
        );
    }
    return new GoogleGenerativeAI(apiKey);
}

// ─── Core Generation with Resilient Fallback ──────────────────────

/**
 * Ejecuta generación con fallback dinámico en cascada de modelos.
 * Si falla un modelo por cuota/timeout, salta al siguiente en la lista.
 * Los errores 429 se propagan como QuotaExceededError recién si TODOS fallan.
 */
async function generateWithFallback<T>(
    schema: ZodType<T>,
    prompt: string,
): Promise<T> {
    const google = getGoogleAI();
    let lastError: unknown;

    for (const modelName of MODEL_CASCADE) {
        try {
            return await callModel(google, modelName, schema, prompt);
        } catch (error) {
            lastError = error;
            const isQuota = isQuotaError(error);
            console.warn(
                `[FlipEngine] Model (${modelName}) failed${isQuota ? ' (quota)' : ''}, trying next...`,
                error instanceof Error ? error.message : error
            );
            // Seguimos intentando con el siguiente modelo en la fila
        }
    }

    // Si llegamos aquí, TODOS los modelos fallaron.
    // Usamos el error del último intento para decidir el mensaje de salida.
    if (isQuotaError(lastError)) {
        logAnalyticsEvent({ type: "ai_error_429", userId: null }).catch(console.error);
        throw new QuotaExceededError(extractRetryAfter(lastError));
    }

    console.error(
        `[FlipEngine] All models failed. Last error:`,
        lastError instanceof Error ? lastError.message : lastError
    );
    throw new AIGenerationError(
        `No se pudo generar respuesta. Múltiples modelos fallaron. Intente nuevamente en unos minutos.`
    );
}

/**
 * Llama a un modelo específico y parsea la respuesta con Zod.
 * Para modelos 2.5+ con "thinking" habilitado por defecto,
 * desactiva thinking para obtener JSON limpio.
 * Incluye Self-Healing: si Zod falla, reenvía con errores para corrección.
 */
async function callModel<T>(
    google: GoogleGenerativeAI,
    modelName: string,
    schema: ZodType<T>,
    prompt: string,
): Promise<T> {
    const generationConfig = buildGenerationConfig(modelName);

    const model = google.getGenerativeModel({
        model: modelName,
        generationConfig,
    });

    // Primer intento
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    let parsed = parseJSONSafe(text, modelName);

    const zodResult = schema.safeParse(parsed);
    if (zodResult.success) {
        return zodResult.data;
    }

    // ── Self-Healing: reenviar JSON roto con errores de Zod ──
    const zodErrors = JSON.stringify(zodResult.error.issues.map(i => ({
        path: i.path.join("."),
        message: i.message,
    })));

    logAnalyticsEvent({
        type: "validation_error_zod",
        userId: null,
        metadata: { model: modelName, error: zodErrors.substring(0, 200) }
    }).catch(console.error);

    console.warn(
        `[FlipEngine] ${modelName} Self-Healing: Zod falló, reintentando con corrección...`
    );

    const healPrompt = `Tu respuesta JSON anterior no pasó la validación de esquema.

JSON que generaste:
${text.substring(0, 2000)}

Errores de validación:
${zodErrors}

Corrige el JSON para que cumpla exactamente con el esquema requerido.
Responde SOLO con el JSON corregido, sin explicaciones ni wrappers adicionales.`;

    for (let retry = 0; retry < MAX_HEAL_RETRIES; retry++) {
        try {
            const healResult = await model.generateContent(healPrompt);
            text = healResult.response.text();
            parsed = parseJSONSafe(text, modelName);

            const retryResult = schema.safeParse(parsed);
            if (retryResult.success) {
                // Silent retry
                return retryResult.data;
            }
        } catch (healError) {
            console.error(`[FlipEngine] ${modelName} Self-Healing retry ${retry + 1} falló:`, healError);
        }
    }

    // Si el healing falló, loggear y lanzar
    console.error(
        `[FlipEngine] ${modelName} Self-Healing agotado. Zod errors:`,
        zodErrors
    );
    console.error(
        `[FlipEngine] Model returned keys:`,
        Object.keys(parsed as Record<string, unknown>)
    );
    throw new Error(`${modelName} response did not match expected schema after self-healing`);
}

/**
 * Parsea un string como JSON con fallback de extracción.
 */
function parseJSONSafe(text: string, modelName: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        const extracted = extractJSON(text);
        if (extracted) {
            try {
                const parsed = JSON.parse(extracted);
                console.warn(`[FlipEngine] ${modelName}: JSON extraído del texto con éxito (thinking leak).`);
                return parsed;
            } catch {
                // fall through
            }
        }
        console.error(`[FlipEngine] ${modelName} returned invalid JSON:`, text.substring(0, 300));
        throw new Error(`${modelName} returned invalid JSON`);
    }
}

/**
 * Extrae el primer objeto JSON válido de un string que puede contener
 * texto adicional (como tokens de thinking de Gemini 2.5).
 */
function extractJSON(text: string): string | null {
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < text.length; i++) {
        const char = text[i];
        if (escape) { escape = false; continue; }
        if (char === '\\' && inString) { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (char === '{') depth++;
        if (char === '}') {
            depth--;
            if (depth === 0) {
                return text.substring(firstBrace, i + 1);
            }
        }
    }
    return null;
}

// ─── Flip Prompting: Fase de Interrogación ────────────────────────

/**
 * Analiza el input del docente y determina si hay suficiente
 * información para generar, o si necesita hacer preguntas.
 *
 * @throws {QuotaExceededError} Si se excede la cuota de la API.
 * @throws {AIGenerationError} Si ambos modelos fallan por otra razón.
 */
export async function analyzeTeacherInput(
    input: TeacherInput
): Promise<FlipResponse> {
    const missing = (["nivel", "asignatura"] as const).filter((field) => !input[field]?.trim());
    if (missing.length) {
        return {
            needsMoreInfo: true,
            readyToGenerate: false,
            summary: "Falta definir nivel y/o asignatura para consultar el currículum.",
            questions: missing.map((field) => ({
                field, required: true,
                question: field === "nivel" ? "¿Para qué nivel educativo planificamos?" : "¿Qué asignaturas participarán?",
            })),
        };
    }
    let ragContext = "";
    if (input.nivel && input.asignatura && input.proposito) {
        const officialResult = await searchOfficialCurriculum(
            input.nivel,
            input.asignatura,
            input.proposito
        );
        if (officialResult.available) {
            if (!officialResult.entries.length) {
                throw new AIGenerationError("No encontré OAs oficiales para todas las asignaturas de ese nivel. Confirma los datos o completa la cobertura curricular.", 422);
            }
            ragContext = "Fuente: Firestore oficial.\n" + officialResult.entries.map(formatOfficialOA).join("\n");
        } else {
            const ragResult = await searchCurriculum(input.nivel, input.asignatura, input.proposito);
            ragContext = "Fuente: RAG local de apoyo (validación pendiente). No son OAs verificados en Firestore.\n" + ragResult.entries
                .map((e) => `[${e.oa}] ${e.descripcion}`)
                .join("\n");
        }
    }

    const teacherMessage = buildTeacherMessage(input);
    const prompt = buildFlipPrompt(teacherMessage, ragContext);

    return generateWithFallback<FlipResponse>(flipResponseSchema, prompt);
}

// ─── Generación de Planificación ──────────────────────────────────

/**
 * Genera una planificación completa de clase.
 * PRECONDICIÓN: El Flip Prompting ya confirmó que hay datos suficientes.
 *
 * @throws {QuotaExceededError} Si se excede la cuota de la API.
 * @throws {AIGenerationError} Si ambos modelos fallan.
 * @throws {Error} Si faltan campos obligatorios o el OA no existe en RAG.
 */
export async function generateProjectPlan(
    input: TeacherInput
): Promise<ProjectPlan> {
    if (!input.proposito?.trim()) {
        throw new AIGenerationError(
            "Flip Prompting no completado: falta definir el propósito de aprendizaje.",
            422
        );
    }

    if (!input.nivel?.trim() || !input.asignatura?.trim()) {
        throw new AIGenerationError(
            "Para vincular la planificación con el currículum oficial debes indicar nivel y asignatura.",
            422
        );
    }

    const officialResult = await searchOfficialCurriculum(
        input.nivel,
        input.asignatura,
        input.proposito
    );
    let officialEntries: OfficialCurriculumEntry[] | null = null;
    let localOAs: string[] = [];
    let ragContext = "";

    if (officialResult.available) {
        if (officialResult.entries.length === 0) {
            throw new AIGenerationError(
                "No encontré OAs oficiales para todas las asignaturas de ese nivel. Confirma los datos o completa la cobertura curricular.",
                422
            );
        }
        officialEntries = officialResult.entries;
        ragContext = officialEntries
            .map((e) => `${formatOfficialOA(e)}\nEje: ${e.eje ?? "No informado"}${e.es_basal === undefined ? "" : `\nPriorización: ${e.es_basal ? "Basal" : "Complementario"}`}`)
            .join("\n\n");
    } else {
        // El RAG local solo opera como contingencia si Firestore no está disponible.
        const ragResult = await searchCurriculum(input.nivel, input.asignatura, input.proposito);
        if (ragResult.entries.length === 0) {
            throw new AIGenerationError(
                "No fue posible consultar la fuente curricular oficial y el RAG local no tiene coincidencias. Intenta nuevamente o confirma los datos.",
                503
            );
        }
        localOAs = ragResult.entries.map((entry) => `${entry.oa} (${entry.asignatura}): ${entry.descripcion}`);
        ragContext = `Fuente de contingencia: ${ragResult.source}. La alineación debe validarse antes de usarla como OA oficial.\n\n` + ragResult.entries
            .map(
                (e) =>
                    `[${e.oa}] ${e.descripcion}\nIndicadores: ${e.indicadores.join("; ")}`
            )
            .join("\n\n");
    }

    const teacherMessage = buildTeacherMessage(input);
    const prompt = buildGeneratePrompt(
        teacherMessage,
        ragContext,
        input.proposito
    );

    const plan = await generateWithFallback<ProjectPlan>(projectPlanSchema, prompt);
    const evidenceIndividual = plan.evaluacion.evidencia_individual?.trim()
        || "Registro individual de investigación, participación argumentada, ticket de salida y explicación de los cambios incorporados en la segunda versión.";
    const planWithEvidence = {
        ...plan,
        evaluacion: {
            ...plan.evaluacion,
            evidencia_individual: evidenceIndividual,
        },
    };
    const planWithLearningCycle = ensureLearningCycle(planWithEvidence);
    const enrichedPlan = {
        ...planWithLearningCycle,
        nivel: input.nivel,
        evaluacion: planWithLearningCycle.evaluacion,
        oas_sugeridos: officialEntries
            ? officialEntries.map(formatOfficialOA)
            : localOAs,
        ...(officialEntries
            ? {
                oas_oficiales_verificados: officialEntries,
                fuente_curricular: "Firestore oficial" as const,
                alineacion_oas: buildOfficialAlignments(officialEntries, planWithLearningCycle),
            }
            : {
                oas_oficiales_verificados: [],
                fuente_curricular: "RAG local de apoyo (validación pendiente)" as const,
                alineacion_oas: planWithLearningCycle.alineacion_oas ?? [],
            }),
    };

    logAnalyticsEvent({
        type: "plan_generated",
        userId: null,
        metadata: { subject: input.asignatura || "N/A", level: input.nivel || "N/A" }
    }).catch(console.error);

    return projectPlanSchema.parse(enrichedPlan);
}

// ─── Generación de Rúbrica ────────────────────────────────────────

/**
 * Genera una rúbrica analítica basada en un plan de clase.
 *
 * @throws {QuotaExceededError} Si se excede la cuota de la API.
 * @throws {AIGenerationError} Si ambos modelos fallan.
 */
export async function generateRubric(
    projectPlan: ProjectPlan
): Promise<Rubric> {
    const prompt = buildRubricPrompt(projectPlan);
    return generateWithFallback<Rubric>(rubricSchema, prompt);
}

// ─── Generación de Guía de Trabajo ────────────────────────────────

/**
 * Genera una guía de trabajo para el estudiante basada en un plan de clase.
 *
 * @throws {QuotaExceededError} Si se excede la cuota de la API.
 * @throws {AIGenerationError} Si ambos modelos fallan.
 */
export async function generateWorksheet(
    projectPlan: ProjectPlan
): Promise<Worksheet> {
    const prompt = buildWorksheetPrompt(projectPlan);
    return generateWithFallback<Worksheet>(worksheetSchema, prompt);
}

// ─── buildTeacherMessage ──────────────────────────────────────────

function buildTeacherMessage(input: TeacherInput): string {
    const parts: string[] = [];

    if (input.proposito) parts.push(`Propósito/Habilidades esperadas: ${input.proposito}`);
    if (input.nivel) parts.push(`Nivel: ${input.nivel}`);
    if (input.asignatura) parts.push(`Asignatura: ${input.asignatura}`);
    if (input.contexto) parts.push(`Contexto de los estudiantes: ${input.contexto}`);

    return parts.join("\n");
}

function buildOfficialAlignments(
    entries: OfficialCurriculumEntry[],
    plan: ProjectPlan,
): OAAlignment[] {
    const generated = plan.alineacion_oas ?? [];
    const fallbackActivity = plan.fase_investigacion_accion.descripcion_actividad_estudiante;
    const fallbackEvidence = plan.evaluacion.evidencia_individual
        || plan.evaluacion.estrategia_formativa;
    const fallbackCriterion = plan.evaluacion.criterios[0]
        || "Explica el aprendizaje usando la evidencia recogida y justifica sus decisiones.";

    return entries.map((entry) => {
        const match = generated.find((alignment) =>
            alignment.numero.trim() === entry.numero.trim()
            && alignment.asignatura.trim().toLocaleLowerCase() === entry.asignatura.trim().toLocaleLowerCase()
        );
        return {
            numero: entry.numero,
            asignatura: entry.asignatura,
            fase: match?.fase?.trim() || "Investigación y acción",
            actividad: match?.actividad?.trim() || fallbackActivity,
            evidencia: match?.evidencia?.trim() || fallbackEvidence,
            criterio: match?.criterio?.trim() || fallbackCriterion,
        };
    });
}

/**
 * Configuración compatible con la API legacy para comparar modelos sin
 * cambiar el contrato de salida de la aplicación.
 *
 * Gemini 2.5 usa thinkingBudget; Gemini 3.x usa thinkingLevel y no debe
 * recibir temperature. El nivel experimental se puede controlar con
 * AI_THINKING_LEVEL=low|medium|high, con low como valor seguro por defecto.
 */
export function buildGenerationConfig(modelName: string): Record<string, unknown> {
    const isGemini3Model = /^gemini-3(?:[.-]|$)/i.test(modelName);
    const isThinkingModel = modelName.includes("2.5") && !modelName.includes("lite");
    const requestedLevel = process.env.AI_THINKING_LEVEL;
    const thinkingLevel: ThinkingLevel = THINKING_LEVELS.includes(requestedLevel as ThinkingLevel)
        ? requestedLevel as ThinkingLevel
        : "low";

    return {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        ...(isGemini3Model
            ? { thinkingConfig: { thinkingLevel } }
            : {
                temperature: 0.3,
                ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            }),
    };
}

/**
 * Garantiza que las planificaciones nuevas y las históricas puedan mostrar
 * el ciclo de aprender haciendo, incluso si un modelo antiguo no lo entregó.
 * Los textos de respaldo son guías operativas, no OAs ni resultados atribuidos
 * al estudiante.
 */
export function ensureLearningCycle(plan: ProjectPlan): ProjectPlan {
    if (plan.ciclo_aprendizaje) return plan;

    const evidence = plan.evaluacion.evidencia_individual
        || plan.evaluacion.estrategia_formativa
        || "Producto, explicación y registro del proceso.";
    const ciclo: LearningCycle = {
        pregunta_desafio: `¿Qué necesitamos comprender o mejorar para responder al desafío «${plan.titulo}»?`,
        hipotesis_conjetura_inicial: "Antes de actuar, cada estudiante formula una predicción o explicación inicial y señala en qué se basa.",
        experimentacion_observacion: plan.fase_investigacion_accion.descripcion_actividad_estudiante,
        evidencia_a_recoger: `${evidence} Registra datos, decisiones, dificultades y cambios observables.`,
        registro_anecdotico_docente: "Anota fecha y situación, acción observable del estudiante, evidencia producida, apoyo ofrecido y siguiente paso; describe lo que ocurrió sin etiquetar.",
        feedback_formativo: `${plan.evaluacion.estrategia_formativa} Pregunta: «¿Qué evidencia respalda tu explicación y qué podrías probar ahora?»`,
        revision_mejora: "Después del feedback, cada estudiante compara su primera estrategia con la nueva, explica qué cambió y realiza un segundo intento.",
        nueva_explicacion: `${plan.fase_sintesis_metacognicion.descripcion_actividad_estudiante} La explicación final debe conectar la hipótesis, la evidencia y la mejora realizada.`,
        presentacion_transferencia: "Comunica la explicación y la evidencia a una audiencia real o a otra situación, usando el medio que mejor permita demostrar lo aprendido.",
        evidencia_individual_proceso: `${evidence} Incluye la hipótesis inicial, una decisión personal, la respuesta al feedback y la nueva explicación.`,
        preguntas_metacognitivas: [
            "¿Qué pensaba al comenzar y qué evidencia hizo cambiar o confirmar mi idea?",
            "¿Qué mejoré después del feedback y qué probaría en un próximo intento?",
        ],
    };

    return { ...plan, ciclo_aprendizaje: ciclo };
}

// ─── Iteración de Planes ──────────────────────────────────────────

/**
 * Itera sobre un plan existente aplicando el feedback del docente.
 * Devuelve un plan modificado con la misma estructura.
 *
 * @throws {QuotaExceededError} Si se excede la cuota de la API.
 * @throws {AIGenerationError} Si ambos modelos fallan.
 */
export async function iterateProjectPlan(
    currentPlan: ProjectPlan,
    feedback: string
): Promise<ProjectPlan> {
    if (!feedback.trim()) {
        throw new AIGenerationError(
            "El feedback no puede estar vacío.",
            422
        );
    }

    let verified: OfficialCurriculumEntry[] = [];
    if (currentPlan.fuente_curricular === "Firestore oficial") {
        const references = await verifyOfficialReferences(currentPlan.oas_oficiales_verificados ?? []);
        if (!references) {
            throw new AIGenerationError("No fue posible revalidar los OAs originales en Firestore. Intenta nuevamente o genera una nueva planificación.", 503);
        }
        verified = references;
    }
    const groundedPlan = ensureLearningCycle({
        ...currentPlan,
        oas_oficiales_verificados: verified,
        oas_sugeridos: verified.length ? verified.map(formatOfficialOA) : currentPlan.oas_sugeridos,
    });

    const prompt = buildIteratePrompt(
        JSON.stringify(groundedPlan, null, 2),
        feedback
    );

    const iteratedPlan = await generateWithFallback<ProjectPlan>(projectPlanSchema, prompt);
    return {
        ...iteratedPlan,
        nivel: currentPlan.nivel,
        asignaturas_involucradas: currentPlan.asignaturas_involucradas,
        // Una iteración no puede cambiar el OA oficial sin volver a consultarlo.
        oas_sugeridos: groundedPlan.oas_sugeridos,
        oas_oficiales_verificados: verified,
        fuente_curricular: currentPlan.fuente_curricular,
        alineacion_oas: verified.length
            ? buildOfficialAlignments(verified, iteratedPlan)
            : (iteratedPlan.alineacion_oas ?? currentPlan.alineacion_oas ?? []),
        ciclo_aprendizaje: iteratedPlan.ciclo_aprendizaje
            ?? currentPlan.ciclo_aprendizaje
            ?? groundedPlan.ciclo_aprendizaje,
        evaluacion: {
            ...iteratedPlan.evaluacion,
            evidencia_individual: currentPlan.evaluacion.evidencia_individual
                || "Registro individual de investigación, participación argumentada, ticket de salida y explicación de los cambios incorporados en la segunda versión.",
        },
    };
}
