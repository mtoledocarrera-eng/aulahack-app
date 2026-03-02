/**
 * Storage Service — Persistencia Local de Planificaciones
 *
 * CRUD sobre localStorage para planificaciones generadas.
 * En producción, se reemplazará por Firestore.
 */

import type { ProjectPlan, Rubric } from "@/lib/ai/schemas";

const STORAGE_KEY = "360hacks_plans";

// ─── Types ───────────────────────────────────────────────────────

export interface SavedPlan {
    id: string;
    plan: ProjectPlan;
    createdAt: string; // ISO date
    status: "completed" | "draft";
    rubric?: Rubric;
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStorage(): SavedPlan[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        console.warn("[Storage] Error reading localStorage, resetting");
        return [];
    }
}

function writeStorage(plans: SavedPlan[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

// ─── CRUD Operations ─────────────────────────────────────────────

/**
 * Guarda una nueva planificación y retorna su ID.
 */
export function savePlan(
    plan: ProjectPlan,
    status: "completed" | "draft" = "completed"
): string {
    const plans = readStorage();
    const id = generateId();
    const saved: SavedPlan = {
        id,
        plan,
        createdAt: new Date().toISOString(),
        status,
    };
    plans.unshift(saved); // más reciente primero
    writeStorage(plans);
    return id;
}

/**
 * Retorna todas las planificaciones guardadas (más recientes primero).
 */
export function getPlans(): SavedPlan[] {
    return readStorage();
}

/**
 * Actualiza una planificación existente (e.g. para añadir rúbrica).
 */
export function updatePlan(id: string, updates: Partial<SavedPlan>): boolean {
    const plans = readStorage();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) return false;

    plans[index] = { ...plans[index], ...updates };
    writeStorage(plans);
    return true;
}

/**
 * Retorna una planificación por su ID.
 */
export function getPlanById(id: string): SavedPlan | null {
    const plans = readStorage();
    return plans.find((p) => p.id === id) || null;
}

/**
 * Elimina una planificación por su ID.
 * Retorna true si se eliminó, false si no existía.
 */
export function deletePlan(id: string): boolean {
    const plans = readStorage();
    const filtered = plans.filter((p) => p.id !== id);
    if (filtered.length === plans.length) return false;
    writeStorage(filtered);
    return true;
}

/**
 * Retorna estadísticas del docente.
 */
export function getStats(): {
    totalPlans: number;
    thisMonth: number;
    uniqueOAs: number;
    hoursEstimated: number;
} {
    const plans = readStorage();
    const now = new Date();
    const thisMonthPlans = plans.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const uniqueOAs = new Set(plans.map((p) => p.plan.oas_sugeridos[0] || "ABP")).size;

    return {
        totalPlans: plans.length,
        thisMonth: thisMonthPlans.length,
        uniqueOAs,
        hoursEstimated: Math.round(plans.length * 0.7 * 10) / 10, // ~42 min ahorrados por plan
    };
}
