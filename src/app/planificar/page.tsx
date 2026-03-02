"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Clock, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import { useLessonWizard } from "@/lib/hooks/useLessonWizard";

// Componentes extraídos
import { WizardInput } from "./components/WizardInput";
import { WizardFlip } from "./components/WizardFlip";
import { WizardGenerating } from "./components/WizardGenerating";
import { WizardResult } from "./components/WizardResult";

export default function PlanificarPage() {
    const { user, loading: authLoading } = useProtectedRoute();
    const wizard = useLessonWizard(user);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header / Nav */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="font-display font-bold text-lg tracking-tight">360Hacks</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <StepDot active={wizard.step === "input"} completed={wizard.step !== "input"} label="1" />
                        <div className="w-8 h-px bg-border" />
                        <StepDot active={wizard.step === "flip"} completed={wizard.step === "generating" || wizard.step === "result"} label="2" />
                        <div className="w-8 h-px bg-border" />
                        <StepDot active={wizard.step === "result"} completed={false} label="3" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <motion.main
                key="main-wizard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-4xl mx-auto px-6 py-8"
            >
                {wizard.error && (
                    <div className="mb-6 animate-fade-in">
                        {wizard.error === "rate_limit" ? (
                            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 shadow-xl shadow-amber-500/10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
                                            Límite de uso temporal alcanzado
                                        </h3>
                                        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4 leading-relaxed">
                                            La API gratuita tiene un límite de solicitudes por minuto.
                                            {wizard.retryCountdown > 0
                                                ? ` Podrás reintentar automáticamente en unos segundos.`
                                                : " ¡Ya puedes generar tu planificación!"}
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
                                                    // Ocultar error y reubicar al flujo adecuado
                                                    wizard.setError(null);
                                                    if (wizard.step === "input" || wizard.step === "flip") wizard.handleFlipSubmit();
                                                    else if (wizard.projectPlan && wizard.step === "result" && !wizard.rubric) wizard.handleGenerateRubric();
                                                    else wizard.handleGenerate();
                                                }}
                                                disabled={wizard.retryCountdown > 0}
                                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${wizard.retryCountdown > 0 ? "" : "animate-spin"}`} />
                                                {wizard.retryCountdown > 0
                                                    ? `Reintentar en ${wizard.retryCountdown}s`
                                                    : "Reintentar ahora"}
                                            </button>

                                            {wizard.retryCountdown > 0 && (
                                                <div className="flex-1 h-2 bg-amber-200 dark:bg-amber-900/60 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-600 transition-all duration-1000 ease-linear"
                                                        style={{ width: `${(wizard.retryCountdown / 60) * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                                <p className="font-medium">Error</p>
                                <p className="text-sm mt-1">{wizard.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sub-componentes del Flow */}
                <AnimatePresence mode="wait">
                    {wizard.step === "input" && (
                        <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <WizardInput
                                input={wizard.input}
                                setInput={wizard.setInput}
                                isLoading={wizard.isLoading}
                                onSubmit={wizard.handleFlipSubmit}
                            />
                        </motion.div>
                    )}

                    {wizard.step === "flip" && wizard.flipResponse && (
                        <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <WizardFlip
                                flipResponse={wizard.flipResponse}
                                input={wizard.input}
                                setInput={wizard.setInput}
                                isLoading={wizard.isLoading}
                                onGenerate={wizard.handleGenerate}
                            />
                        </motion.div>
                    )}

                    {wizard.step === "generating" && (
                        <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <WizardGenerating />
                        </motion.div>
                    )}

                    {wizard.step === "result" && wizard.projectPlan && (
                        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <WizardResult
                                uid={user.uid}
                                projectPlan={wizard.projectPlan}
                                rubric={wizard.rubric}
                                worksheet={wizard.worksheet}
                                savedPlanId={wizard.savedPlanId}
                                showGradingMatrix={wizard.showGradingMatrix}
                                setShowGradingMatrix={wizard.setShowGradingMatrix}
                                iterationFeedback={wizard.iterationFeedback}
                                setIterationFeedback={wizard.setIterationFeedback}
                                isIterating={wizard.isIterating}
                                planVersion={wizard.planVersion}
                                isGeneratingRubric={wizard.isGeneratingRubric}
                                isGeneratingWorksheet={wizard.isGeneratingWorksheet}
                                isExporting={wizard.isExporting}
                                retryCountdown={wizard.retryCountdown}
                                onReset={wizard.resetWizard}
                                onGenerateRubric={wizard.handleGenerateRubric}
                                onGenerateWorksheet={wizard.handleGenerateWorksheet}
                                onExportPDF={wizard.handleExportPDF}
                                onIterate={wizard.handleIterate}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.main>
        </div>
    );
}

// ─── Componentes de UI Puros (Menores) ─────────────────────────

function StepDot({
    active,
    completed,
    label,
}: {
    active: boolean;
    completed: boolean;
    label: string;
}) {
    return (
        <div
            className={`step-indicator ${active ? "active" : completed ? "completed" : "pending"
                }`}
        >
            {completed ? <CheckCircle2 className="w-5 h-5" /> : label}
        </div>
    );
}
