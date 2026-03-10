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
import { type ZodType } from "zod";
import { type Rubric, rubricSchema, type Worksheet, worksheetSchema } from "./schemas";
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
    // Gemini 2.5+ tiene "thinking" habilitado por defecto,
    // lo que antepone tokens de razonamiento al JSON y lo rompe.
    // Desactivamos thinking (budget=0) para salidas estructuradas.
    // gemini-2.5-flash-lite NO soporta thinkingConfig, se excluye.
    const isThinkingModel = modelName.includes("2.5") && !modelName.includes("lite");

    const model = google.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        } as Record<string, unknown>,
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
    let ragContext = "";
    if (input.nivel && input.asignatura && input.proposito) {
        const ragResult = await searchCurriculum(
            input.nivel,
            input.asignatura,
            input.proposito
        );
        ragContext = ragResult.entries
            .map((e) => `[${e.oa}] ${e.descripcion}`)
            .join("\n");
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
    if (!input.proposito) {
        throw new AIGenerationError(
            "Flip Prompting no completado: falta definir el propósito de aprendizaje.",
            422
        );
    }

    // Buscamos semánticamente el RAG apoyado solo si nos dan nivel y asignatura.
    // Si no, la búsqueda probablemente retorne vacío y usamos adaptación.
    const ragResult = await searchCurriculum(
        input.nivel || "",
        input.asignatura || "",
        input.proposito
    );

    let primaryOA;
    let ragContext = "";

    if (ragResult.entries.length === 0) {
        // En lugar de lanzar error 404, construimos un OA "virtual" con el input del usuario
        // y le damos la orden a la IA de que se adapte.
        primaryOA = {
            oa: 'Propósito General / ABP',
            descripcion: input.proposito
        };
        ragContext = "No se encontraron coincidencias exactas en la base curricular para el término ingresado. Como experto Mentor Pedagógico, adapta este propósito al nivel del estudiante y construye un proyecto (ABP) completo que conecte con sus necesidades y habilidades a desarrollar.";
    } else {
        primaryOA = ragResult.entries[0];
        ragContext = ragResult.entries
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
        `${primaryOA.oa}: ${primaryOA.descripcion}`
    );

    const plan = await generateWithFallback<ProjectPlan>(projectPlanSchema, prompt);

    logAnalyticsEvent({
        type: "plan_generated",
        userId: null,
        metadata: { subject: input.asignatura || "N/A", level: input.nivel || "N/A" }
    }).catch(console.error);

    return plan;
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

    const prompt = buildIteratePrompt(
        JSON.stringify(currentPlan, null, 2),
        feedback
    );

    return generateWithFallback<ProjectPlan>(projectPlanSchema, prompt);
}
