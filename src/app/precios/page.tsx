"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, Star } from "lucide-react";
import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";

export default function PreciosPage() {
    const { user, loading } = useProtectedRoute();
    const [isProcessing, setIsProcessing] = useState(false);

    async function handleSubscribe() {
        if (!user) return;
        setIsProcessing(true);
        try {
            const res = await fetch("/api/payments/create", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                // Redirigir a Flow
                window.location.href = data.url;
            } else {
                throw new Error(data.message || "Error al generar el pago");
            }
        } catch (error) {
            alert("No se pudo iniciar el pago. Revisa tu conexión.");
            setIsProcessing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg">
            <header className="fixed top-0 w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-border z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="font-display font-bold text-xl gradient-text">
                        360Hacks
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium hover:text-brand-600 transition-colors"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Desbloquea todo el potencial de la IA
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Obtén planificaciones ilimitadas, generación de rúbricas avanzadas y exportación a PDF para llevar tus clases al siguiente nivel.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plan Básico */}
                    <div className="glass-card p-8 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold font-display mb-2 text-muted-foreground">Plan Esencial</h2>
                            <p className="text-4xl font-black mb-6">$0 <span className="text-lg text-muted-foreground font-normal">/mes</span></p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>Planificaciones básicas con DUA</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span>Límite de 3 planificaciones mensuales</span>
                                </li>
                                <li className="flex items-start gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span className="line-through">Generación automática de Rúbricas</span>
                                </li>
                                <li className="flex items-start gap-3 opacity-50">
                                    <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span className="line-through">Exportación a formato PDF listo para imprimir</span>
                                </li>
                            </ul>
                        </div>

                        {user?.isPremium ? (
                            <Link href="/dashboard" className="w-full block text-center py-4 bg-muted text-muted-foreground font-bold rounded-2xl">
                                Tu plan actual
                            </Link>
                        ) : (
                            <button disabled className="w-full py-4 bg-muted hover:bg-muted-foreground/10 text-foreground font-bold rounded-2xl transition-all border border-border">
                                Plan Actual
                            </button>
                        )}
                    </div>

                    {/* Plan Pro */}
                    <div className="relative glass-card p-8 flex flex-col justify-between border-2 border-brand-500 shadow-2xl shadow-brand-500/20 transform md:-translate-y-4">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-brand-400 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                            <Star className="w-4 h-4" /> Recomendado
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold font-display mb-2 text-brand-700 dark:text-brand-300">Plan Premium</h2>
                            <p className="text-4xl font-black mb-6">$4.990 <span className="text-lg text-muted-foreground font-normal">/mes</span></p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    <span className="font-medium">Planificaciones ilimitadas</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    <span className="font-medium">Generación automática de Rúbricas (Decreto 67)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    <span className="font-medium">Exportación a PDF en 1 clic</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    <span className="font-medium">Soporte prioritario</span>
                                </li>
                            </ul>
                        </div>

                        {user?.isPremium ? (
                            <div className="w-full text-center py-4 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold rounded-2xl border-2 border-brand-500">
                                ⭐ Eres Premium
                            </div>
                        ) : (
                            <button
                                onClick={handleSubscribe}
                                disabled={isProcessing}
                                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Conectando con Flow...</>
                                ) : (
                                    <>Mejorar a Premium <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" /></>
                                )}
                            </button>
                        )}
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Pagos procesados de forma 100% segura por Flow.cl (Tarjetas, Mach, Khipu)
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
