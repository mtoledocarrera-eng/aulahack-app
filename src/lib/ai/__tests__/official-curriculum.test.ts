import { analyzeTeacherInput, buildGenerationConfig, generateProjectPlan, iterateProjectPlan } from "../flip-engine";
import { searchOfficialCurriculum, verifyOfficialReferences } from "@/lib/rag/official-firestore";
import { searchCurriculum } from "@/lib/rag";
import type { ProjectPlan } from "../schemas";

const mockGenerateContent = jest.fn();
jest.mock("@google/generative-ai", () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    })),
}));
jest.mock("@/lib/rag", () => ({ searchCurriculum: jest.fn() }));
jest.mock("@/lib/rag/official-firestore", () => ({
    ...jest.requireActual("@/lib/rag/official-firestore"),
    searchOfficialCurriculum: jest.fn(), verifyOfficialReferences: jest.fn(),
}));
jest.mock("@/lib/firebase/analytics", () => ({ logAnalyticsEvent: jest.fn().mockResolvedValue(undefined) }));

// Fixtures sintéticas: las fuentes externas y la IA están simuladas.
const official = { id: "fixture", numero: "4", descripcion: "Texto curricular de prueba.", asignatura: "Matemática", curso: "6° Básico" };
const input = { nivel: "6° Básico", asignatura: "Matemática", proposito: "Analizar evidencias y proponer mejoras" };
const phase = { titulo: "Fase", duracion: "30 min", tiempo_estimado_minutos: 30, descripcion_actividad_estudiante: "Actividad", rol_docente: "Mediar", tips_gestion_aula: "Turnos", recursos: [] };
const modelPlan: ProjectPlan = {
    titulo: "Proyecto", nivel: input.nivel, asignaturas_involucradas: [input.asignatura],
    oas_sugeridos: ["OA inventado por el modelo"], oas_oficiales_verificados: [official], fuente_curricular: "Firestore oficial",
    conexiones_interdisciplinarias: ["Comparar evidencias de la escuela"],
    habilidades_desarrolladas: ["Analizar"], indicador_desarrollo_personal_social: "Participación", duracion_total: "90 min",
    fase_preparacion: phase, fase_investigacion_accion: phase, fase_sintesis_metacognicion: phase,
    evaluacion: { estrategia_formativa: "Feedback", instrumento_calificacion: "Rúbrica", criterios: ["Evidencias"] },
    adecuaciones_dua: { representacion: "Visual", accion_expresion: "Oral", compromiso: "Elección", ajustes_ambientales_y_sensoriales_tea: "Anticipación" },
    recursos_generales: [], guia_docente: { estrategia_motivacional: "Desafío", posibles_obstaculos_y_soluciones: "Apoyos", conexiones_vida_real: "Escuela" },
};
const previousKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
beforeAll(() => { process.env.GOOGLE_GENERATIVE_AI_API_KEY = "mock-only"; });
afterAll(() => {
    if (previousKey === undefined) delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    else process.env.GOOGLE_GENERATIVE_AI_API_KEY = previousKey;
});
beforeEach(() => {
    jest.clearAllMocks();
    (searchOfficialCurriculum as jest.Mock).mockResolvedValue({ available: true, entries: [official] });
    mockGenerateContent.mockResolvedValue({ response: { text: () => JSON.stringify(modelPlan) } });
});

it("configura Gemini 3.x con thinkingLevel sin parámetros legacy", () => {
    const previousThinkingLevel = process.env.AI_THINKING_LEVEL;
    process.env.AI_THINKING_LEVEL = "low";
    expect(buildGenerationConfig("gemini-3.8-flash")).toEqual({
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "low" },
    });
    if (previousThinkingLevel === undefined) delete process.env.AI_THINKING_LEVEL;
    else process.env.AI_THINKING_LEVEL = previousThinkingLevel;
});

it("exige nivel y asignatura antes de consultar o generar", async () => {
    await expect(generateProjectPlan({ ...input, nivel: " " })).rejects.toMatchObject({ code: 422 });
    await expect(analyzeTeacherInput({ proposito: input.proposito })).resolves.toMatchObject({ readyToGenerate: false, needsMoreInfo: true });
    expect(searchOfficialCurriculum).not.toHaveBeenCalled();
    expect(mockGenerateContent).not.toHaveBeenCalled();
});

it("no usa RAG local ni IA si Firestore responde sin coincidencias", async () => {
    (searchOfficialCurriculum as jest.Mock).mockResolvedValue({ available: true, entries: [] });
    await expect(generateProjectPlan(input)).rejects.toMatchObject({ code: 422 });
    await expect(analyzeTeacherInput(input)).rejects.toMatchObject({ code: 422 });
    expect(searchCurriculum).not.toHaveBeenCalled();
    expect(mockGenerateContent).not.toHaveBeenCalled();
});

it("sustituye los OAs del modelo por las referencias oficiales recuperadas", async () => {
    const result = await generateProjectPlan(input);
    expect(result.oas_sugeridos).toEqual(["OA 4 (Matemática): Texto curricular de prueba."]);
    expect(result.oas_oficiales_verificados).toEqual([official]);
    expect(result.conexiones_interdisciplinarias).toEqual(modelPlan.conexiones_interdisciplinarias);
    expect(result.alineacion_oas).toHaveLength(1);
    expect(result.alineacion_oas?.[0]).toMatchObject({ numero: official.numero, asignatura: official.asignatura });
    expect(result.alineacion_oas?.[0].actividad).toBe(modelPlan.fase_investigacion_accion.descripcion_actividad_estudiante);
    expect(result.evaluacion.evidencia_individual).toContain("Registro individual");
    expect(result.ciclo_aprendizaje?.hipotesis_conjetura_inicial).toContain("predicción");
    expect(result.ciclo_aprendizaje?.preguntas_metacognitivas).toHaveLength(2);
    expect(searchCurriculum).not.toHaveBeenCalled();
});

it("la contingencia no acepta una declaración oficial generada por IA", async () => {
    (searchOfficialCurriculum as jest.Mock).mockResolvedValue({ available: false, entries: [] });
    (searchCurriculum as jest.Mock).mockResolvedValue({ source: "local", entries: [{ oa: "OA 1", descripcion: "Referencia local", asignatura: "Matemática", indicadores: [] }] });
    const result = await generateProjectPlan(input);
    expect(result.fuente_curricular).toBe("RAG local de apoyo (validación pendiente)");
    expect(result.oas_oficiales_verificados).toEqual([]);
    expect(result.oas_sugeridos).toEqual(["OA 1 (Matemática): Referencia local"]);
});

it("sin ninguna fuente devuelve 503 y no inventa un OA virtual", async () => {
    (searchOfficialCurriculum as jest.Mock).mockResolvedValue({ available: false, entries: [] });
    (searchCurriculum as jest.Mock).mockResolvedValue({ entries: [] });
    await expect(generateProjectPlan(input)).rejects.toMatchObject({ code: 503 });
    expect(mockGenerateContent).not.toHaveBeenCalled();
});

it("al iterar revalida y conserva los OAs aunque la IA los cambie", async () => {
    (verifyOfficialReferences as jest.Mock).mockResolvedValue([official]);
    const result = await iterateProjectPlan(modelPlan, "Mejorar la retroalimentación");
    expect(verifyOfficialReferences).toHaveBeenCalledWith([official]);
    expect(result.oas_sugeridos).toEqual(["OA 4 (Matemática): Texto curricular de prueba."]);
    expect(result.oas_oficiales_verificados).toEqual([official]);
    expect(result.ciclo_aprendizaje?.revision_mejora).toContain("segundo intento");
});

it("impide iterar con una referencia oficial que no pudo revalidarse", async () => {
    (verifyOfficialReferences as jest.Mock).mockResolvedValue(null);
    await expect(iterateProjectPlan(modelPlan, "Mejorar")).rejects.toMatchObject({ code: 503 });
    expect(mockGenerateContent).not.toHaveBeenCalled();
});
