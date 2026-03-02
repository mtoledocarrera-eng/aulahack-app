"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Loader2,
    TrendingUp,
    BookOpen,
    Target,
    RefreshCw,
    ChevronRight,
} from "lucide-react";
import type { TeacherProfile, CoachingResponse, CoachingInsight } from "@/lib/ai/coaching-schemas";

interface TeacherCoachingProps {
    uid: string;
}

export function TeacherCoaching({ uid }: TeacherCoachingProps) {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const loadCoaching = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/coaching", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al generar coaching");
            }
            const data = await res.json();
            setProfile(data.profile);
            setCoaching(data.coaching);
            setHasLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsLoading(false);
        }
    }, [uid]);

    // ─── Initial CTA (before loading) ──────────────
    if (!hasLoaded && !isLoading) {
        return (
            <Card className="border-brand-200/50 dark:border-brand-800/50 bg-gradient-to-br from-brand-50/50 via-purple-50/30 to-amber-50/30 dark:from-brand-900/20 dark:via-purple-900/10 dark:to-amber-900/10 shadow-sm">
                <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-brand-600" />
                    </div>
                    <h3 className="font-display text-xl font-bold">Tu Mentor Pedagógico con IA</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Analizo tu historial de planificaciones para darte recomendaciones personalizadas:
                        diversificación metodológica, cobertura curricular y estrategias concretas para crecer como docente.
                    </p>
                    <Button
                        onClick={loadCoaching}
                        className="rounded-xl shadow-lg shadow-brand-600/25 font-semibold"
                        size="lg"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Obtener Mi Coaching
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ─── Loading State ────────────────────────────
    if (isLoading) {
        return (
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                        Analizando tu perfil pedagógico y preparando recomendaciones...
                    </p>
                </CardContent>
            </Card>
        );
    }

    // ─── Error State ──────────────────────────────
    if (error) {
        return (
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <Button variant="outline" onClick={loadCoaching} size="sm" className="rounded-lg">
                        <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!profile || !coaching) return null;

    // ─── Main Coaching View ──────────────────────
    return (
        <div className="space-y-6">
            {/* Saludo + Resumen */}
            <Card className="border-brand-200/50 dark:border-brand-800/50 bg-gradient-to-br from-brand-50/50 via-purple-50/30 to-background dark:from-brand-900/20 dark:via-purple-900/10 dark:to-background shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <p className="font-display text-lg font-bold mb-1">{coaching.saludo}</p>
                            <p className="text-sm text-muted-foreground">{coaching.resumen_perfil}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat icon={BookOpen} label="Planificaciones" value={profile.totalPlanes.toString()} />
                <MiniStat icon={Target} label="OAs Cubiertos" value={profile.oas_unicos.toString()} />
                <MiniStat icon={TrendingUp} label="Asignaturas" value={profile.asignaturas.length.toString()} />
                <MiniStat icon={RefreshCw} label="Metodologías" value={profile.metodologias_detectadas.length.toString()} />
            </div>

            {/* Methodology Breakdown */}
            {profile.metodologias_detectadas.length > 0 && (
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Tu Perfil Metodológico</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-2">
                            {profile.metodologias_detectadas.map((m, i) => {
                                const maxFreq = profile.metodologias_detectadas[0]?.frecuencia || 1;
                                const width = Math.max(15, (m.frecuencia / maxFreq) * 100);
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-medium w-40 text-right text-muted-foreground truncate">{m.tipo}</span>
                                        <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                                style={{ width: `${width}%` }}
                                            >
                                                <span className="text-[10px] font-bold text-white">{m.frecuencia}×</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Coaching Insights */}
            <div className="space-y-3">
                {coaching.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                ))}
            </div>

            {/* Próximo Desafío */}
            <Card className="border-amber-200/50 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10 shadow-sm">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🎯</span>
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">Tu próximo desafío</p>
                            <p className="text-sm text-muted-foreground">{coaching.proximo_desafio}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Refresh */}
            <div className="text-center">
                <Button variant="ghost" size="sm" onClick={loadCoaching} className="text-xs text-muted-foreground hover:text-foreground">
                    <RefreshCw className="w-3 h-3 mr-1" /> Actualizar análisis
                </Button>
            </div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="p-3 rounded-xl bg-background/50 border border-border/50 text-center">
            <Icon className="w-4 h-4 text-brand-600 mx-auto mb-1" />
            <p className="text-xl font-bold font-display">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
    );
}

function InsightCard({ insight }: { insight: CoachingInsight }) {
    const borderColors = {
        fortaleza: "border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10",
        oportunidad: "border-blue-200/50 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10",
        sugerencia: "border-purple-200/50 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-900/10",
    };

    return (
        <Card className={`${borderColors[insight.tipo]} shadow-sm`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{insight.icono}</span>
                    <div className="flex-1">
                        <p className="text-sm font-bold mb-0.5">{insight.titulo}</p>
                        <p className="text-sm text-muted-foreground">{insight.descripcion}</p>
                        {insight.accion_sugerida && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-brand-600 dark:text-brand-400">
                                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{insight.accion_sugerida}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
