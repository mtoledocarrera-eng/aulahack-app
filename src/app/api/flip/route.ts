/**
 * API Route: POST /api/flip
 * Ciclo de Flip Prompting — Preguntas clarificadoras
 *
 * Manejo resiliente: propaga 429 como HTTP 429 con Retry-After header.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeTeacherInput, QuotaExceededError, AIGenerationError } from "@/lib/ai/flip-engine";
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

        const flipResponse = await analyzeTeacherInput(parseResult.data);

        return NextResponse.json(flipResponse);
    } catch (error) {
        // ── 429: Cuota excedida → respuesta controlada ──
        if (error instanceof QuotaExceededError) {
            console.warn("[API /flip] Quota exceeded:", error.message);
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

        // ── Error AI controlado (con código HTTP) ──
        if (error instanceof AIGenerationError) {
            console.error("[API /flip] AI Error:", error.message);
            return NextResponse.json(
                {
                    error: true,
                    code: error.code,
                    message: error.message,
                },
                { status: error.code }
            );
        }

        // ── Error inesperado (500 genérico) ──
        console.error("[API /flip] Unhandled Error:", error);
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
