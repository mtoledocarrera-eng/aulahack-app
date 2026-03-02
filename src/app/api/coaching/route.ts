/**
 * POST /api/coaching
 * Genera coaching personalizado para el docente basado en su historial.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTeacherPlans } from "@/lib/firebase/firestore";
import { buildTeacherProfile, generateCoachingInsights } from "@/lib/ai/teacher-coaching";

export async function POST(req: NextRequest) {
    try {
        const { uid } = await req.json();

        if (!uid) {
            return NextResponse.json({ error: "UID requerido" }, { status: 400 });
        }

        // 1. Fetch all plans (server-side)
        const plans = await getTeacherPlans(uid);

        // 2. Build quantitative profile locally
        const profile = buildTeacherProfile(plans);

        // 3. Generate AI coaching
        const coaching = await generateCoachingInsights(profile);

        return NextResponse.json({ profile, coaching });
    } catch (error) {
        console.error("[Coaching] Error:", error);
        return NextResponse.json(
            {
                error: "Error al generar coaching",
                detail: error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}
