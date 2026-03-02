/**
 * Tests: Flip Engine — Manejo resiliente de errores 429
 */

import { QuotaExceededError, AIGenerationError } from "../flip-engine";

describe("FlipEngine Error Classes", () => {
    describe("QuotaExceededError", () => {
        it("crea error con código 429 y mensaje apropiado", () => {
            const error = new QuotaExceededError();
            expect(error.code).toBe(429);
            expect(error.name).toBe("QuotaExceededError");
            expect(error.retryAfterSeconds).toBe(60);
            expect(error.message).toContain("Límite de uso gratuito");
            expect(error.message).toContain("60 segundos");
        });

        it("acepta retryAfterSeconds personalizado", () => {
            const error = new QuotaExceededError(120);
            expect(error.retryAfterSeconds).toBe(120);
        });

        it("es instancia de Error", () => {
            const error = new QuotaExceededError();
            expect(error).toBeInstanceOf(Error);
        });
    });

    describe("AIGenerationError", () => {
        it("crea error con código y mensaje personalizados", () => {
            const error = new AIGenerationError("Modelo no disponible", 503);
            expect(error.code).toBe(503);
            expect(error.name).toBe("AIGenerationError");
            expect(error.message).toBe("Modelo no disponible");
        });

        it("usa código 500 por defecto", () => {
            const error = new AIGenerationError("Error genérico");
            expect(error.code).toBe(500);
        });

        it("es instancia de Error", () => {
            const error = new AIGenerationError("test");
            expect(error).toBeInstanceOf(Error);
        });
    });
});

// ── Test de detección de quota errors con mock ──
// Nota: Para testear isQuotaError internamente, verificamos
// el comportamiento público a través de las clases exportadas

describe("Quota Error Detection (behavioral)", () => {
    it("QuotaExceededError se puede distinguir de otros errores", () => {
        const quotaErr = new QuotaExceededError();
        const aiErr = new AIGenerationError("otro error");
        const genericErr = new Error("error genérico");

        // Pattern matching como lo hace el API route
        expect(quotaErr instanceof QuotaExceededError).toBe(true);
        expect(aiErr instanceof QuotaExceededError).toBe(false);
        expect(genericErr instanceof QuotaExceededError).toBe(false);

        expect(quotaErr instanceof AIGenerationError).toBe(false);
        expect(aiErr instanceof AIGenerationError).toBe(true);
    });

    it("simula flujo API: 429 → respuesta controlada (no crash)", () => {
        // Simula lo que hacen /api/flip y /api/generate
        function handleError(error: unknown) {
            if (error instanceof QuotaExceededError) {
                return {
                    status: 429,
                    body: {
                        error: true,
                        code: 429,
                        message: error.message,
                        retryAfterSeconds: error.retryAfterSeconds,
                    },
                    headers: { "Retry-After": String(error.retryAfterSeconds) },
                };
            }
            if (error instanceof AIGenerationError) {
                return {
                    status: error.code,
                    body: {
                        error: true,
                        code: error.code,
                        message: error.message,
                    },
                };
            }
            return {
                status: 500,
                body: {
                    error: true,
                    code: 500,
                    message: "Error interno",
                },
            };
        }

        // Test 429
        const quota = handleError(new QuotaExceededError(90));
        expect(quota.status).toBe(429);
        expect(quota.body.retryAfterSeconds).toBe(90);
        expect(quota.headers!["Retry-After"]).toBe("90");

        // Test AI Error
        const ai = handleError(new AIGenerationError("Modelo caído", 503));
        expect(ai.status).toBe(503);
        expect(ai.body.message).toBe("Modelo caído");

        // Test generic error (no crash)
        const generic = handleError(new TypeError("unexpected"));
        expect(generic.status).toBe(500);
        expect(generic.body.error).toBe(true);
    });
});
