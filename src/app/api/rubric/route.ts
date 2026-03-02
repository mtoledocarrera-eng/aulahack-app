/**
 * POST /api/rubric
 * Genera una rúbrica analítica basada en una planificación.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateRubric } from "@/lib/ai/flip-engine";
import { projectPlanSchema } from "@/lib/ai/schemas";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validar plan de referencia
        const parsed = projectPlanSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Plan inválido", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const rubric = await generateRubric(parsed.data);

        return NextResponse.json({ rubric }, { status: 200 });
    } catch (error) {
        console.error("[Rubric API] Error:", error);

        if ((error as any).code === 429) {
            return NextResponse.json(
                { message: "Límite de cuota alcanzado", code: "rate_limit" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error: "Error al generar la rúbrica",
                detail: error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}
