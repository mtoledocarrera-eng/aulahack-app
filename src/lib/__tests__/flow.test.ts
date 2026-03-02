import { createPaymentOrder } from "../flow";
import crypto from "crypto";

// Mocking fetch and process.env
global.fetch = jest.fn();

describe("Flow integration", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv, FLOW_API_KEY: "test-api-key", FLOW_SECRET_KEY: "test-secret" };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    it("should correctly form and sign the payload", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url: "https://flow.cl/payment", token: "mock-token" }),
        });

        const { url, token } = await createPaymentOrder({
            amount: 5000,
            email: "test@example.com",
            commerceOrder: "ORDER-123",
            subject: "Test Subject",
            urlConfirmation: "https://example.com/webhook",
            urlReturn: "https://example.com/return",
            optional: "user-uuid"
        });

        expect(url).toBe("https://flow.cl/payment?token=mock-token");
        expect(token).toBe("mock-token");

        // Verificar cómo se llamó a fetch
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const fetchBody = fetchCall[1].body;

        // Verificar firma
        const params = {
            apiKey: "test-api-key",
            commerceOrder: "ORDER-123",
            subject: "Test Subject",
            currency: "CLP",
            amount: 5000,
            email: "test@example.com",
            paymentMethod: 9,
            urlConfirmation: "https://example.com/webhook",
            urlReturn: "https://example.com/return",
            optional: "user-uuid"
        };

        const keys = Object.keys(params).sort();
        let stringToSign = "";
        keys.forEach((key) => {
            stringToSign += `${key}${params[key as keyof typeof params]}`;
        });
        const expectedSignature = crypto.createHmac("sha256", "test-secret").update(stringToSign).digest("hex");

        expect(fetchBody).toContain(`s=${expectedSignature}`);
        expect(fetchBody).toContain(`optional=user-uuid`);
    });
});
