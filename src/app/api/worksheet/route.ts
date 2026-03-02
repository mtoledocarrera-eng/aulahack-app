/**
 * POST /api/worksheet
 * Genera una guía de trabajo para el estudiante basada en el plan de clase.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateWorksheet } from "@/lib/ai/flip-engine";
import { projectPlanSchema } from "@/lib/ai/schemas";
import { QuotaExceededError } from "@/lib/ai/flip-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const parsed = projectPlanSchema.safeParse(body.plan);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Plan inválido", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const worksheet = await generateWorksheet(parsed.data);

        return NextResponse.json({ worksheet });
    } catch (error) {
        if (error instanceof QuotaExceededError) {
            return NextResponse.json(
                { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
                { status: 429 }
            );
        }

        console.error("[Worksheet] Error:", error);
        return NextResponse.json(
            {
                error: "Error al generar la guía de trabajo",
                detail: error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}
