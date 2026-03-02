/**
 * Zod Schemas — Validación de Output del LLM
 *
 * Reemplaza YAML por JSON estructurado con validación de tipos.
 * Estos schemas son usados por generateObject del Vercel AI SDK.
 */

import { z } from "zod";

// ─── Flip Prompting: Preguntas Clarificadoras ─────────────────────
export const flipQuestionSchema = z.object({
    question: z.string().describe("Pregunta clarificadora para el docente"),
    field: z.enum([
        "nivel",
        "asignatura",
        "oa",
        "duracion",
        "contexto",
        "necesidades_especiales",
    ]).describe("Campo que esta pregunta busca completar"),
    options: z.array(z.string()).optional().describe(
        "Opciones sugeridas para responder (si aplica)"
    ),
    inspiracion_creativa: z.string().optional().describe(
        "Una idea creativa y motivadora (ej. usar TikTok, juegos de rol, casos de la vida real) para inspirar al docente si está bloqueado."
    ),
    required: z.boolean().describe("Si el campo es obligatorio para generar"),
});

export const flipResponseSchema = z.object({
    needsMoreInfo: z.boolean().describe(
        "true si faltan campos obligatorios para generar la planificación"
    ),
    questions: z.array(flipQuestionSchema).describe(
        "Preguntas clarificadoras (max 3)"
    ),
    readyToGenerate: z.boolean().describe(
        "true si hay suficiente información para generar"
    ),
    summary: z.string().describe(
        "Resumen de lo que se entendió del input del docente"
    ),
});

export type FlipResponse = z.infer<typeof flipResponseSchema>;

// ─── Proyecto ABP (Constructivista) ───────────────────────────────
export const projectPhaseSchema = z.object({
    titulo: z.string().describe("Título de la fase del proyecto"),
    duracion: z.string().describe("Duración estimada en formato texto, e.g. '2 clases' o '1 semana'"),
    tiempo_estimado_minutos: z.number().describe("Tiempo exacto estimado en minutos para esta fase, ej: 45 o 90. Esto da estructura al docente."),
    descripcion_actividad_estudiante: z.string().describe("Lo que hace el estudiante: investigación, debate, creación, etc."),
    rol_docente: z.string().describe("Rol mediador del docente: preguntas clave, andamiaje, guía."),
    tips_gestion_aula: z.string().describe("Consejo práctico para el profesor sobre cómo manejar el grupo, evitar distracciones o mantener el clima durante esta actividad."),
    recursos: z.array(z.string()).describe("Recursos necesarios para esta fase"),
});

export const duaAdaptationSchema = z.object({
    representacion: z.string().describe(
        "Principio I DUA (Decreto 83): Múltiples medios de representación"
    ),
    accion_expresion: z.string().describe(
        "Principio II DUA (Decreto 83): Múltiples medios de acción y expresión"
    ),
    compromiso: z.string().describe(
        "Principio III DUA (Decreto 83): Múltiples medios de compromiso y motivación"
    ),
    ajustes_ambientales_y_sensoriales_tea: z.string().describe(
        "Orientaciones Ley 21.545 (TEA) y Orientaciones PAEC Mineduc 2025: Ajustes específicos del entorno, estimulación sensorial, o anticipación de rutinas para evitar desregulaciones conductuales o emocionales. Estos deben ser insumos transferibles al Formulario Único PIE."
    ),
});

export const evaluationSchema = z.object({
    estrategia_formativa: z.string().describe("Cómo se monitorea y retroalimenta el proceso (Dec. 67)"),
    instrumento_calificacion: z.string().describe("Instrumento sugerido para la calificación final (ej. rúbrica cocreada)"),
    criterios: z.array(z.string()).describe("Criterios de evaluación clave"),
});

export const projectPlanSchema = z.object({
    titulo: z.string().describe("Título motivador del proyecto o experiencia de aprendizaje"),
    nivel: z.string().describe("Nivel educativo inferido o confirmado"),
    asignaturas_involucradas: z.array(z.string()).describe("Asignaturas que podrían integrarse en este ABP"),
    oas_sugeridos: z.array(z.string()).describe("OAs sugeridos del currículum oficial (ej. 'OA 1 (Ciencias): Analizar...')"),
    habilidades_desarrolladas: z.array(z.string()).describe("Habilidades siglo XXI o específicas a desarrollar"),
    indicador_desarrollo_personal_social: z.string().describe("Cruce con IDPS (Ej: Autoestima Académica, Clima de Convivencia Escolar, Hábitos de Vida Saludable o Participación y Formación Ciudadana)."),
    duracion_total: z.string().describe("Duración total estimada del proyecto"),

    // Fases del Proyecto
    fase_preparacion: projectPhaseSchema.describe("Fase 1: Activación, gancho, pregunta esencial"),
    fase_investigacion_accion: projectPhaseSchema.describe("Fase 2: Búsqueda de información, construcción, debate o experimentación"),
    fase_sintesis_metacognicion: projectPhaseSchema.describe("Fase 3: Cierre, producto final y reflexión metacognitiva"),

    evaluacion: evaluationSchema.describe("Estrategia de evaluación según Decreto 67"),
    adecuaciones_dua: duaAdaptationSchema.describe("Adecuaciones macro del proyecto según Decreto 83"),

    // Metadata & Apoyo al Docente
    recursos_generales: z.array(z.string()),
    guia_docente: z.object({
        estrategia_motivacional: z.string().describe("El 'gancho' principal para captar el interés de los estudiantes desde el minuto cero."),
        posibles_obstaculos_y_soluciones: z.string().describe("Desafíos que el docente podría enfrentar en el aula (ej. falta de interés, frustración, recursos) y cómo abordarlos."),
        conexiones_vida_real: z.string().describe("Cómo conectar esta planificación directamente con la vida y la realidad actual de los estudiantes chilenos."),
    }).describe("Guía de apoyo integral para el éxito del docente en el aula"),
});

// ─── Input del docente (Constructivista) ──────────────────────────
export const teacherInputSchema = z.object({
    proposito: z.string().describe("Lo que se espera que logren: habilidades, conocimientos o actitudes (Reemplaza al OA rígido)"),
    nivel: z.string().optional().describe("e.g. '2° Medio'"),
    asignatura: z.string().optional().describe("e.g. 'Historia' (opcional si es interdisciplinario)"),
    contexto: z.string().optional().describe("Intereses de los estudiantes, barreras, etc."),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;
export type ProjectPlan = z.infer<typeof projectPlanSchema>;

// ─── Rúbrica de Evaluación ──────────────────────────────────────
export const rubricLevelSchema = z.object({
    nombre: z.string().describe("Nombre del nivel, e.g. 'Logrado'"),
    descripcion: z.string().describe("Descripción del nivel para ese criterio"),
    puntaje: z.number().describe("Puntaje asociado a este nivel"),
});

export const rubricCriterionSchema = z.object({
    dimension: z.string().describe("Dimensión o criterio evaluado, e.g. 'Coherencia'"),
    niveles: z.array(rubricLevelSchema).describe("Descripción de los niveles de logro (min 3: Logrado, Medianamente Logrado, Por Lograr)"),
});

export const rubricSchema = z.object({
    titulo: z.string().describe("Título de la rúbrica"),
    indicadores_evaluacion: z.array(z.string()).describe("Indicadores de evaluación derivados del OA"),
    criterios: z.array(rubricCriterionSchema).describe("Criterios detallados de la rúbrica"),
});

export type Rubric = z.infer<typeof rubricSchema>;
export type RubricLevel = z.infer<typeof rubricLevelSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

// ─── Guía de Trabajo (para el Estudiante) ─────────────────────────
export const worksheetStepSchema = z.object({
    numero: z.number().describe("Número de paso (1, 2, 3...)"),
    titulo: z.string().describe("Título corto del paso"),
    instrucciones: z.string().describe("Instrucciones claras y amigables para el estudiante"),
    tiempo_sugerido: z.string().describe("Tiempo sugerido, ej: '15 minutos'"),
    espacio_respuesta: z.string().describe("Tipo de respuesta esperada: 'texto libre', 'dibujo', 'tabla', 'lista', etc."),
});

export const worksheetSchema = z.object({
    titulo_proyecto: z.string().describe("Título del proyecto o experiencia de aprendizaje"),
    pregunta_esencial: z.string().describe("La gran pregunta que guía la investigación del estudiante"),
    objetivo_estudiante: z.string().describe("Lo que el estudiante logrará al completar esta guía, explicado en lenguaje simple"),
    pasos: z.array(worksheetStepSchema).describe("Pasos ordenados de la guía de trabajo (3 a 6 pasos)"),
    criterios_exito: z.array(z.string()).describe("Indicadores simples para que el estudiante sepa si lo hizo bien, ej: 'Incluí al menos 3 fuentes'"),
    recursos_sugeridos: z.array(z.string()).describe("Links, libros o materiales que el estudiante puede consultar"),
    reflexion_final: z.string().describe("Pregunta metacognitiva de cierre, ej: '¿Qué fue lo más difícil y cómo lo resolví?'"),
});

export type Worksheet = z.infer<typeof worksheetSchema>;
