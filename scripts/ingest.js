const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const EMBEDDING_MODEL = "gemini-embedding-001";

const CURRICULUM_DATA = [
    { id: "LC-1B-OA01", nivel: "1° Básico", asignatura: "Lenguaje y Comunicación", eje: "Lectura", oa: "OA 1", descripcion: "Reconocer que los textos escritos transmiten mensajes y que son escritos por alguien para cumplir un propósito.", indicadores: ["Distinguen entre imagen y texto escrito", "Siguen con el dedo las líneas de un texto mientras escuchan la lectura", "Identifican lo que transmite un texto familiar"] },
    { id: "LC-1B-OA04", nivel: "1° Básico", asignatura: "Lenguaje y Comunicación", eje: "Lectura", oa: "OA 4", descripcion: "Leer palabras aisladas y en contexto, aplicando su conocimiento de la correspondencia letra-sonido en diferentes combinaciones: sílaba directa, indirecta o compleja.", indicadores: ["Leen palabras que contienen una o más vocales y consonantes en estudio", "Leen algunas palabras de uso frecuente necesarias para la comprensión de textos", "Leen frases cortas"] },
    { id: "MA-1B-OA01", nivel: "1° Básico", asignatura: "Matemática", eje: "Números y Operaciones", oa: "OA 1", descripcion: "Contar números del 0 al 100, de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atrás.", indicadores: ["Cuentan de 1 en 1 hacia adelante y hacia atrás a partir de un número dado", "Cuentan de 2 en 2, de 5 en 5 y de 10 en 10 hacia adelante", "Cuentan de 10 en 10 hacia atrás a partir de un número dado"] },
    { id: "MA-1B-OA09", nivel: "1° Básico", asignatura: "Matemática", eje: "Números y Operaciones", oa: "OA 9", descripcion: "Demostrar que comprende la adición y la sustracción de números del 0 al 20, progresivamente.", indicadores: ["Determinan las partes de un todo, identificando las cantidades", "Representan adiciones y sustracciones con material concreto y pictórico", "Resuelven problemas de adición y sustracción en contextos familiares"] },
    { id: "CN-3B-OA01", nivel: "3° Básico", asignatura: "Ciencias Naturales", eje: "Ciencias de la Vida", oa: "OA 1", descripcion: "Observar y describir, por medio de la investigación experimental, las necesidades de las plantas y su relación con la raíz, el tallo y las hojas.", indicadores: ["Identifican las necesidades de las plantas (agua, luz, aire, suelo)", "Describen la función de las partes de la planta", "Realizan experimentos simples y registran observaciones"] },
    { id: "HI-4B-OA01", nivel: "4° Básico", asignatura: "Historia, Geografía y Ciencias Sociales", eje: "Historia", oa: "OA 1", descripcion: "Describir la civilización maya, considerando ubicación geográfica, organización política, actividades económicas, formas de cultivo y expresiones culturales.", indicadores: ["Ubican en el mapa la zona geográfica que habitaron los mayas", "Describen las principales características de la organización política maya", "Identifican las expresiones culturales más importantes"] },
    { id: "LC-6B-OA03", nivel: "6° Básico", asignatura: "Lenguaje y Comunicación", eje: "Lectura", oa: "OA 3", descripcion: "Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión.", indicadores: ["Explican las actitudes y reacciones de los personajes de acuerdo con sus motivaciones", "Describen el ambiente y las costumbres representadas en el texto", "Relacionan situaciones de la vida cotidiana con los temas y personajes"] },
    { id: "MA-8B-OA01", nivel: "8° Básico", asignatura: "Matemática", eje: "Números y Operaciones", oa: "OA 1", descripcion: "Mostrar que comprenden las operaciones con números enteros, utilizando representaciones pictóricas y simbólicas.", indicadores: ["Resuelven adiciones y sustracciones con números enteros", "Resuelven multiplicaciones y divisiones con números enteros", "Aplican las propiedades de las operaciones en la resolución de problemas"] },
    { id: "LC-1M-OA02", nivel: "1° Medio", asignatura: "Lengua y Literatura", eje: "Lectura", oa: "OA 2", descripcion: "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias.", indicadores: ["Interpretan el sentido global de los textos leídos", "Analizan la visión de mundo que presentan las obras", "Relacionan las obras leídas con sus experiencias personales"] },
    { id: "EF-1B-OA01", nivel: "1° Básico", asignatura: "Educación Física y Salud", eje: "Habilidades Motrices", oa: "OA 1", descripcion: "Demostrar habilidades motrices básicas de locomoción, manipulación y estabilidad en una variedad de juegos y actividades físicas.", indicadores: ["Ejecutan desplazamientos como caminar, correr, saltar en diferentes direcciones", "Lanzan y reciben objetos de diferentes tamaños", "Mantienen el equilibrio en posiciones estáticas y dinámicas"] },
    { id: "EF-3B-OA03", nivel: "3° Básico", asignatura: "Educación Física y Salud", eje: "Vida Activa y Saludable", oa: "OA 3", descripcion: "Practicar actividades físicas en forma segura, demostrando la adquisición de hábitos de higiene, posturales y de vida saludable.", indicadores: ["Identifican la importancia de la actividad física para la salud", "Practican hábitos de higiene antes y después del ejercicio", "Describen los beneficios de una vida activa"] },
    { id: "MU-2B-OA01", nivel: "2° Básico", asignatura: "Música", eje: "Escuchar y Apreciar", oa: "OA 1", descripcion: "Escuchar cualidades del sonido (altura, timbre, intensidad, duración) y elementos del lenguaje musical (pulsos, acentos, patrones rítmicos).", indicadores: ["Distinguen sonidos agudos y graves", "Identifican instrumentos por su timbre", "Siguen patrones rítmicos con palmas o instrumentos de percusión"] },
    { id: "MU-4B-OA04", nivel: "4° Básico", asignatura: "Música", eje: "Interpretar y Crear", oa: "OA 4", descripcion: "Cantar al unísono y a más voces y tocar instrumentos de percusión, melódicos y/o armónicos.", indicadores: ["Cantan canciones a una y dos voces con afinación adecuada", "Tocan instrumentos de percusión manteniendo el pulso", "Crean acompañamientos rítmicos simples para canciones conocidas"] },
    { id: "AV-2B-OA01", nivel: "2° Básico", asignatura: "Artes Visuales", eje: "Expresar y Crear Visualmente", oa: "OA 1", descripcion: "Expresar y crear trabajos de arte a partir de la observación del entorno natural, cultural y artístico, utilizando materiales, herramientas y procedimientos de las artes visuales.", indicadores: ["Observan y describen elementos del entorno natural y cultural", "Experimentan con diversos materiales y herramientas", "Crean trabajos visuales usando el color, la forma y la textura"] },
    { id: "AV-5B-OA03", nivel: "5° Básico", asignatura: "Artes Visuales", eje: "Apreciar y Responder", oa: "OA 3", descripcion: "Describir sus observaciones de obras de arte y objetos, usando elementos del lenguaje visual y expresando lo que sienten y piensan.", indicadores: ["Describen obras de arte usando vocabulario apropiado", "Expresan opiniones sobre obras de arte fundamentándolas", "Comparan obras de arte de diferentes épocas y culturas"] },
    { id: "IN-3B-OA01", nivel: "3° Básico", asignatura: "Inglés", eje: "Comprensión Auditiva", oa: "OA 1", descripcion: "Comprender textos orales breves y simples como cuentos y rimas, identificando temas e ideas generales.", indicadores: ["Identifican palabras y expresiones clave en textos orales simples", "Siguen instrucciones simples en inglés", "Comprenden preguntas simples sobre temas familiares"] },
    { id: "IN-5B-OA06", nivel: "5° Básico", asignatura: "Inglés", eje: "Expresión Oral", oa: "OA 6", descripcion: "Participar en diálogos, interacciones de la clase y exposiciones muy breves y simples, acerca de temas conocidos o de otras asignaturas.", indicadores: ["Presentan información simple sobre sí mismos y su entorno", "Participan en diálogos breves usando frases aprendidas", "Usan vocabulario temático y expresiones de uso frecuente"] },
    { id: "TE-4B-OA01", nivel: "4° Básico", asignatura: "Tecnología", eje: "Diseñar, Hacer y Probar", oa: "OA 1", descripcion: "Crear diseños de objetos o sistemas tecnológicos simples para resolver problemas, usando materiales y herramientas en forma segura.", indicadores: ["Identifican necesidades o problemas del entorno que pueden resolverse con tecnología", "Diseñan soluciones usando bocetos y modelos simples", "Construyen prototipos usando materiales reciclados o disponibles"] },
    { id: "TE-6B-OA02", nivel: "6° Básico", asignatura: "Tecnología", eje: "Tecnologías de la Información", oa: "OA 2", descripcion: "Usar herramientas digitales para buscar, acceder y procesar información de diversas fuentes, organizándola en forma clara.", indicadores: ["Buscan información en internet usando criterios de selección", "Evalúan la confiabilidad de fuentes digitales", "Organizan información usando herramientas digitales como presentaciones o documentos"] },
    { id: "CN-6B-OA11", nivel: "6° Básico", asignatura: "Ciencias Naturales", eje: "Ciencias Físicas y Químicas", oa: "OA 11", descripcion: "Explicar que la energía es necesaria para que los objetos cambien y los seres vivos realicen sus procesos vitales, y que la mayor parte de los recursos energéticos proviene del Sol.", indicadores: ["Identifican distintas formas de energía (cinética, solar, eléctrica)", "Explican transformaciones de energía en situaciones cotidianas", "Describen fuentes de energía renovables y no renovables"] },
    { id: "CN-6B-OA12", nivel: "6° Básico", asignatura: "Ciencias Naturales", eje: "Ciencias Físicas y Químicas", oa: "OA 12", descripcion: "Investigar y explicar los efectos de la fuerza y el movimiento en objetos, considerando la masa y la aceleración.", indicadores: ["Identifican diferentes tipos de fuerzas (gravedad, roce, magnética)", "Explican cómo la fuerza afecta el movimiento de los objetos", "Relacionan masa y aceleración en ejemplos cotidianos"] },
    { id: "HI-7B-OA01", nivel: "7° Básico", asignatura: "Historia, Geografía y Ciencias Sociales", eje: "Historia", oa: "OA 1", descripcion: "Explicar el proceso de hominización, reconociendo las principales etapas de la evolución de la especie humana, la influencia de factores geográficos, y la dispersión del Homo sapiens por el planeta.", indicadores: ["Describen las características de las principales especies de homínidos", "Identifican los factores geográficos que influyeron en la evolución humana", "Ubican en un mapa las rutas de dispersión del Homo sapiens"] },
    { id: "LC-2B-OA01", nivel: "2° Básico", asignatura: "Lenguaje y Comunicación", eje: "Lectura", oa: "OA 1", descripcion: "Leer textos breves en voz alta para adquirir fluidez.", indicadores: ["Leen con entonación", "Respetan puntos y comas", "Leen palabras de uso frecuente"] },
    { id: "MA-3B-OA01", nivel: "3° Básico", asignatura: "Matemática", eje: "Números", oa: "OA 1", descripcion: "Contar números hasta el 1.000.", indicadores: ["Cuentan de 10 en 10", "Cuentan de 100 en 100", "Identifican el valor posicional"] },
    { id: "AV-1B-OA01", nivel: "1° Básico", asignatura: "Artes Visuales", eje: "Expresión", oa: "OA 1", descripcion: "Expresar y crear trabajos de arte a partir de la observación del entorno natural.", indicadores: ["Usan diferentes colores", "Modelan con plasticina", "Dibujan elementos de la naturaleza"] },
    { id: "TE-1B-OA01", nivel: "1° Básico", asignatura: "Tecnología", eje: "Diseño", oa: "OA 1", descripcion: "Crear diseños de objetos tecnológicos simples.", indicadores: ["Dibujan soluciones", "Explican su diseño", "Usan materiales simples"] },
    { id: "MU-1B-OA01", nivel: "1° Básico", asignatura: "Música", eje: "Escuchar", oa: "OA 1", descripcion: "Escuchar y apreciar sonidos de la naturaleza.", indicadores: ["Identifican sonidos", "Ubican fuentes sonoras", "Describen sensaciones"] },
    { id: "EF-2B-OA01", nivel: "2° Básico", asignatura: "Educación Física y Salud", eje: "Habilidades", oa: "OA 1", descripcion: "Demostrar habilidades motrices básicas de locomoción.", indicadores: ["Trotan", "Saltan", "Giran"] },
    { id: "IN-1B-OA01", nivel: "1° Básico", asignatura: "Inglés", eje: "Aprender", oa: "OA 1", descripcion: "Comprender saludos y expresiones de cortesía.", indicadores: ["Dicen Hello", "Dicen Goodbye", "Identifican personajes"] },
    { id: "HI-1B-OA01", nivel: "1° Básico", asignatura: "Historia, Geografía y Ciencias Sociales", eje: "Historia", oa: "OA 1", descripcion: "Nombrar los días de la semana y meses del año.", indicadores: ["Identifican ayer hoy mañana", "Secuencian actividades", "Usan el calendario"] },
    { id: "CN-1B-OA01", nivel: "1° Básico", asignatura: "Ciencias Naturales", eje: "Ciencias", oa: "OA 1", descripcion: "Reconocer y observar los sentidos.", indicadores: ["Identifican órganos", "Relacionan sentido con función", "Practican autocuidado"] },
    { id: "LC-7B-OA01", nivel: "7° Básico", asignatura: "Lengua y Literatura", eje: "Lectura", oa: "OA 1", descripcion: "Leer habitualmente para aprender y recrearse.", indicadores: ["Seleccionan textos", "Analizan personajes", "Relacionan con contexto"] }
];

async function generateEmbeddingInfo(text) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY no está configurada.");

    const google = new GoogleGenerativeAI(apiKey);
    const model = google.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

const VECTOR_STORE_PATH = path.join(__dirname, '../src/lib/rag/vector-store.json');

async function main() {
    console.log("Iniciando ingesta de currículum (CommonJS SDK)...");

    let existingStore = [];
    if (fs.existsSync(VECTOR_STORE_PATH)) {
        try {
            existingStore = JSON.parse(fs.readFileSync(VECTOR_STORE_PATH, 'utf-8'));
        } catch (e) { }
    }

    const newStore = [...existingStore];
    let addedCount = 0;

    for (let i = 0; i < CURRICULUM_DATA.length; i++) {
        const entry = CURRICULUM_DATA[i];

        if (newStore.some(e => e.id === entry.id)) {
            console.log(`[${i + 1}/${CURRICULUM_DATA.length}] Saltando ${entry.id} (Ya vectorizado)`);
            continue;
        }

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
            const embedding = await generateEmbeddingInfo(textToEmbed);
            newStore.push({ id: entry.id, embedding });
            addedCount++;
            // guardamos progresivo para asegurar que no se pierda al fallar
            fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(newStore, null, 2));
            await new Promise(r => setTimeout(r, 1000));
        } catch (error) {
            console.error(`Error en ${entry.id}:`, error);
            process.exit(1);
        }
    }

    console.log(`Exito. ${newStore.length} totales en store.`);
}

main().catch(console.error);
