import { buildUniversalExitTicket } from "../exit-ticket";
import { exitTicketSchema, type ProjectPlan } from "../schemas";

const mockPlan = {
    titulo: "Mejoramos nuestro patio",
    nivel: "6° Básico",
    asignaturas_involucradas: ["Ciencias Naturales"],
    oas_sugeridos: ["OA 8 (Ciencias Naturales): Explicar la energía..."],
    oas_oficiales_verificados: [{
        id: "oa-8",
        numero: "8",
        descripcion: "Explicar que la energía es necesaria...",
        asignatura: "Ciencias Naturales",
        curso: "6° Básico",
    }],
    fuente_curricular: "Firestore oficial",
    alineacion_oas: [{
        numero: "8",
        asignatura: "Ciencias Naturales",
        fase: "Fase 2",
        actividad: "Investigar una solución para el patio",
        evidencia: "Registro de observaciones y propuesta",
        criterio: "Relaciona la evidencia con su explicación",
    }],
    conexiones_interdisciplinarias: [],
    habilidades_desarrolladas: ["Observar", "Explicar"],
    indicador_desarrollo_personal_social: "Participación",
    duracion_total: "3 semanas",
    fase_preparacion: {
        titulo: "Preparación",
        duracion: "1 sesión",
        tiempo_estimado_minutos: 45,
        descripcion_actividad_estudiante: "Observan el patio y formulan una hipótesis",
        rol_docente: "Mediar",
        tips_gestion_aula: "Organizar equipos",
        recursos: [],
    },
    fase_investigacion_accion: {
        titulo: "Investigación",
        duracion: "2 semanas",
        tiempo_estimado_minutos: 180,
        descripcion_actividad_estudiante: "Recogen evidencias y prueban soluciones",
        rol_docente: "Preguntar",
        tips_gestion_aula: "Revisar avances",
        recursos: [],
    },
    fase_sintesis_metacognicion: {
        titulo: "Síntesis",
        duracion: "1 sesión",
        tiempo_estimado_minutos: 45,
        descripcion_actividad_estudiante: "Presentan y revisan su explicación",
        rol_docente: "Retroalimentar",
        tips_gestion_aula: "Dar tiempo de reflexión",
        recursos: [],
    },
    evaluacion: {
        estrategia_formativa: "Observación, feedback y revisión",
        instrumento_calificacion: "Rúbrica",
        criterios: ["Usa evidencia"],
        evidencia_individual: "Ticket de salida y registro personal",
    },
    ciclo_aprendizaje: {
        pregunta_desafio: "¿Cómo mejorar el patio?",
        hipotesis_conjetura_inicial: "Creemos que...",
        experimentacion_observacion: "Observación y prototipo",
        evidencia_a_recoger: "Datos del patio",
        registro_anecdotico_docente: "Fecha, acción y siguiente paso",
        feedback_formativo: "Pregunta y sugerencia",
        revision_mejora: "Segundo intento",
        nueva_explicacion: "Explicación basada en datos",
        presentacion_transferencia: "Feria escolar",
        evidencia_individual_proceso: "Registro individual",
        preguntas_metacognitivas: ["¿Qué cambió?", "¿Qué mejoraría?"]
    },
    adecuaciones_dua: {
        representacion: "Visual y oral",
        accion_expresion: "Escrito u oral",
        compromiso: "Elección de roles",
        ajustes_ambientales_y_sensoriales_tea: "Pausa breve",
    },
    recursos_generales: [],
    guia_docente: {
        estrategia_motivacional: "Conectar con el patio",
        posibles_obstaculos_y_soluciones: "Andamiaje",
        conexiones_vida_real: "Cuidado del entorno",
    },
} as ProjectPlan;

describe("Ticket de salida de Aprender a aprender", () => {
    it("genera dos preguntas universales y una extensión visual opcional", () => {
        const ticket = buildUniversalExitTicket(mockPlan);

        expect(ticket.preguntas).toHaveLength(2);
        expect(ticket.preguntas.map((pregunta) => pregunta.tipo)).toEqual([
            "evidencia",
            "metacognicion",
        ]);
        expect(ticket.preguntas[0].enunciado).toContain("OA 8");
        expect(ticket.preguntas[1].enunciado).toContain("feedback");
        expect(ticket.extension_visual.titulo).toContain("opcional");
        expect(exitTicketSchema.safeParse(ticket).success).toBe(true);
    });

    it("normaliza el prefijo OA cuando la alineación ya lo incluye", () => {
        const ticket = buildUniversalExitTicket({
            ...mockPlan,
            alineacion_oas: [{
                ...mockPlan.alineacion_oas![0],
                numero: "OA 8",
            }],
        });

        expect(ticket.preguntas[0].enunciado).toContain("sobre el OA 8 de Ciencias Naturales");
        expect(ticket.preguntas[0].enunciado).not.toContain("OA OA");
    });
});
