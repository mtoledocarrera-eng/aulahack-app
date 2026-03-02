import fs from "fs";
import path from "path";
import { generateEmbedding } from "./embeddings";
import { CURRICULUM_DATA } from "./curriculum-data";

/**
 * Script utilitario para regerar la DB vectorial JSON.
 * Lee CURRICULUM_DATA y genera embeddings llamando a Gemini para cada OA,
 * luego guarda el resultado en `vector-store.json`.
 */
async function buildVectorStore() {
    console.log("Iniciando construcción Vectorial Híbrida...");
    console.log(`Tenemos ${CURRICULUM_DATA.length} entradas curriculares por vectorizar.`);

    const vectorStore: { id: string; embedding: number[] }[] = [];

    for (let i = 0; i < CURRICULUM_DATA.length; i++) {
        const entry = CURRICULUM_DATA[i];
        console.log(`[${i + 1}/${CURRICULUM_DATA.length}] Procesando ${entry.id}...`);

        // Contexto engrosado para asegurar alta dimensionalidad
        const textToEmbed = `Nivel: ${entry.nivel}. Asignatura: ${entry.asignatura}. Eje: ${entry.eje}. OA: ${entry.oa}. Descripción: ${entry.descripcion}. Indicadores: ${entry.indicadores.join(", ")}`;

        try {
            const embedding = await generateEmbedding(textToEmbed);
            vectorStore.push({
                id: entry.id,
                embedding
            });
            // Pequeña espera para no quebrar el Rate-Limit de la API de Embeedings de Gemini
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            console.error(`Error generando embedding para ${entry.id}:`, error);
        }
    }

    const jsonPath = path.join(process.cwd(), "src/lib/rag/vector-store.json");
    fs.writeFileSync(jsonPath, JSON.stringify(vectorStore, null, 2), "utf-8");
    console.log(`¡Construcción finalizada! ${vectorStore.length} vectores guardados exitosamente.`);
}

buildVectorStore().catch(console.error);
