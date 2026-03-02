import { CheckCircle2, Sparkles, Edit3, Loader2, FileText, NotebookPen, ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import { FeedbackDialog } from "@/components/FeedbackDialog";

// Lazy load heavy components
const RubricTable = dynamic(() => import("@/components/RubricTable").then(mod => mod.default), {
    loading: () => <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando rúbrica...</div>
});
const GradingMatrix = dynamic(() => import("@/components/GradingMatrix").then(mod => mod.GradingMatrix), {
    loading: () => <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando matriz de calificación...</div>
});

import type { ProjectPlan, Rubric, Worksheet } from "@/lib/ai/schemas";

interface WizardResultProps {
    uid: string;
    projectPlan: ProjectPlan;
    rubric: Rubric | null;
    worksheet: Worksheet | null;
    savedPlanId: string | null;
    showGradingMatrix: boolean;
    setShowGradingMatrix: (val: boolean) => void;
    iterationFeedback: string;
    setIterationFeedback: (val: string) => void;
    isIterating: boolean;
    planVersion: number;
    isGeneratingRubric: boolean;
    isGeneratingWorksheet: boolean;
    isExporting: boolean;
    retryCountdown: number;
    onReset: () => void;
    onGenerateRubric: () => void;
    onGenerateWorksheet: () => void;
    onExportPDF: () => void;
    onIterate: () => void;
}

export function WizardResult({
    uid, projectPlan, rubric, worksheet, savedPlanId,
    showGradingMatrix, setShowGradingMatrix,
    iterationFeedback, setIterationFeedback, isIterating, planVersion,
    isGeneratingRubric, isGeneratingWorksheet, isExporting, retryCountdown,
    onReset, onGenerateRubric, onGenerateWorksheet, onExportPDF, onIterate
}: WizardResultProps) {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="glass-card p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-dua-success/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-dua-success" />
                        </div>
                        <div>
                            <h2 className="font-display text-lg font-bold">{projectPlan.titulo}</h2>
                            <p className="text-sm text-muted-foreground">{projectPlan.nivel} · {projectPlan.asignaturas_involucradas?.join(", ")} · {projectPlan.duracion_total}</p>
                        </div>
                    </div>
                    {savedPlanId && (
                        <FeedbackDialog planId={savedPlanId} userId={uid} />
                    )}
                </div>

                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 mb-6">
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">OAs Sugeridos (Alineación Curricular)</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {projectPlan.oas_sugeridos.map((oa, i) => <li key={i}>{oa}</li>)}
                    </ul>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
                    <p className="text-sm font-medium mb-1">Habilidades a Desarrollar:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {projectPlan.habilidades_desarrolladas.map((h, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground border border-border">{h}</span>
                        ))}
                    </div>
                    {projectPlan.indicador_desarrollo_personal_social && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Dimensión Socioemocional (IDPS):</p>
                            <p className="text-sm text-muted-foreground">{projectPlan.indicador_desarrollo_personal_social}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <ProjectPhaseCard step={1} title="Preparación / Gancho" data={projectPlan.fase_preparacion} />
                    <ProjectPhaseCard step={2} title="Investigación y Acción" data={projectPlan.fase_investigacion_accion} />
                    <ProjectPhaseCard step={3} title="Síntesis y Metacognición" data={projectPlan.fase_sintesis_metacognicion} />

                    <div className="p-6 rounded-xl border border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="step-indicator active">4</span>
                            <h3 className="font-bold">Estrategia de Evaluación (Decreto 67)</h3>
                        </div>
                        <p className="text-sm mb-2"><strong>Evaluación Formativa (Proceso):</strong> {projectPlan.evaluacion.estrategia_formativa}</p>
                        <p className="text-sm mb-2"><strong>Instrumento Final:</strong> {projectPlan.evaluacion.instrumento_calificacion}</p>
                        <div>
                            <p className="text-sm font-medium mb-1">Criterios Clave:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {projectPlan.evaluacion.criterios.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            <h3 className="font-bold text-lg text-brand-900 dark:text-brand-100">Guía para el Docente</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-brand-700 dark:text-brand-300">🎯 Estrategia Motivacional:</p>
                                <p className="text-sm text-muted-foreground">{projectPlan.guia_docente?.estrategia_motivacional}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-500">🚧 Posibles Obstáculos y Soluciones:</p>
                                <p className="text-sm text-muted-foreground">{projectPlan.guia_docente?.posibles_obstaculos_y_soluciones}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-dua-success">🌍 Conexiones con la Vida Real:</p>
                                <p className="text-sm text-muted-foreground">{projectPlan.guia_docente?.conexiones_vida_real}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl border-2 border-dua-success/30 bg-dua-success/5">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="step-indicator bg-dua-success text-white">5</span>
                            <h3 className="font-bold">Adecuaciones (Decreto 83)</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <DUACard title="Representación" content={projectPlan.adecuaciones_dua.representacion} />
                            <DUACard title="Acción y Expresión" content={projectPlan.adecuaciones_dua.accion_expresion} />
                            <DUACard title="Compromiso" content={projectPlan.adecuaciones_dua.compromiso} />
                            {projectPlan.adecuaciones_dua.ajustes_ambientales_y_sensoriales_tea && (
                                <DUACard
                                    title="Ley TEA (Insumo FU PIE)"
                                    content={projectPlan.adecuaciones_dua.ajustes_ambientales_y_sensoriales_tea}
                                    isHighlight
                                />
                            )}
                        </div>
                    </div>
                </div>

                {rubric && (
                    <div className="mt-8 pt-8 border-t border-border/50">
                        <RubricTable rubric={rubric} />
                    </div>
                )}
            </div>

            {/* ── Iteración del plan ── */}
            <div className="mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                    <Edit3 className="w-5 h-5 text-brand-600" />
                    <h3 className="font-display text-lg font-bold">Iterar y Mejorar</h3>
                    <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600">v{planVersion}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Describe qué quieres cambiar y la IA ajustará tu plan manteniendo la coherencia pedagógica.
                </p>
                <Textarea
                    value={iterationFeedback}
                    onChange={(e) => setIterationFeedback(e.target.value)}
                    placeholder='Ej: "Haz que la Fase 2 dure 2 semanas" o "Agrega más recursos digitales" o "Cambia la evaluación a una exposición oral"'
                    className="w-full bg-background/50 focus:ring-brand-500/30 focus:border-brand-500 min-h-[100px] resize-y transition-all"
                    disabled={isIterating}
                />
                <Button
                    size="lg"
                    onClick={onIterate}
                    disabled={isIterating || !iterationFeedback.trim() || retryCountdown > 0}
                    className="mt-4 rounded-xl shadow-brand-600/25 transition-all duration-300"
                >
                    {isIterating ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Iterando plan...</> : <><Edit3 className="mr-2 w-4 h-4" /> Aplicar Cambios</>}
                </Button>
            </div>

            {/* ── Guía de Trabajo generada ── */}
            {worksheet && (
                <div className="mt-8 pt-8 border-t border-border/50 space-y-6">
                    <div className="p-6 rounded-xl border-2 border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="step-indicator bg-amber-500 text-white">📝</span>
                            <h3 className="font-bold text-lg">Guía de Trabajo: {worksheet.titulo_proyecto}</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">❓ Pregunta Esencial:</p>
                                <p className="text-base font-medium mt-1">{worksheet.pregunta_esencial}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">🎯 Objetivo:</p>
                                <p className="text-sm text-muted-foreground">{worksheet.objetivo_estudiante}</p>
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">📋 Pasos:</p>
                                {worksheet.pasos.map((paso, i) => (
                                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">{paso.numero}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{paso.titulo} <span className="text-xs text-muted-foreground">({paso.tiempo_sugerido})</span></p>
                                            <p className="text-sm text-muted-foreground mt-1">{paso.instrucciones}</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">Respuesta: {paso.espacio_respuesta}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">✅ Criterios de Éxito:</p>
                                    <ul className="space-y-1">
                                        {worksheet.criterios_exito.map((c, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">📚 Recursos:</p>
                                    <ul className="space-y-1">
                                        {worksheet.recursos_sugeridos.map((r, i) => (
                                            <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">🪞 Reflexión Final:</p>
                                <p className="text-sm text-muted-foreground mt-1 italic">{worksheet.reflexion_final}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Matriz de Calificación ── */}
            {showGradingMatrix && projectPlan && (
                <div className="mt-8 pt-8 border-t border-border/50">
                    <GradingMatrix
                        criterios={projectPlan.evaluacion.criterios}
                        planTitle={projectPlan.titulo}
                    />
                </div>
            )}

            {/* Disclaimer Responsabilidad Profesional (Decreto 67) */}
            <div className="mt-8 pt-6 border-t border-border/50">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xl">⚖️</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Responsabilidad Profesional (Decreto 67)</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Esta propuesta es un recurso de apoyo técnico-pedagógico inicial. El docente titular debe validar,
                            contextualizar y ajustar este diseño a las características reales de sus estudiantes y directrices
                            del Establecimiento. Esta herramienta no reemplaza la deliberación pedagógica del Equipo de Aula
                            ni las decisiones curriculares de la Jefatura Técnica (UTP).
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8 pt-8 border-t border-border/50">
                <Button variant="outline" size="lg" onClick={onReset} className="w-full sm:w-auto rounded-xl font-semibold">
                    Nuevo Proyecto
                </Button>
                {!rubric && (
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={onGenerateRubric}
                        disabled={isGeneratingRubric}
                        className="w-full sm:w-auto rounded-xl font-semibold border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/50"
                    >
                        {isGeneratingRubric ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Generando Rúbrica...</> : <><FileText className="mr-2 w-5 h-5" /> Generar Rúbrica con IA</>}
                    </Button>
                )}
                {!worksheet && (
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={onGenerateWorksheet}
                        disabled={isGeneratingWorksheet || retryCountdown > 0}
                        className="w-full sm:w-auto rounded-xl font-semibold border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    >
                        {isGeneratingWorksheet ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Generando Guía...</> : <><NotebookPen className="mr-2 w-5 h-5" /> Guía de Trabajo (IA)</>}
                    </Button>
                )}
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowGradingMatrix(!showGradingMatrix)}
                    className="w-full sm:w-auto rounded-xl font-semibold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                >
                    <ClipboardList className="mr-2 w-5 h-5" />
                    {showGradingMatrix ? "Ocultar Pauta" : "Pauta de Calificación"}
                </Button>
                <Button
                    size="lg"
                    onClick={onExportPDF}
                    disabled={isExporting}
                    className="w-full sm:w-auto rounded-xl shadow-lg shadow-brand-600/25 font-semibold"
                >
                    {isExporting ? <><Loader2 className="mr-2 w-5 h-5 animate-spin" /> Generando PDF...</> : <><Download className="mr-2 w-5 h-5" /> Exportar PDF</>}
                </Button>
            </div>
        </div>
    );
}

// Subcomponentes visuales exclusivos del Result
function ProjectPhaseCard({
    step,
    title,
    data,
}: {
    step: number;
    title: string;
    data: { titulo: string; duracion: string; tiempo_estimado_minutos?: number; descripcion_actividad_estudiante: string; recursos: string[]; rol_docente: string; tips_gestion_aula?: string };
}) {
    return (
        <div className="p-6 rounded-xl border border-border/50 bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
                <span className="step-indicator active">{step}</span>
                <h3 className="font-bold border-b border-border/10 pb-1 flex-1">{title}: {data.titulo}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
                    {data.duracion} {data.tiempo_estimado_minutos ? `(~${data.tiempo_estimado_minutos} min)` : ''}
                </span>
            </div>
            <p className="text-sm font-medium mb-1">Acción del Estudiante:</p>
            <p className="text-sm text-muted-foreground mb-4">{data.descripcion_actividad_estudiante}</p>

            {data.recursos && data.recursos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-medium text-muted-foreground my-auto mr-1">Recursos:</span>
                    {data.recursos.map((r, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300"
                        >
                            {r}
                        </span>
                    ))}
                </div>
            )}

            <div className="p-3 bg-brand-50/50 dark:bg-brand-900/10 rounded-lg border border-brand-100 dark:border-brand-800">
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">Tu Rol Analítico (Mediador):</p>
                <p className="text-xs text-muted-foreground italic mb-2">
                    💡 {data.rol_docente}
                </p>
                {data.tips_gestion_aula && (
                    <>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mb-1">Tip de Gestión de Aula:</p>
                        <p className="text-xs text-muted-foreground italic">
                            🛡️ {data.tips_gestion_aula}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

function DUACard({ title, content, isHighlight }: { title: string; content: string; isHighlight?: boolean }) {
    return (
        <div className={`p-4 rounded-xl ${isHighlight ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-gray-800/50'}`}>
            <p className={`text-sm font-bold mb-2 ${isHighlight ? 'text-amber-600 dark:text-amber-500' : 'text-dua-success'}`}>
                {title}
            </p>
            <p className="text-sm text-muted-foreground">{content}</p>
        </div>
    );
}
