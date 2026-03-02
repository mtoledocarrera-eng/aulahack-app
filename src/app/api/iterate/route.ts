/**
 * API Route: POST /api/iterate
 * Iteración de planificación — el docente da feedback y la IA ajusta el plan.
 *
 * Manejo resiliente: propaga 429 como HTTP 429 con Retry-After header.
 */

import { NextRequest, NextResponse } from "next/server";
import { iterateProjectPlan, QuotaExceededError, AIGenerationError } from "@/lib/ai/flip-engine";
import { projectPlanSchema } from "@/lib/ai/schemas";
import { z } from "zod";

const iterateRequestSchema = z.object({
    plan: projectPlanSchema,
    feedback: z.string().min(1, "El feedback no puede estar vacío"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar input con Zod
        const parseResult = iterateRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Input inválido",
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { plan, feedback } = parseResult.data;
        const iteratedPlan = await iterateProjectPlan(plan, feedback);

        return NextResponse.json({
            success: true,
            plan: iteratedPlan,
        });
    } catch (error) {
        // ── 429: Cuota excedida → respuesta controlada ──
        if (error instanceof QuotaExceededError) {
            console.warn("[API /iterate] Quota exceeded:", error.message);
            return NextResponse.json(
                {
                    error: true,
                    code: 429,
                    message: error.message,
                    retryAfterSeconds: error.retryAfterSeconds,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(error.retryAfterSeconds),
                    },
                }
            );
        }

        // ── Error AI controlado ──
        if (error instanceof AIGenerationError) {
            console.error(`[API /iterate] AI Error (${error.code}):`, error.message);
            return NextResponse.json(
                {
                    error: true,
                    code: error.code,
                    message: error.message,
                },
                { status: error.code }
            );
        }

        // ── Error inesperado ──
        console.error("[API /iterate] Unhandled Error:", error);
        return NextResponse.json(
            {
                error: true,
                code: 500,
                message: "Error interno del servidor. Intente nuevamente.",
            },
            { status: 500 }
        );
    }
}
