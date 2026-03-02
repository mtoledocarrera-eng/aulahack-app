import { NextResponse } from "next/server";
import { createPaymentOrder } from "@/lib/flow";

export async function POST(req: Request) {
    try {
        const bodyReq = await req.json();
        const { uid, email } = bodyReq;

        if (!uid || !email) {
            return NextResponse.json({ message: "Faltan credenciales" }, { status: 400 });
        }

        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const host = req.headers.get("host") || "localhost:3000";
        const baseUrl = `${protocol}://${host}`;

        // ID de órden aleatorio
        const commerceOrder = "ORDER-" + Math.floor(Math.random() * 1000000);

        const payment = await createPaymentOrder({
            amount: 4990,
            email: email,
            commerceOrder,
            subject: "Suscripción Premium 360Hacks (1 mes)",
            urlConfirmation: `${baseUrl}/api/payments/webhook`,
            urlReturn: `${baseUrl}/pagos/retorno`, // Endpoint común que verifica éxito o fracaso
            optional: uid, // Pasamos el UID para que el webhook sepa a quién mejorar
        });

        return NextResponse.json({ url: payment.url, token: payment.token });
    } catch (error) {
        console.error("Payment Creation Error:", error);
        return NextResponse.json(
            { message: "No se pudo crear la orden de pago" },
            { status: 500 }
        );
    }
}
