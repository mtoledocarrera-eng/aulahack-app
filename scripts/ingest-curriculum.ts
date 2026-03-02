import * as fs from 'fs';
import * as path from 'path';
import { CURRICULUM_DATA } from '../src/lib/rag/curriculum-data';
import { generateEmbedding } from '../src/lib/rag/embeddings';

// Polyfill para fetch si es necesario en Node (idealmente usando tsx o nodemon con fetch expuesto o Node 18+)

// Interfaz para nuestro store
export interface VectorStoreEntry {
    id: string; // ID del OA
    embedding: number[];
}

const VECTOR_STORE_PATH = path.join(__dirname, '../src/lib/rag/vector-store.json');

async function main() {
    console.log("Iniciando ingesta de currículum...");
    console.log(`Total de OAs a procesar: ${CURRICULUM_DATA.length}`);

    // Cargar store existente si hay para no rehacer todo (opcional, pero ayuda a la idempotencia)
    let existingStore: VectorStoreEntry[] = [];
    if (fs.existsSync(VECTOR_STORE_PATH)) {
        console.log("Cargando store existente...");
        const fileContent = fs.readFileSync(VECTOR_STORE_PATH, 'utf-8');
        try {
            existingStore = JSON.parse(fileContent);
        } catch (e) {
            console.warn("Store existente corrupto. Se creará uno nuevo.");
        }
    }

    const newStore: VectorStoreEntry[] = [...existingStore];
    let addedCount = 0;

    for (let i = 0; i < CURRICULUM_DATA.length; i++) {
        const entry = CURRICULUM_DATA[i];

        // Skip si ya existe
        if (newStore.some(e => e.id === entry.id)) {
            console.log(`[${i + 1}/${CURRICULUM_DATA.length}] Saltando ${entry.id} (Ya vectorizado)`);
            continue;
        }

        // Crear una representación textual rica para el embedding
        const textToEmbed = `
        Nivel: ${entry.nivel}
        Asignatura: ${entry.asignatura}
        Eje: ${entry.eje}
        Objetivo de Aprendizaje: ${entry.oa}
        Descripción: ${entry.descripcion}
        Indicadores: ${entry.indicadores.join('. ')}
        `.trim();

        console.log(`[${i + 1}/${CURRICULUM_DATA.length}] Vectorizando ${entry.id}...`);

        try {
            // Un pequeño retraso para no saturar la API (Rate Limit handling básico)
            await new Promise(resolve => setTimeout(resolve, 500));

            const embedding = await generateEmbedding(textToEmbed);

            newStore.push({
                id: entry.id,
                embedding
            });
            addedCount++;
        } catch (error) {
            console.error(`Error procesando ${entry.id}:`, error);
            // Paramos si hay error duro, o seguimos pero avisamos. Paramos es más seguro.
            console.log("Guardando progreso parcial antes de salir...");
            fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(newStore, null, 2));
            process.exit(1);
        }
    }

    // Guardar resultado final
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(newStore, null, 2));

    console.log(`Ingesta completada. ${addedCount} nuevos OAs vectorizados. Total en store: ${newStore.length}`);
}

main().catch(console.error);
