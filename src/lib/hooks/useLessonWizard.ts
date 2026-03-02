import { useState, useCallback, useEffect } from "react";
import type { FlipResponse, TeacherInput, ProjectPlan, Worksheet, Rubric } from "@/lib/ai/schemas";
import { saveLessonPlan, updateLessonPlan } from "@/lib/firebase/firestore";
import { logAnalyticsEvent } from "@/lib/firebase/analytics";

export type WizardStep = "input" | "flip" | "generating" | "result";

export function useLessonWizard(user: any) {
    const [step, setStep] = useState<WizardStep>("input");
    const [input, setInput] = useState<TeacherInput>({
        proposito: "",
        nivel: "",
        asignatura: "",
        contexto: "",
    });

    // Core Data States
    const [flipResponse, setFlipResponse] = useState<FlipResponse | null>(null);
    const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null);

    // UI/Flow States
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isGeneratingWorksheet, setIsGeneratingWorksheet] = useState(false);
    const [showGradingMatrix, setShowGradingMatrix] = useState(false);

    // Persistence & Limits
    const [retryCountdown, setRetryCountdown] = useState(0);
    const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

    // Iteration State
    const [iterationFeedback, setIterationFeedback] = useState("");
    const [isIterating, setIsIterating] = useState(false);
    const [planVersion, setPlanVersion] = useState(1);

    // ─── Countdown timer para 429 ────────────────────────────
    const startRetryCountdown = useCallback((seconds: number) => {
        setRetryCountdown(seconds);
    }, []);

    useEffect(() => {
        if (retryCountdown <= 0) return;
        const timer = setInterval(() => {
            setRetryCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [retryCountdown]);

    useEffect(() => {
        // Cargar plan para editar desde el Historial
        const editPlanStr = localStorage.getItem("360hacks_edit_plan");
        if (editPlanStr) {
            try {
                const saved = JSON.parse(editPlanStr);
                setProjectPlan(saved.plan);
                if (saved.id) setSavedPlanId(saved.id);
                if (saved.plan.rubric) setRubric(saved.plan.rubric); // En caso de que ya tenga rúbrica
                setStep("result");
                // Limpiar para que no persista en futuros montajes
                localStorage.removeItem("360hacks_edit_plan");
            } catch (err) {
                console.error("Error loading plan from storage", err);
            }
        }
    }, []);

    // ─── Handlers ──────────────────────────────────────────

    async function handleFlipSubmit() {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/flip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    const retrySeconds = data.retryAfterSeconds || 60;
                    startRetryCountdown(retrySeconds);
                    throw new Error("rate_limit");
                }
                throw new Error(data.message || "Error en el análisis");
            }

            const data: FlipResponse = await res.json();
            setFlipResponse(data);

            if (data.readyToGenerate) {
                setStep("generating");
                await handleGenerate();
            } else {
                setStep("flip");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGenerate() {
        setIsLoading(true);
        setError(null);
        setStep("generating");

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    const retrySeconds = data.retryAfterSeconds || 60;
                    startRetryCountdown(retrySeconds);
                    throw new Error("rate_limit");
                }
                throw new Error(data.message || "Error al generar");
            }

            const data = await res.json();
            setProjectPlan(data.plan);

            // Guardar en Firestore asociado al usuario
            if (user) {
                const id = await saveLessonPlan(
                    user.uid,
                    data.plan,
                    {
                        subject: data.plan.asignaturas_involucradas?.[0] || 'ABP',
                        level: data.plan.nivel,
                        title: data.plan.titulo
                    }
                );
                setSavedPlanId(id);
            }

            setStep("result");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setStep("input");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleGenerateRubric() {
        if (!projectPlan || !savedPlanId) return;
        setIsGeneratingRubric(true);
        setError(null);

        try {
            const res = await fetch("/api/rubric", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(projectPlan),
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    startRetryCountdown(60);
                    throw new Error("rate_limit");
                }
                throw new Error(data.message || "Error al generar rúbrica");
            }

            const data = await res.json();
            setRubric(data.rubric);
            await updateLessonPlan(savedPlanId, { plan: { ...projectPlan, rubric: data.rubric } as any });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            if (err instanceof Error && err.message === "rate_limit") {
                // error is already set to rate_limit by throw above
            }
        } finally {
            setIsGeneratingRubric(false);
        }
    }

    async function handleExportPDF() {
        if (!projectPlan) return;
        setIsExporting(true);
        try {
            const teacherName = user?.displayName || user?.email?.split('@')[0] || "Docente";
            const res = await fetch("/api/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: projectPlan, rubric, teacherName }),
            });
            if (!res.ok) throw new Error("Error al generar PDF");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `proyecto-${projectPlan.nivel}-${Date.now()}.pdf`
                .replace(/\s+/g, "-")
                .toLowerCase();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            logAnalyticsEvent({ type: "pdf_downloaded", userId: user?.uid || null }).catch(console.error);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al exportar PDF");
        } finally {
            setIsExporting(false);
        }
    }

    async function handleIterate() {
        if (!projectPlan || !iterationFeedback.trim()) return;
        setIsIterating(true);
        setError(null);
        try {
            const res = await fetch("/api/iterate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: projectPlan, feedback: iterationFeedback }),
            });
            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    const retrySeconds = data.retryAfterSeconds || 60;
                    startRetryCountdown(retrySeconds);
                    throw new Error("rate_limit");
                }
                throw new Error(data.message || "Error al iterar");
            }
            const data = await res.json();
            setProjectPlan(data.plan);
            setRubric(null);
            setIterationFeedback("");
            setPlanVersion(v => v + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al iterar");
        } finally {
            setIsIterating(false);
        }
    }

    async function handleGenerateWorksheet() {
        setIsGeneratingWorksheet(true);
        setError(null);
        try {
            const res = await fetch("/api/worksheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: projectPlan }),
            });
            if (!res.ok) {
                const data = await res.json();
                if (res.status === 429) {
                    startRetryCountdown(data.retryAfterSeconds || 60);
                    throw new Error("rate_limit");
                }
                throw new Error(data.error || "Error al generar guía");
            }
            const data = await res.json();
            setWorksheet(data.worksheet);
        } catch (err) {
            if (err instanceof Error && err.message !== "rate_limit") {
                setError(err.message);
            }
        } finally {
            setIsGeneratingWorksheet(false);
        }
    }

    function resetWizard() {
        setStep("input");
        setProjectPlan(null);
        setFlipResponse(null);
        setRubric(null);
        setWorksheet(null);
        setShowGradingMatrix(false);
    }

    return {
        // State
        step,
        setStep,
        input,
        setInput,
        flipResponse,
        setFlipResponse,
        projectPlan,
        rubric,
        worksheet,
        error,
        setError,
        isLoading,
        isGeneratingRubric,
        isExporting,
        isGeneratingWorksheet,
        showGradingMatrix,
        setShowGradingMatrix,
        retryCountdown,
        savedPlanId,
        iterationFeedback,
        setIterationFeedback,
        isIterating,
        planVersion,

        // Actions
        handleFlipSubmit,
        handleGenerate,
        handleGenerateRubric,
        handleExportPDF,
        handleGenerateWorksheet,
        handleIterate,
        resetWizard
    };
}
