/**
 * Teacher Coaching Engine — Análisis de perfil + coaching IA
 *
 * 1. buildTeacherProfile(): Analiza planes localmente → perfil cuantitativo
 * 2. generateCoachingInsights(): Envía perfil a Gemini → recomendaciones personalizadas
 */

import type { StoredLessonPlan } from "@/lib/firebase/firestore";
import type { TeacherProfile, CoachingResponse } from "./coaching-schemas";
import { coachingResponseSchema } from "./coaching-schemas";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// ─── Methodology Detection Keywords ──────────────────────────────

const METHODOLOGY_PATTERNS: Record<string, string[]> = {
    "Guía de Trabajo": ["guía", "guia", "ficha", "hoja de trabajo", "worksheet"],
    "Debate / Discusión": ["debate", "discusión", "foro", "mesa redonda", "socrático"],
    "Experimento / Laboratorio": ["experimento", "laboratorio", "hipótesis", "observar", "medir"],
    "Investigación": ["investigación", "indagar", "fuentes", "bibliografía", "búsqueda"],
    "Juego / Gamificación": ["juego", "gamificación", "trivial", "escape room", "competencia"],
    "Proyecto ABP": ["proyecto", "ABP", "producto final", "prototipo"],
    "Trabajo Colaborativo": ["equipo", "grupo", "colaborativo", "pareja", "roles"],
    "Exposición / Presentación": ["presentación", "exposición", "exponer", "poster", "infografía"],
    "Creación Artística": ["dibujo", "maqueta", "canción", "video", "TikTok", "collage"],
    "Salida a Terreno": ["terreno", "visita", "salida", "recorrido", "comunidad"],
};

// ─── Build Teacher Profile (Pure, no IA) ─────────────────────────

export function buildTeacherProfile(plans: StoredLessonPlan[]): TeacherProfile {
    if (plans.length === 0) {
        return {
            totalPlanes: 0,
            asignaturas: [],
            niveles: [],
            metodologias_detectadas: [],
            habilidades_top: [],
            instrumentos_evaluacion: [],
            oas_unicos: 0,
            oas_repetidos: 0,
            duracion_promedio_minutos: 0,
            meses_activo: 0,
        };
    }

    // Asignaturas
    const subjectCount: Record<string, number> = {};
    plans.forEach((p) => {
        (p.plan.asignaturas_involucradas || []).forEach((s) => {
            subjectCount[s] = (subjectCount[s] || 0) + 1;
        });
    });
    const asignaturas = Object.entries(subjectCount)
        .map(([nombre, frecuencia]) => ({ nombre, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia);

    // Niveles
    const niveles = [...new Set(plans.map((p) => p.plan.nivel).filter(Boolean))];

    // Metodologías detectadas
    const methCount: Record<string, number> = {};
    plans.forEach((p) => {
        const allText = [
            p.plan.fase_preparacion?.descripcion_actividad_estudiante,
            p.plan.fase_investigacion_accion?.descripcion_actividad_estudiante,
            p.plan.fase_sintesis_metacognicion?.descripcion_actividad_estudiante,
            p.plan.titulo,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        for (const [method, keywords] of Object.entries(METHODOLOGY_PATTERNS)) {
            if (keywords.some((kw) => allText.includes(kw.toLowerCase()))) {
                methCount[method] = (methCount[method] || 0) + 1;
            }
        }
    });
    const metodologias_detectadas = Object.entries(methCount)
        .map(([tipo, frecuencia]) => ({ tipo, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia);

    // Habilidades
    const skillCount: Record<string, number> = {};
    plans.forEach((p) => {
        (p.plan.habilidades_desarrolladas || []).forEach((h) => {
            skillCount[h] = (skillCount[h] || 0) + 1;
        });
    });
    const habilidades_top = Object.entries(skillCount)
        .map(([habilidad, frecuencia]) => ({ habilidad, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia)
        .slice(0, 8);

    // Instrumentos de evaluación
    const instrCount: Record<string, number> = {};
    plans.forEach((p) => {
        const instr = p.plan.evaluacion?.instrumento_calificacion;
        if (instr) instrCount[instr] = (instrCount[instr] || 0) + 1;
    });
    const instrumentos_evaluacion = Object.entries(instrCount)
        .map(([instrumento, frecuencia]) => ({ instrumento, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia);

    // OAs
    const allOAs = plans.flatMap((p) => p.plan.oas_sugeridos || []);
    const uniqueOAs = new Set(allOAs);

    // Duración promedio
    const durations = plans.map((p) => {
        const match = p.plan.duracion_total?.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }).filter((d) => d > 0);
    const duracion_promedio_minutos = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    // Meses activo
    const dates = plans.map((p) => p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt));
    const oldest = Math.min(...dates.map((d) => d.getTime()));
    const newest = Math.max(...dates.map((d) => d.getTime()));
    const meses_activo = Math.max(1, Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24 * 30)));

    return {
        totalPlanes: plans.length,
        asignaturas,
        niveles,
        metodologias_detectadas,
        habilidades_top,
        instrumentos_evaluacion,
        oas_unicos: uniqueOAs.size,
        oas_repetidos: Math.max(0, allOAs.length - uniqueOAs.size),
        duracion_promedio_minutos,
        meses_activo,
    };
}

// ─── Generate Coaching Insights (IA) ──────────────────────────────

const MODEL_CASCADE = [
    process.env.AI_MODEL_PRIMARY || "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    process.env.AI_MODEL_FALLBACK || "gemini-3-flash-preview",
];

const COACHING_PROMPT = `Eres un Mentor Senior de Desarrollo Profesional Docente en Chile.
Tienes AÑOS de experiencia acompañando profesores con sutileza, respeto y criterio técnico.

## TU PERFIL COMO MENTOR
- Nunca eres condescendiente ni paternalista.
- Reconoces los logros genuinamente antes de sugerir mejoras.
- Tus sugerencias son CONCRETAS y REALIZABLES (no genéricas).
- Conoces el Decreto 67 (Evaluación), Decreto 83 (Inclusión/DUA), y las habilidades del siglo XXI.
- Conectas tus consejos con la realidad del aula chilena.

## REGLAS DE COACHING
1. Siempre empieza con una fortaleza real (no inventada).
2. Las oportunidades de mejora se plantean como "exploraciones", no como "faltas".
3. Cada sugerencia debe incluir una acción concreta que el docente pueda intentar en su PRÓXIMA clase.
4. Si el docente solo ha usado un tipo de metodología (ej. guías), sugiérele una alternativa específica con ejemplo.
5. Si ha cubierto pocos OAs, no lo critiques; más bien motívalo a expandirse gradualmente.
6. El "próximo desafío" debe ser alcanzable y motivador, tipo mini-reto semanal.
7. Máximo 5 insights (mix de fortalezas, oportunidades y sugerencias).

## FORMATO
Responde en JSON estructurado siguiendo el schema requerido.`;

export async function generateCoachingInsights(
    profile: TeacherProfile
): Promise<CoachingResponse> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("API key no configurada");

    const google = new GoogleGenerativeAI(apiKey);

    const profileSummary = `
## PERFIL DEL DOCENTE
- Total de planificaciones: ${profile.totalPlanes}
- Meses activo: ${profile.meses_activo}
- Asignaturas trabajadas: ${profile.asignaturas.map((a) => `${a.nombre} (${a.frecuencia}x)`).join(", ") || "Ninguna aún"}
- Niveles atendidos: ${profile.niveles.join(", ") || "No especificado"}
- Metodologías detectadas: ${profile.metodologias_detectadas.map((m) => `${m.tipo} (${m.frecuencia}x)`).join(", ") || "No identificadas aún"}
- Habilidades más trabajadas: ${profile.habilidades_top.map((h) => `${h.habilidad} (${h.frecuencia}x)`).join(", ") || "N/A"}
- Instrumentos de evaluación: ${profile.instrumentos_evaluacion.map((i) => `${i.instrumento} (${i.frecuencia}x)`).join(", ") || "N/A"}
- OAs únicos cubiertos: ${profile.oas_unicos} | OAs repetidos: ${profile.oas_repetidos}
- Duración promedio de clases: ${profile.duracion_promedio_minutos} minutos

Genera coaching personalizado basado en este perfil.
Responde EXCLUSIVAMENTE en JSON (sin wrappers):
{
  "saludo": string,
  "resumen_perfil": string,
  "insights": [{ "tipo": "fortaleza"|"oportunidad"|"sugerencia", "icono": string, "titulo": string, "descripcion": string, "accion_sugerida": string }],
  "proximo_desafio": string
}`;

    let agencyContext = "";
    try {
        const reportPath = path.join(process.cwd(), 'docs', 'agencia_calidad_report.txt');
        if (fs.existsSync(reportPath)) {
            const text = fs.readFileSync(reportPath, 'utf8');
            agencyContext = `\n## CONTEXTO INSTITUCIONAL (INFORME AGENCIA DE CALIDAD)\nEl siguiente es un reporte reciente de observación de clases en este colegio. Usa EXCLUSIVAMENTE esta información para focalizar TUS RETOS Y SUGERENCIAS al docente. Enfócate EN CERRAR LAS BRECHAS DETECTADAS (ej. falta de pensamiento creativo/crítico/metacognitivo [Indicadores 5.1, 5.2, 5.3], falta de altas expectativas [Ind 2.4] u opinión estudiantil).\n\n--- INICIO REPORTE ---\n${text}\n--- FIN REPORTE ---\n\n¡DEBES desafiar al profesor en tu coaching a superar estas brechas en su próxima clase de forma empática!\n`;
        }
    } catch (e) {
        console.error("Error leyendo contexto de agencia de calidad:", e);
    }

    const prompt = `${COACHING_PROMPT}\n${agencyContext}\n${profileSummary}`;

    for (const modelName of MODEL_CASCADE) {
        try {
            const model = google.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.8,
                },
            });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const parsed = JSON.parse(text);
            return coachingResponseSchema.parse(parsed);
        } catch {
            continue;
        }
    }

    // Fallback response if all models fail
    return {
        saludo: "¡Hola, docente! 👋",
        resumen_perfil: `Has creado ${profile.totalPlanes} planificaciones hasta ahora. ¡Sigue así!`,
        insights: [{
            tipo: "fortaleza",
            icono: "💪",
            titulo: "Docente comprometido/a",
            descripcion: "El hecho de que uses herramientas digitales para planificar demuestra tu compromiso con la mejora continua.",
            accion_sugerida: "Sigue explorando las herramientas de 360Hacks para diversificar tus estrategias.",
        }],
        proximo_desafio: "Para tu próxima planificación, intenta incluir una actividad que nunca hayas probado antes.",
    };
}
