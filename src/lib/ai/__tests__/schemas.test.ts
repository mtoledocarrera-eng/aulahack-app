/**
 * Tests: Zod Schemas — Validación de estructuras pedagógicas
 */

import {
    teacherInputSchema,
    flipResponseSchema,
    projectPlanSchema,
    flipQuestionSchema,
} from "../schemas";

describe("Zod Schemas", () => {
    describe("teacherInputSchema", () => {
        it("acepta input completo", () => {
            const input = {
                nivel: "3° Básico",
                asignatura: "Ciencias Naturales",
                oa: "OA 1",
                duracion: "90 minutos",
                contexto: "Curso de 35 estudiantes",
                necesidades_especiales: "2 estudiantes con TEA",
                mensaje_libre: "Quiero una clase sobre plantas",
            };
            const result = teacherInputSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it("acepta input parcial — Flip Prompting necesario", () => {
            const input = {
                mensaje_libre: "Quiero planificar una clase de mate",
            };
            const result = teacherInputSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it("acepta input vacío", () => {
            const result = teacherInputSchema.safeParse({});
            expect(result.success).toBe(true);
        });
    });

    describe("flipQuestionSchema", () => {
        it("valida pregunta clarificadora completa", () => {
            const question = {
                question: "¿Para qué nivel educativo?",
                field: "nivel" as const,
                options: ["1° Básico", "2° Básico", "3° Básico"],
                required: true,
            };
            const result = flipQuestionSchema.safeParse(question);
            expect(result.success).toBe(true);
        });

        it("rechaza campo inválido", () => {
            const question = {
                question: "¿Cuál es tu color favorito?",
                field: "color_favorito",
                required: false,
            };
            const result = flipQuestionSchema.safeParse(question);
            expect(result.success).toBe(false);
        });
    });

    describe("flipResponseSchema", () => {
        it("valida respuesta con preguntas", () => {
            const response = {
                needsMoreInfo: true,
                questions: [
                    {
                        question: "¿Para qué nivel?",
                        field: "nivel" as const,
                        options: ["1° Básico", "2° Básico"],
                        required: true,
                    },
                ],
                readyToGenerate: false,
                summary: "Entendí que quieres una clase de mate",
            };
            const result = flipResponseSchema.safeParse(response);
            expect(result.success).toBe(true);
        });

        it("valida respuesta lista para generar", () => {
            const response = {
                needsMoreInfo: false,
                questions: [],
                readyToGenerate: true,
                summary: "Datos completos para 3° Básico, Matemática, OA 1",
            };
            const result = flipResponseSchema.safeParse(response);
            expect(result.success).toBe(true);
        });
    });

    describe("projectPlanSchema", () => {
        it("valida planificación constructivista completa", () => {
            const plan = {
                titulo: "Conteo de números del 0 al 100",
                nivel: "1° Básico",
                asignaturas_involucradas: ["Matemática"],
                oas_sugeridos: ["OA 1 Contar números del 0 al 100"],
                habilidades_desarrolladas: ["Contar", "Representar"],
                duracion_total: "90 minutos",
                fase_preparacion: {
                    titulo: "Activación",
                    duracion: "10 minutos",
                    tiempo_estimado_minutos: 10,
                    descripcion_actividad_estudiante: "Juego de conteo grupal",
                    recursos: ["Láminas", "Dados"],
                    rol_docente: "Formar grupos de 4",
                    tips_gestion_aula: "Usa campana para orden",
                },
                fase_investigacion_accion: {
                    titulo: "Práctica guiada",
                    duracion: "40 minutos",
                    tiempo_estimado_minutos: 40,
                    descripcion_actividad_estudiante: "Conteo de 1 en 1 con material concreto",
                    recursos: ["Cubos unifix", "Hojas de trabajo"],
                    rol_docente: "Monitorear progreso individual",
                    tips_gestion_aula: "Pistear entre mesas",
                },
                fase_sintesis_metacognicion: {
                    titulo: "Síntesis",
                    duracion: "10 minutos",
                    tiempo_estimado_minutos: 10,
                    descripcion_actividad_estudiante: "Metacognición: ¿Qué aprendimos hoy?",
                    recursos: [],
                    rol_docente: "Registrar dificultades observadas",
                    tips_gestion_aula: "Círculo de cierre",
                },
                evaluacion: {
                    estrategia_formativa: "Evaluación formativa integral",
                    instrumento_calificacion: "Rúbrica de observación",
                    criterios: ["Cuenta de 1 en 1", "Cuenta de 2 en 2"],
                },
                adecuaciones_dua: {
                    representacion: "Material concreto + visual",
                    accion_expresion: "Oral, escrito, o manipulativo",
                    compromiso: "Trabajo en pareja con roles rotativos",
                },
                recursos_generales: ["Pizarra", "Marcadores"],
                guia_docente: {
                    estrategia_motivacional: "Adaptar según ritmo del grupo",
                    posibles_obstaculos_y_soluciones: "N/A",
                    conexiones_vida_real: "N/A",
                },
            };
            const result = projectPlanSchema.safeParse(plan);
            expect(result.success).toBe(true);
        });

        it("rechaza planificación sin fases obligatorias", () => {
            const plan = {
                titulo: "Test",
                nivel: "1° Básico",
                asignaturas_involucradas: ["Mate"],
                oas_sugeridos: ["OA 1"],
                habilidades_desarrolladas: ["Habilidad 1"],
                duracion_total: "90 min",
                // Missing phase objects completely
                evaluacion: {
                    estrategia_formativa: "Obs",
                    instrumento_calificacion: "Rúbrica",
                    criterios: ["C1"],
                },
                adecuaciones_dua: { representacion: "R", accion_expresion: "A", compromiso: "C" },
                recursos_generales: [],
                guia_docente: {
                    estrategia_motivacional: "N/A",
                    posibles_obstaculos_y_soluciones: "N/A",
                    conexiones_vida_real: "N/A",
                },
            };
            const result = projectPlanSchema.safeParse(plan);
            expect(result.success).toBe(false);
        });
    });
});
