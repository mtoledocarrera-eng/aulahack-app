/**
 * POST /api/pdf
 * Genera y retorna un PDF de la planificación.
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { LessonPlanPDF } from "@/lib/pdf/lesson-template";
import { projectPlanSchema, rubricSchema } from "@/lib/ai/schemas";
import { z } from "zod";
import React from "react";

const pdfRequestSchema = z.object({
    plan: projectPlanSchema,
    rubric: rubricSchema.optional().nullable(),
    teacherName: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validar que el body contenga plan y opcionalmente rúbrica
        const parsed = pdfRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Solicitud inválida", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { plan, rubric, teacherName } = parsed.data;

        // Generar PDF buffer
        const pdfDoc = React.createElement(LessonPlanPDF, { plan, rubric, teacherName });
        // @ts-ignore react-pdf types mismatch
        const buffer = await renderToBuffer(pdfDoc);
        const uint8 = new Uint8Array(buffer);

        // Retornar como descarga
        const filename = `proyecto-${plan.nivel}-${Date.now()}.pdf`
            .replace(/\s+/g, "-")
            .toLowerCase();

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("[PDF] Error al generar PDF:", error);
        return NextResponse.json(
            {
                error: "Error al generar el PDF",
                detail:
                    error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}
