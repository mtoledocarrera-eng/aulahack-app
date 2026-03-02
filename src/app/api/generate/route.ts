/**
 * API Route: POST /api/generate
 * Generación de planificación completa (post Flip Prompting)
 *
 * Manejo resiliente: propaga 429 como HTTP 429 con Retry-After header.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateProjectPlan, QuotaExceededError, AIGenerationError } from "@/lib/ai/flip-engine";
import { teacherInputSchema } from "@/lib/ai/schemas";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validar input con Zod
        const parseResult = teacherInputSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Input inválido",
                    details: parseResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { proposito } = parseResult.data;

        // Verificar campos obligatorios (post-Flip)
        if (!proposito) {
            return NextResponse.json(
                {
                    error: "Campos obligatorios faltantes",
                    message:
                        "Debe completar el proceso de Flip Prompting y definir un propósito antes de generar.",
                },
                { status: 422 }
            );
        }

        const projectPlan = await generateProjectPlan(parseResult.data);

        return NextResponse.json({
            success: true,
            plan: projectPlan,
        });
    } catch (error) {
        // ── 429: Cuota excedida → respuesta controlada ──
        if (error instanceof QuotaExceededError) {
            console.warn("[API /generate] Quota exceeded:", error.message);
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
            const statusCode = error.code;
            console.error(`[API /generate] AI Error (${statusCode}):`, error.message);
            return NextResponse.json(
                {
                    error: true,
                    code: statusCode,
                    message: error.message,
                },
                { status: statusCode }
            );
        }

        // ── Error inesperado ──
        console.error("[API /generate] Unhandled Error:", error);
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
