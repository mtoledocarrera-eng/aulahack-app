import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import type { TeacherInput } from "@/lib/ai/schemas";

interface WizardInputProps {
    input: TeacherInput;
    setInput: (input: TeacherInput) => void;
    isLoading: boolean;
    onSubmit: () => void;
}

const CONTAINS_RUT_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}[-][0-9kK]\b/i;

export function WizardInput({ input, setInput, isLoading, onSubmit }: WizardInputProps) {
    const hasPII =
        CONTAINS_RUT_REGEX.test(input.proposito || "") ||
        CONTAINS_RUT_REGEX.test(input.contexto || "") ||
        CONTAINS_RUT_REGEX.test(input.nivel || "") ||
        CONTAINS_RUT_REGEX.test(input.asignatura || "");

    const isSubmitDisabled = isLoading || !input.proposito || hasPII;
    return (
        <div className="animate-fade-in space-y-8">
            <div className="glass-card p-8 text-center bg-gradient-to-br from-brand-600 to-brand-800 text-white">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">Mentor Pedagógico Inteligente</h2>
                <p className="text-brand-100 max-w-lg mx-auto">Cuéntame tus expectativas de aprendizaje. Yo diseñaré el proyecto, el rol docente y las evaluaciones (D67/83).</p>
            </div>

            <Card className="border-border/50 shadow-xl bg-background/50 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Propósito de Aprendizaje (Habilidades, conocimientos esenciales, actitudes)</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ej: Quiero que debatan sobre el cambio climático, analizando fuentes y proponiendo una solución comunitaria (ABP)."
                            value={input.proposito!}
                            onChange={(e) => setInput({ ...input, proposito: e.target.value })}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Nivel Educativo (Opcional)</Label>
                            <Input
                                type="text"
                                placeholder="Ej: 8° Básico"
                                value={input.nivel!}
                                onChange={(e) => setInput({ ...input, nivel: e.target.value })}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Asignatura/Área (Opcional)</Label>
                            <Input
                                type="text"
                                placeholder="Ej: Ciencias o Proyecto Interdisciplinario"
                                value={input.asignatura!}
                                onChange={(e) => setInput({ ...input, asignatura: e.target.value })}
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Contexto y Barreras (Opcional)</Label>
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>No incluyas Nombres ni RUTs (Ley 19.628)</span>
                            </div>
                        </div>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ej: Grupo diverso, baja motivación por la lectura larga..."
                            value={input.contexto!}
                            onChange={(e) => setInput({ ...input, contexto: e.target.value })}
                        />
                    </div>

                    {hasPII && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in slide-in-from-bottom-2">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <p>¡Atención! Se ha detectado un patrón de RUT en el texto. Por cumplimiento normativo (Ley 19.628), debes retirarlo antes de poder generar la planificación.</p>
                        </div>
                    )}

                    <Button onClick={onSubmit} disabled={isSubmitDisabled} size="lg" className="w-full py-6 text-base font-bold rounded-xl group shadow-brand-600/20 hover:shadow-brand-600/40">
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Diseñar Propuesta DUA/ABP <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
