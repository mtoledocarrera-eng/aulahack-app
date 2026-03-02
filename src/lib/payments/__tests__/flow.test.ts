/**
 * Tests: Flow.cl — Servicio de pagos mock
 */

import {
    getOrCreateSubscription,
    hasAccess,
    processPayment,
    getPaymentUrl,
} from "../flow";

describe("Flow.cl Payment Service", () => {
    const TEST_UID = "test-teacher-123";

    describe("getOrCreateSubscription", () => {
        it("crea suscripción trial para usuario nuevo", () => {
            const sub = getOrCreateSubscription(TEST_UID);
            expect(sub.teacherUid).toBe(TEST_UID);
            expect(sub.status).toBe("trial");
            expect(sub.plan).toBe("free");
            expect(sub.currentPeriodEnd).toBeInstanceOf(Date);
            expect(sub.id).toContain("sub_mock_");
        });

        it("retorna misma suscripción para usuario existente", () => {
            const sub1 = getOrCreateSubscription(TEST_UID);
            const sub2 = getOrCreateSubscription(TEST_UID);
            expect(sub1.id).toBe(sub2.id);
        });
    });

    describe("hasAccess", () => {
        it("permite acceso en estado trial", () => {
            const uid = "access-test-trial";
            getOrCreateSubscription(uid);
            expect(hasAccess(uid)).toBe(true);
        });

        it("crea suscripción automáticamente si no existe", () => {
            const uid = "access-test-auto";
            expect(hasAccess(uid)).toBe(true);
        });
    });

    describe("processPayment", () => {
        it("retorna resultado con estructura correcta", async () => {
            const uid = "payment-test-1";
            getOrCreateSubscription(uid);

            const result = await processPayment(uid, 9990);

            expect(result).toHaveProperty("success");
            expect(result).toHaveProperty("transactionId");
            expect(result).toHaveProperty("error");

            if (result.success) {
                expect(result.transactionId).toContain("txn_mock_");
                expect(result.error).toBeNull();
            } else {
                expect(result.transactionId).toBeNull();
                expect(result.error).toBeTruthy();
            }
        });

        it("falla para suscripción inexistente", async () => {
            const result = await processPayment("nonexistent-uid", 9990);
            expect(result.success).toBe(false);
            expect(result.error).toContain("Suscripción no encontrada");
        });
    });

    describe("getPaymentUrl", () => {
        it("genera URL de sandbox para plan pro", () => {
            const url = getPaymentUrl("test-uid", "pro");
            expect(url).toContain("sandbox.flow.cl");
            expect(url).toContain("9990");
        });

        it("genera URL con monto correcto para plan premium", () => {
            const url = getPaymentUrl("test-uid", "premium");
            expect(url).toContain("19990");
        });
    });
});
