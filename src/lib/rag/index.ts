/**
 * RAG Local (MVP) — Currículum Chileno
 *
 * Utiliza embeddings de Gemini (gemini-embedding-001) guardados en
 * un archivo local (vector-store.json) y compara con la query
 * mediante similitud del coseno.
 */

import { CURRICULUM_DATA, type CurriculumEntry } from "./curriculum-data";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import vectorStoreData from "./vector-store.json";

export interface RAGSearchResult {
    entries: CurriculumEntry[];
    confidence: number;
    source: string;
}

// Interfaz para la data de nuestro JSON
interface VectorStoreEntry {
    id: string;
    embedding: number[];
}

const vectorStore: VectorStoreEntry[] = vectorStoreData as VectorStoreEntry[];

/**
 * Busca OAs semánticamente en la base curricular usando Embeddings.
 * 
 * @param nivel Nivel educativo (ej. "1° Básico")
 * @param asignatura Asignatura (ej. "Matemática")
 * @param searchTerm Tema opcional descrito por el docente
 */
export async function searchCurriculum(
    nivel: string,
    asignatura: string,
    searchTerm?: string
): Promise<RAGSearchResult> {
    const normalizedNivel = nivel.toLowerCase().trim();
    const normalizedAsignatura = asignatura.toLowerCase().trim();

    // 1. Filtrado duro por nivel y asignatura
    const allowedIds = new Set(
        CURRICULUM_DATA
            .filter(e => e.nivel.toLowerCase().includes(normalizedNivel) && e.asignatura.toLowerCase().includes(normalizedAsignatura))
            .map(e => e.id)
    );

    // Si no hay candidatos, salimos rápido
    if (allowedIds.size === 0) {
        return { entries: [], confidence: 0, source: "Local Vector Store" };
    }

    let topCandidates: CurriculumEntry[] = [];
    let confidence = 0.5; // Baseline confidence

    if (searchTerm && searchTerm.trim().length > 0) {
        // 2. Búsqueda Semántica utilizando IA
        try {
            // Contexto rico para el embedding de búsqueda
            const queryText = `Nivel: ${nivel}. Asignatura: ${asignatura}. Búsqueda sobre: ${searchTerm}`;
            const queryEmbedding = await generateEmbedding(queryText);

            // Calcular similitud contra nuestro vector store
            const scored = vectorStore
                .filter(v => allowedIds.has(v.id))
                .map(v => ({
                    id: v.id,
                    score: cosineSimilarity(queryEmbedding, v.embedding)
                }))
                .sort((a, b) => b.score - a.score); // Orden descendente

            // Retornar el Top 3 que supere un threshold mínimo para evitar alucinaciones
            const SIMILARITY_THRESHOLD = 0.60;
            const topScored = scored.filter(s => s.score >= SIMILARITY_THRESHOLD).slice(0, 3);

            topCandidates = topScored
                .map(s => CURRICULUM_DATA.find(e => e.id === s.id)!)
                .filter(Boolean);

            if (topScored.length > 0) {
                confidence = topScored[0].score; // Usar el score del mejor match
            }
        } catch (error) {
            console.warn("[RAG] Falló la búsqueda semántica, usando full text search local como fallback", error);
            // Fallback: Full text search simple
            const term = searchTerm.toLowerCase();
            topCandidates = CURRICULUM_DATA
                .filter(e => allowedIds.has(e.id))
                .filter(e => e.oa.toLowerCase().includes(term) || e.descripcion.toLowerCase().includes(term) || e.indicadores.some(ind => ind.toLowerCase().includes(term)))
                .slice(0, 3);
        }
    } else {
        // Si no hay descriptor, solo devuelvo los OAs de la asignatura
        topCandidates = CURRICULUM_DATA
            .filter(e => allowedIds.has(e.id))
            .slice(0, 5); // limitar a 5 para no reventar contexto
    }

    return {
        entries: topCandidates,
        confidence,
        source: "Local Vector Store (RAG)",
    };
}

/**
 * Obtiene todos los niveles disponibles en la base curricular.
 */
export function getAvailableNiveles(): string[] {
    const niveles = new Set(CURRICULUM_DATA.map((e) => e.nivel));
    return Array.from(niveles).sort();
}

/**
 * Obtiene todas las asignaturas disponibles para un nivel.
 */
export function getAsignaturasByNivel(nivel: string): string[] {
    const asignaturas = new Set(
        CURRICULUM_DATA
            .filter((e) => e.nivel.toLowerCase() === nivel.toLowerCase())
            .map((e) => e.asignatura)
    );
    return Array.from(asignaturas).sort();
}
