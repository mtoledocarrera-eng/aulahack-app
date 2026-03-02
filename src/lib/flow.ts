import crypto from "crypto";

function getFlowConfig() {
    return {
        apiKey: process.env.FLOW_API_KEY!,
        secretKey: process.env.FLOW_SECRET_KEY!,
        baseUrl: process.env.FLOW_BASE_URL || "https://sandbox.flow.cl/api",
    };
}

function signParams(params: Record<string, string | number>): string {
    const { secretKey } = getFlowConfig();
    // 1. Sort keys alphabetically
    const keys = Object.keys(params).sort();

    // 2. Concatenate key=value
    let stringToSign = "";
    keys.forEach((key) => {
        stringToSign += `${key}${params[key]}`;
    });

    // 3. HMAC SHA256
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(stringToSign);

    return hmac.digest("hex");
}

export async function createPaymentOrder({
    amount,
    email,
    commerceOrder,
    subject,
    urlConfirmation,
    urlReturn,
    optional,
}: {
    amount: number;
    email: string;
    commerceOrder: string;
    subject: string;
    urlConfirmation: string;
    urlReturn: string;
    optional?: string;
}): Promise<{ url: string; token: string }> {
    const { apiKey, baseUrl } = getFlowConfig();

    const params: Record<string, string | number> = {
        apiKey: apiKey,
        commerceOrder,
        subject,
        currency: "CLP",
        amount,
        email,
        paymentMethod: 9, // 9 = All methods
        urlConfirmation,
        urlReturn,
    };

    if (optional) {
        params.optional = optional;
    }

    const signature = signParams(params);

    const body = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        body.append(key, String(value));
    });
    body.append("s", signature);

    const response = await fetch(`${baseUrl}/payment/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("Flow API Error:", text);
        throw new Error("Error creating Flow payment");
    }

    const data = await response.json();
    return {
        url: `${data.url}?token=${data.token}`,
        token: data.token,
    };
}

export async function getPaymentStatus(token: string): Promise<any> {
    const { apiKey, baseUrl } = getFlowConfig();

    const params: Record<string, string | number> = {
        apiKey: apiKey,
        token,
    };

    const signature = signParams(params);
    const url = new URL(`${baseUrl}/payment/getStatus`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
    });
    url.searchParams.append("s", signature);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error("Error getting Flow payment status");
    }

    return response.json();
}
