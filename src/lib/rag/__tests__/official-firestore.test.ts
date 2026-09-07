import { formatOfficialOA, normalizeCurriculumText, splitSubjects, searchOfficialCurriculum, verifyOfficialReferences } from "../official-firestore";
import { getDocsFromServer, getDocFromServer } from "firebase/firestore";

jest.mock("@/lib/firebase", () => ({ getFirebaseDb: jest.fn(() => ({})) }));
jest.mock("firebase/firestore", () => ({
    collection: jest.fn(), query: jest.fn(), where: jest.fn(), doc: jest.fn(),
    getDocsFromServer: jest.fn(), getDocFromServer: jest.fn(),
}));

// Datos sintéticos para probar el transporte; no constituyen currículum oficial.
const entry = { id: "test-1", numero: "4", descripcion: "Texto de prueba.\nSin cambios.", asignatura: "Matemática", curso: "6° Básico" };
const snapshot = (entries: typeof entry[]) => ({
    empty: entries.length === 0,
    docs: entries.map((item) => ({ id: item.id, data: () => item })),
});

beforeEach(() => jest.clearAllMocks());

describe("official curriculum helpers", () => {
    it("normaliza ordinales, acentos y espacios", () => {
        expect(normalizeCurriculumText("  6° BÁSICO  ")).toBe("6 basico");
    });

    it("separa las cuatro áreas sin dividir los nombres compuestos", () => {
        expect(splitSubjects("Lenguaje y Comunicación, Matemática, Ciencias Naturales e Historia"))
            .toEqual(["lenguaje", "matematica", "ciencias", "historia"]);
        expect(splitSubjects("Historia, Geografía y Ciencias Sociales; Educación Física y Salud"))
            .toEqual(["historia", "educacion fisica"]);
        expect(splitSubjects("Lenguaje, ciencias y matemáticas"))
            .toEqual(["lenguaje", "ciencias", "matematica"]);
    });

    it("preserva códigos completos y saltos de línea", () => {
        expect(formatOfficialOA({ ...entry, numero: "MA06 OA 04" }))
            .toBe(`MA06 OA 04 (Matemática): ${entry.descripcion}`);
    });

    it("formatea el OA sin alterar su texto oficial", () => {
        expect(formatOfficialOA({
            id: "LC-6B-OA04",
            numero: "4",
            descripcion: "Leer y comprender textos no literarios.",
            asignatura: "Lenguaje y Comunicación",
            curso: "6° Básico",
        })).toBe("OA 4 (Lenguaje y Comunicación): Leer y comprender textos no literarios.");
    });
});

describe("consulta oficial", () => {
    it("recupera cada asignatura solicitada y conserva el texto", async () => {
        const entries = ["Lenguaje y Comunicación", "Matemática", "Ciencias Naturales", "Historia, Geografía y Ciencias Sociales"]
            .map((asignatura, i) => ({ ...entry, id: `test-${i}`, asignatura }));
        (getDocsFromServer as jest.Mock).mockResolvedValue(snapshot(entries));
        const result = await searchOfficialCurriculum("6° Básico", "Lenguaje y Comunicación, Matemática, Ciencias Naturales e Historia");
        expect(result.available).toBe(true);
        expect(result.entries).toHaveLength(4);
        expect(result.entries[0].descripcion).toBe(entry.descripcion);
    });

    it("distingue cobertura incompleta de indisponibilidad", async () => {
        (getDocsFromServer as jest.Mock).mockResolvedValue(snapshot([entry]));
        await expect(searchOfficialCurriculum("6° Básico", "Matemática e Historia"))
            .resolves.toMatchObject({ available: true, entries: [] });
        (getDocsFromServer as jest.Mock).mockRejectedValue(new Error("unavailable"));
        await expect(searchOfficialCurriculum("6° Básico", "Matemática"))
            .resolves.toMatchObject({ available: false, entries: [] });
    });

    it("normaliza el ordinal si la consulta exacta está vacía", async () => {
        (getDocsFromServer as jest.Mock)
            .mockResolvedValueOnce(snapshot([]))
            .mockResolvedValueOnce(snapshot([{ ...entry, curso: "6º Básico" }]));
        const result = await searchOfficialCurriculum("6° Básico", "Matemática");
        expect(result.entries).toHaveLength(1);
    });

    it("excluye registros sin código y niveles diferentes", async () => {
        (getDocsFromServer as jest.Mock).mockResolvedValue(snapshot([
            { ...entry, numero: "" }, { ...entry, curso: "5° Básico" },
        ]));
        await expect(searchOfficialCurriculum("6° Básico", "Matemática"))
            .resolves.toMatchObject({ available: true, entries: [] });
    });

    it("rechaza referencias cuyo texto fue alterado por el cliente", async () => {
        (getDocFromServer as jest.Mock).mockResolvedValue({ exists: () => true, id: entry.id, data: () => entry });
        await expect(verifyOfficialReferences([entry])).resolves.toEqual([expect.objectContaining(entry)]);
        await expect(verifyOfficialReferences([{ ...entry, descripcion: "Inventado" }])).resolves.toBeNull();
    });
});
