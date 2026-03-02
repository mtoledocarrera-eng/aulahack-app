/**
 * Tests: RAG Curricular — Motor de búsqueda mock/semántico
 */

import { searchCurriculum, getAvailableNiveles, getAsignaturasByNivel } from "../index";

describe("RAG Curricular", () => {
    describe("searchCurriculum", () => {
        it("encuentra OAs por nivel y asignatura exacta", async () => {
            const result = await searchCurriculum("1° Básico", "Matemática");
            expect(result.entries.length).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.source).toContain("Local Vector Store");

            result.entries.forEach((entry) => {
                expect(entry.nivel).toBe("1° Básico");
                expect(entry.asignatura).toBe("Matemática");
            });
        });

        it("encuentra OAs con búsqueda parcial de nivel", async () => {
            const result = await searchCurriculum("1°", "Matemática");
            expect(result.entries.length).toBeGreaterThan(0);
        });

        it("filtra por término de búsqueda adicional", async () => {
            const result = await searchCurriculum("1° Básico", "Matemática", "contar");
            expect(result.entries.length).toBeGreaterThan(0);
            const hasMatch = result.entries.some(
                (e) =>
                    e.descripcion.toLowerCase().includes("contar") ||
                    e.oa.toLowerCase().includes("contar") ||
                    e.indicadores.some(ind => ind.toLowerCase().includes("contar"))
            );
            expect(hasMatch).toBe(true);
        });

        it("retorna array vacío cuando no hay matches", async () => {
            const result = await searchCurriculum("12° Medio", "Astrología");
            expect(result.entries).toHaveLength(0);
            expect(result.confidence).toBe(0);
        });

        it("es case-insensitive en la búsqueda", async () => {
            const result1 = await searchCurriculum("1° BÁSICO", "MATEMÁTICA");
            const result2 = await searchCurriculum("1° básico", "matemática");
            expect(result1.entries.length).toBe(result2.entries.length);
        });
    });

    describe("getAvailableNiveles", () => {
        it("retorna listado de niveles sin duplicados", () => {
            const niveles = getAvailableNiveles();
            expect(niveles.length).toBeGreaterThan(0);
            const uniqueCount = new Set(niveles).size;
            expect(niveles.length).toBe(uniqueCount);
        });

        it("niveles están ordenados", () => {
            const niveles = getAvailableNiveles();
            const sorted = [...niveles].sort();
            expect(niveles).toEqual(sorted);
        });
    });

    describe("getAsignaturasByNivel", () => {
        it("retorna asignaturas para un nivel existente", () => {
            const asignaturas = getAsignaturasByNivel("1° Básico");
            expect(asignaturas.length).toBeGreaterThan(0);
            expect(asignaturas).toContain("Matemática");
        });

        it("retorna array vacío para nivel inexistente", () => {
            const asignaturas = getAsignaturasByNivel("99° Imaginario");
            expect(asignaturas).toHaveLength(0);
        });
    });
});
