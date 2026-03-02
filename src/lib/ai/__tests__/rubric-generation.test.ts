/**
 * Tests: Rubric Generation — Verificación de lógica y esquemas
 */

import { generateRubric } from "../flip-engine";
import { rubricSchema, type ProjectPlan } from "../schemas";

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent
});

// Mock de la API de Google
jest.mock("@google/generative-ai", () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: mockGetGenerativeModel
        }))
    };
});

const mockRubricData = {
    titulo: "Rúbrica de Prueba",
    indicadores_evaluacion: ["Indicador 1"],
    criterios: [
        {
            dimension: "Criterio 1",
            niveles: [
                { nombre: "Logrado", descripcion: "Desc L", puntaje: 3 },
                { nombre: "Medianamente Logrado", descripcion: "Desc M", puntaje: 2 },
                { nombre: "Por Lograr", descripcion: "Desc P", puntaje: 1 }
            ]
        }
    ]
};

const mockProjectPlan: ProjectPlan = {
    titulo: "Clase de Prueba",
    nivel: "1° Básico",
    asignaturas_involucradas: ["Ciencias"],
    oas_sugeridos: ["OA 1 Explorar las plantas"],
    habilidades_desarrolladas: ["Observar", "Describir"],
    duracion_total: "90 min",
    fase_preparacion: { titulo: "I", duracion: "10", tiempo_estimado_minutos: 10, descripcion_actividad_estudiante: "D", recursos: [], rol_docente: "N", tips_gestion_aula: "T" },
    fase_investigacion_accion: { titulo: "D", duracion: "70", tiempo_estimado_minutos: 70, descripcion_actividad_estudiante: "D", recursos: [], rol_docente: "N", tips_gestion_aula: "T" },
    fase_sintesis_metacognicion: { titulo: "C", duracion: "10", tiempo_estimado_minutos: 10, descripcion_actividad_estudiante: "D", recursos: [], rol_docente: "N", tips_gestion_aula: "T" },
    evaluacion: { estrategia_formativa: "formativa", instrumento_calificacion: "Test", criterios: ["C1"] },
    adecuaciones_dua: { representacion: "V", accion_expresion: "O", compromiso: "M", ajustes_ambientales_y_sensoriales_tea: "TEA" },
    recursos_generales: [],
    guia_docente: {
        estrategia_motivacional: "M",
        posibles_obstaculos_y_soluciones: "N",
        conexiones_vida_real: "N"
    },
    indicador_desarrollo_personal_social: "IDPS",
};

describe("generateRubric", () => {
    // Configurar API KEY para el test
    beforeAll(() => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    });

    beforeEach(() => {
        mockGenerateContent.mockReset();
    });

    it("genera una rúbrica válida a partir de un plan de clase", async () => {
        mockGenerateContent.mockResolvedValue({
            response: { text: () => JSON.stringify(mockRubricData) }
        });

        const rubric = await generateRubric(mockProjectPlan);

        expect(rubric.titulo).toBe("Rúbrica de Prueba");
        expect(rubric.criterios[0].niveles.length).toBe(3);

        // El mock debería llamarse una vez (al modelo primario)
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);

        // Verificar contra el schema de Zod
        const result = rubricSchema.safeParse(rubric);
        expect(result.success).toBe(true);
    });

    it("falla si ambos modelos devuelven JSON inválido", async () => {
        mockGenerateContent.mockResolvedValue({
            response: { text: () => "invalid json" }
        });

        await expect(generateRubric(mockProjectPlan)).rejects.toThrow();
        // Debería intentar con ambos modelos antes de fallar definitivamente
        expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
});
