/**
 * Coaching Schemas — Zod types for teacher coaching analysis
 */

import { z } from "zod";

// ─── Teacher Pedagogical Profile (computed locally) ─────────────
export const teacherProfileSchema = z.object({
    totalPlanes: z.number(),
    asignaturas: z.array(z.object({
        nombre: z.string(),
        frecuencia: z.number(),
    })),
    niveles: z.array(z.string()),
    metodologias_detectadas: z.array(z.object({
        tipo: z.string(),
        frecuencia: z.number(),
    })),
    habilidades_top: z.array(z.object({
        habilidad: z.string(),
        frecuencia: z.number(),
    })),
    instrumentos_evaluacion: z.array(z.object({
        instrumento: z.string(),
        frecuencia: z.number(),
    })),
    oas_unicos: z.number(),
    oas_repetidos: z.number(),
    duracion_promedio_minutos: z.number(),
    meses_activo: z.number(),
});

export type TeacherProfile = z.infer<typeof teacherProfileSchema>;

// ─── AI Coaching Response ──────────────────────────────────────
export const coachingInsightSchema = z.object({
    tipo: z.enum(["fortaleza", "oportunidad", "sugerencia"]).describe(
        "fortaleza: algo que hace bien. oportunidad: área de mejora sutil. sugerencia: acción concreta."
    ),
    icono: z.string().describe("Un emoji representativo, e.g. '💪', '🔄', '💡'"),
    titulo: z.string().describe("Título corto y motivador del insight"),
    descripcion: z.string().describe("Explicación profesional pero cálida, máx 2 oraciones."),
    accion_sugerida: z.string().optional().describe("Qué podría hacer concretamente la próxima vez que planifique."),
});

export const coachingResponseSchema = z.object({
    saludo: z.string().describe("Frase de bienvenida personalizada y motivadora basada en el perfil del docente."),
    resumen_perfil: z.string().describe("Resumen de 1-2 oraciones del perfil pedagógico del docente, en tono positivo."),
    insights: z.array(coachingInsightSchema).describe("3 a 5 insights: mix de fortalezas, oportunidades y sugerencias concretas."),
    proximo_desafio: z.string().describe("Un mini-desafío profesional concreto para la próxima semana, motivador y alcanzable."),
});

export type CoachingInsight = z.infer<typeof coachingInsightSchema>;
export type CoachingResponse = z.infer<typeof coachingResponseSchema>;
