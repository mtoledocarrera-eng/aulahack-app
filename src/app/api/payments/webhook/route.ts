import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/flow";
import { createOrUpdateTeacherProfile } from "@/lib/firebase/firestore";

export async function POST(req: Request) {
    try {
        // Flow Content-Type is application/x-www-form-urlencoded
        const formData = await req.formData();
        const token = formData.get("token");

        if (!token || typeof token !== "string") {
            return NextResponse.json({ message: "Token missing" }, { status: 400 });
        }

        // Consultamos a Flow el estado real de este token (evita fraudes/suplantación del webhook)
        const statusData = await getPaymentStatus(token);

        // console.log("Flow Webhook Status Data:", statusData);

        // status = 2 significa pagado (1 pendiente, 3 rechazado, 4 anulado)
        if (statusData.status === 2) {
            const uid = statusData.optional; // Recuperamos el UID de Firebase que enviamos al crear

            if (uid) {
                // Actualizamos a Premium
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1); // +1 mes

                await createOrUpdateTeacherProfile(uid, {
                    isPremium: true,
                    subscriptionEndsAt: endDate,
                });
                console.log(`Usuario ${uid} actualizado a Premium exitosamente.`);
            } else {
                console.error("Pago exitoso pero falta el campo 'optional' (UID)");
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ message: "Webhook Handler Error" }, { status: 500 });
    }
}
