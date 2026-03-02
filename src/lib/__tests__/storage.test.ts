/**
 * Tests: Storage Service — localStorage CRUD
 */

import { savePlan, getPlans, getPlanById, deletePlan, getStats } from "../storage";
import type { ProjectPlan } from "@/lib/ai/schemas";

// ─── Mock localStorage ──────────────────────────────────────────

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ─── Test data ──────────────────────────────────────────────────

const mockPlan: ProjectPlan = {
    titulo: "Conteo del 0 al 100",
    nivel: "1° Básico",
    asignaturas_involucradas: ["Matemática"],
    oas_sugeridos: ["OA 1 Contar números del 0 al 100"],
    habilidades_desarrolladas: ["Contar", "Representar"],
    duracion_total: "90 minutos",
    fase_preparacion: {
        titulo: "Activación",
        duracion: "15 minutos",
        tiempo_estimado_minutos: 15,
        descripcion_actividad_estudiante: "Activación de conocimientos previos",
        recursos: ["Pizarra"],
        rol_docente: "Preguntar qué números conocen",
        tips_gestion_aula: "Mantener el ruido bajo",
    },
    fase_investigacion_accion: {
        titulo: "Práctica",
        duracion: "45 minutos",
        tiempo_estimado_minutos: 45,
        descripcion_actividad_estudiante: "Actividades diferenciadas",
        recursos: ["Material concreto"],
        rol_docente: "Grupo heterogéneo",
        tips_gestion_aula: "Monitorear grupos",
    },
    fase_sintesis_metacognicion: {
        titulo: "Síntesis",
        duracion: "15 minutos",
        tiempo_estimado_minutos: 15,
        descripcion_actividad_estudiante: "Metacognición",
        recursos: [],
        rol_docente: "Preguntar qué aprendieron",
        tips_gestion_aula: "Reflexión silenciosa final",
    },
    evaluacion: {
        estrategia_formativa: "Evaluación formativa continua",
        instrumento_calificacion: "Lista de cotejo",
        criterios: ["Cuenta de 1 en 1", "Cuenta de 10 en 10"],
    },
    adecuaciones_dua: {
        representacion: "Material visual y tatil",
        accion_expresion: "Respuesta oral o escrita",
        compromiso: "Trabajo colaborativo",
        ajustes_ambientales_y_sensoriales_tea: "TEA config"
    },
    recursos_generales: ["Pizarra", "Material concreto"],
    guia_docente: {
        estrategia_motivacional: "Adaptar ritmo según grupo",
        posibles_obstaculos_y_soluciones: "Diversidad de ritmos de aprendizaje",
        conexiones_vida_real: "Ejemplos de ferias libres",
    },
    indicador_desarrollo_personal_social: "IDPS"
};

// ─── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
    localStorageMock.clear();
});

describe("Storage Service", () => {
    describe("savePlan", () => {
        it("guarda un plan y retorna un ID", () => {
            const id = savePlan(mockPlan);
            expect(id).toBeTruthy();
            expect(id).toMatch(/^plan_/);
        });

        it("persiste el plan en localStorage", () => {
            savePlan(mockPlan);
            const plans = getPlans();
            expect(plans).toHaveLength(1);
            expect(plans[0].plan.titulo).toBe("Conteo del 0 al 100");
        });

        it("guarda con status 'completed' por defecto", () => {
            savePlan(mockPlan);
            const plans = getPlans();
            expect(plans[0].status).toBe("completed");
        });

        it("guarda con status 'draft' si se especifica", () => {
            savePlan(mockPlan, "draft");
            const plans = getPlans();
            expect(plans[0].status).toBe("draft");
        });

        it("guarda múltiples planes (más reciente primero)", () => {
            savePlan(mockPlan);
            const secondPlan = { ...mockPlan, titulo: "Segundo plan" };
            savePlan(secondPlan);
            const plans = getPlans();
            expect(plans).toHaveLength(2);
            expect(plans[0].plan.titulo).toBe("Segundo plan");
        });
    });

    describe("getPlanById", () => {
        it("retorna el plan si existe", () => {
            const id = savePlan(mockPlan);
            const found = getPlanById(id);
            expect(found).not.toBeNull();
            expect(found!.plan.titulo).toBe("Conteo del 0 al 100");
        });

        it("retorna null si no existe", () => {
            expect(getPlanById("inexistente")).toBeNull();
        });
    });

    describe("deletePlan", () => {
        it("elimina un plan existente", () => {
            const id = savePlan(mockPlan);
            expect(deletePlan(id)).toBe(true);
            expect(getPlans()).toHaveLength(0);
        });

        it("retorna false si el plan no existe", () => {
            expect(deletePlan("inexistente")).toBe(false);
        });
    });

    describe("getStats", () => {
        it("retorna stats vacías sin planes", () => {
            const stats = getStats();
            expect(stats.totalPlans).toBe(0);
            expect(stats.thisMonth).toBe(0);
            expect(stats.uniqueOAs).toBe(0);
        });

        it("calcula stats correctamente con planes", () => {
            savePlan(mockPlan);
            savePlan({ ...mockPlan, oas_sugeridos: ["OA 2"] });
            savePlan({ ...mockPlan, oas_sugeridos: ["OA 1 Contar números del 0 al 100"] }); // duplicado

            const stats = getStats();
            expect(stats.totalPlans).toBe(3);
            expect(stats.thisMonth).toBe(3);
            expect(stats.uniqueOAs).toBe(2);
            expect(stats.hoursEstimated).toBeGreaterThan(0);
        });
    });
});
