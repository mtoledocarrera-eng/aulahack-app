import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/flow";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const token = formData.get("token");

        if (!token || typeof token !== "string") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // Consultamos a Flow el estado para saber a qué página enviarlo
        const statusData = await getPaymentStatus(token);

        if (statusData.status === 2) { // 2 = Pagado
            return NextResponse.redirect(new URL("/pagos/exito", req.url));
        } else {
            // Rechazado, pendiente o anulado
            return NextResponse.redirect(new URL("/pagos/fracaso", req.url));
        }
    } catch (error) {
        console.error("Return Handler Error:", error);
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
}
