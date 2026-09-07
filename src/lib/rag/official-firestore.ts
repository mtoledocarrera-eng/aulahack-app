/**
 * Fuente curricular oficial compartida con APP_Curricular.
 *
 * APP_Curricular y 360Hacks usan el mismo proyecto Firebase. Esta consulta
 * prioriza la colección que APP_Curricular ingesta desde documentos oficiales
 * del MINEDUC antes de utilizar el RAG local como apoyo.
 */
import {
    collection,
    getDocsFromServer,
    getDocFromServer,
    doc,
    query,
    where,
    type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

const COLLECTION_NAME = "objetivos_aprendizaje";

export interface OfficialCurriculumEntry {
    id: string;
    numero: string;
    descripcion: string;
    asignatura: string;
    curso: string;
    eje?: string;
    es_basal?: boolean;
}

export interface OfficialCurriculumSearchResult {
    entries: OfficialCurriculumEntry[];
    confidence: number;
    source: "Firestore oficial" | "Firestore oficial no disponible";
    available: boolean;
    error?: string;
}

export function normalizeCurriculumText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[º°]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSubject(value: string): string {
    return normalizeCurriculumText(value)
        .replace(/\b(lengua|lenguaje)\s+y\s+comunicacion\b/g, "lenguaje")
        .replace(/\bciencias\s+naturales\b/g, "ciencias")
        .replace(/\bmatematicas\b/g, "matematica")
        .replace(/\bhistoria\s*,?\s*geografia\s+y\s+ciencias\s+sociales\b/g, "historia")
        .replace(/\beducacion\s+fisica\s+y\s+salud\b/g, "educacion fisica")
        .trim();
}

export function splitSubjects(asignatura: string): string[] {
    // Historia tiene una coma interna; proteger el nombre completo antes de separar.
    const normalized = normalizeCurriculumText(asignatura)
        .replace(/historia,\s*geografia\s+y\s+ciencias\s+sociales/g, "historia_geografia_ciencias_sociales");
    return [...new Set(normalized
        .split(/[,;/]|\s+[ye]\s+(?=(?:matem|lenguaje|ciencias|historia|tecnologia|educacion|ingles|artes|musica|orientacion))/)
        .map((part) => normalizeSubject(part.trim().replace(/historia_geografia_ciencias_sociales/g, "historia"))).filter(Boolean))];
}

function mapOfficialEntry(id: string, data: DocumentData): OfficialCurriculumEntry | null {
    const descripcion = typeof data.descripcion === "string" ? data.descripcion : "";
    const asignatura = typeof data.asignatura === "string" ? data.asignatura.trim() : "";
    const curso = typeof data.curso === "string" ? data.curso.trim() : "";
    const numero = String(data.numero ?? data.codigo ?? "").trim();
    if (!descripcion.trim() || !asignatura || !curso || !numero) return null;

    return {
        id,
        numero,
        descripcion,
        asignatura,
        curso,
        eje: typeof data.eje === "string" ? data.eje.trim() : undefined,
        es_basal: typeof data.es_basal === "boolean" ? data.es_basal : undefined,
    };
}

function scoreEntry(entry: OfficialCurriculumEntry, purpose: string): number {
    const haystack = normalizeCurriculumText(`${entry.numero} ${entry.descripcion} ${entry.eje ?? ""}`);
    const tokens = normalizeCurriculumText(purpose)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4);
    if (tokens.length === 0) return 0;
    return tokens.filter((token) => haystack.includes(token)).length / tokens.length;
}

/** Recupera OAs oficiales para un nivel y una o varias asignaturas. */
export async function searchOfficialCurriculum(
    nivel: string,
    asignatura: string,
    purpose?: string,
): Promise<OfficialCurriculumSearchResult> {
    if (!nivel.trim() || !asignatura.trim()) {
        return { entries: [], confidence: 0, source: "Firestore oficial", available: true };
    }

    try {
        const db = getFirebaseDb();
        const curriculum = collection(db, COLLECTION_NAME);
        let snapshot = await getDocsFromServer(query(curriculum, where("curso", "==", nivel.trim())));
        // Permite diferencias de ordinal (º/°) o espacios sin exigir un índice compuesto.
        if (snapshot.empty) snapshot = await getDocsFromServer(curriculum);

        const requestedSubjects = splitSubjects(asignatura);
        const allEntries = snapshot.docs
            .map((docSnap) => mapOfficialEntry(docSnap.id, docSnap.data()))
            .filter((entry): entry is OfficialCurriculumEntry => entry !== null)
            .filter((entry) => {
                const subject = normalizeSubject(entry.asignatura);
                return requestedSubjects.includes(subject)
                    && normalizeCurriculumText(entry.curso) === normalizeCurriculumText(nivel);
            });

        const ranked = allEntries
            .map((entry) => ({ entry, score: scoreEntry(entry, purpose ?? "") }))
            .sort((a, b) => b.score - a.score || a.entry.numero.localeCompare(b.entry.numero));
        // Dos OAs por área evitan que una asignatura desplace a las demás.
        const entries = requestedSubjects.flatMap((subject) => ranked
            .filter(({ entry }) => normalizeSubject(entry.asignatura) === subject)
            .slice(0, 2).map(({ entry }) => entry));
        // Una cobertura parcial no permite declarar alineación de todas las áreas.
        const complete = requestedSubjects.every((subject) =>
            entries.some((entry) => normalizeSubject(entry.asignatura) === subject));

        return {
            entries: complete ? entries : [],
            confidence: ranked.length > 0 ? ranked[0].score : 0,
            source: "Firestore oficial",
            available: true,
        };
    } catch (error) {
        return {
            entries: [],
            confidence: 0,
            source: "Firestore oficial no disponible",
            available: false,
            error: error instanceof Error ? error.message : "Error desconocido al consultar Firestore",
        };
    }
}

export function formatOfficialOA(entry: OfficialCurriculumEntry): string {
    const code = /^\d+$/.test(entry.numero) ? `OA ${entry.numero}` : entry.numero;
    return `${code} (${entry.asignatura}): ${entry.descripcion}`;
}

/** Revalida referencias recibidas del navegador antes de conservar su sello oficial. */
export async function verifyOfficialReferences(
    references: OfficialCurriculumEntry[],
): Promise<OfficialCurriculumEntry[] | null> {
    if (!references.length || references.length > 40) return null;
    try {
        const db = getFirebaseDb();
        const verified = await Promise.all(references.map(async (reference) => {
            const snapshot = await getDocFromServer(doc(db, COLLECTION_NAME, reference.id));
            if (!snapshot.exists()) return null;
            const entry = mapOfficialEntry(snapshot.id, snapshot.data());
            if (!entry || entry.numero !== reference.numero || entry.descripcion !== reference.descripcion
                || entry.curso !== reference.curso || entry.asignatura !== reference.asignatura) return null;
            return entry;
        }));
        return verified.every((entry) => entry !== null) ? verified : null;
    } catch {
        return null;
    }
}
