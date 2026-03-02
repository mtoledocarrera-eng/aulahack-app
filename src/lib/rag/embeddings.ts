import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "gemini-embedding-001";

export class EmbeddingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EmbeddingError";
    }
}

function getGoogleAI() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new EmbeddingError("GOOGLE_GENERATIVE_AI_API_KEY no está configurada.");
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Genera un vector (embedding) para el texto dado usando Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const google = getGoogleAI();
        const model = google.getGenerativeModel({ model: EMBEDDING_MODEL });

        const result = await model.embedContent(text);
        const embedding = result.embedding;

        return embedding.values;
    } catch (error) {
        console.error("[Embeddings] Error al generar embedding:", error);
        throw new EmbeddingError("Fallo al generar el vector de embeddings.");
    }
}

/**
 * Calcula la similitud del coseno entre dos vectores (entre -1 y 1).
 * 1 significa idénticos, 0 ortogonales, -1 opuestos.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new EmbeddingError("Los vectores deben tener la misma longitud para calcular la similitud.");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return 0; // Evitar división por cero
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
