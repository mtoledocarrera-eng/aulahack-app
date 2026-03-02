/**
 * Flow.cl — Pasarela de Pagos Mock
 *
 * Interfaz preparada para integración real con Flow.cl.
 * En fase MVP, todas las operaciones son mockeadas.
 * Incluye estado de gracia de 3 días ante fallas.
 */

export type SubscriptionStatus =
    | "active"
    | "trial"
    | "grace_period"
    | "expired"
    | "cancelled";

export interface Subscription {
    id: string;
    teacherUid: string;
    plan: "free" | "pro" | "premium";
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
    gracePeriodEnd: Date | null;
    flowCustomerId: string | null;
}

export interface PaymentResult {
    success: boolean;
    transactionId: string | null;
    error: string | null;
}

// ─── Mock State ──────────────────────────────────────────────────
const subscriptions = new Map<string, Subscription>();

/**
 * Crear o recuperar suscripción para un docente.
 * En MVP comienza como trial con acceso completo.
 */
export function getOrCreateSubscription(teacherUid: string): Subscription {
    const existing = subscriptions.get(teacherUid);
    if (existing) return existing;

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const subscription: Subscription = {
        id: `sub_mock_${Date.now()}`,
        teacherUid,
        plan: "free",
        status: "trial",
        currentPeriodEnd: trialEnd,
        gracePeriodEnd: null,
        flowCustomerId: null,
    };

    subscriptions.set(teacherUid, subscription);
    return subscription;
}

/**
 * Verificar si el docente tiene acceso a funciones premium.
 * Implementa el estado de gracia de 3 días.
 */
export function hasAccess(teacherUid: string): boolean {
    const sub = getOrCreateSubscription(teacherUid);
    const now = new Date();

    switch (sub.status) {
        case "active":
        case "trial":
            return true;
        case "grace_period":
            return sub.gracePeriodEnd ? now < sub.gracePeriodEnd : false;
        case "expired":
        case "cancelled":
            return false;
        default:
            return false;
    }
}

/**
 * Mock: Procesar pago recurrente.
 * En producción, esto llamará a la API de Flow.cl.
 */
export async function processPayment(
    teacherUid: string,
    amount: number
): Promise<PaymentResult> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 500));

    const sub = subscriptions.get(teacherUid);
    if (!sub) {
        return {
            success: false,
            transactionId: null,
            error: "Suscripción no encontrada",
        };
    }

    // Mock: 95% success rate
    const isSuccessful = Math.random() > 0.05;

    if (isSuccessful) {
        const newPeriodEnd = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );
        sub.status = "active";
        sub.plan = "pro";
        sub.currentPeriodEnd = newPeriodEnd;
        sub.gracePeriodEnd = null;

        return {
            success: true,
            transactionId: `txn_mock_${Date.now()}`,
            error: null,
        };
    } else {
        // Activar estado de gracia de 3 días
        const gracePeriodEnd = new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
        );
        sub.status = "grace_period";
        sub.gracePeriodEnd = gracePeriodEnd;

        return {
            success: false,
            transactionId: null,
            error: "Pago rechazado por el banco (mock). Estado de gracia activado.",
        };
    }
}

/**
 * Mock: Generar URL de pago Flow.cl
 * En producción, esto generará un link real de Flow.cl
 */
export function getPaymentUrl(
    teacherUid: string,
    plan: "pro" | "premium"
): string {
    const amount = plan === "pro" ? 9990 : 19990;
    return `https://sandbox.flow.cl/app/web/pay.php?token=mock_${teacherUid}_${amount}`;
}
