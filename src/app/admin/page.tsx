"use client";

import { useEffect, useState } from "react";
import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import { getLatestFeedback, getAnalyticsSummary } from "@/lib/firebase/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, CheckCircle, AlertTriangle, AlertCircle, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
    const { user, loading } = useProtectedRoute();
    const [summary, setSummary] = useState<any>(null);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!user || user.uid !== process.env.NEXT_PUBLIC_ADMIN_UID) return;

        async function loadData() {
            try {
                const [sumRes, feedRes] = await Promise.all([
                    getAnalyticsSummary(),
                    getLatestFeedback(50)
                ]);
                setSummary(sumRes);
                setFeedback(feedRes);
            } catch (error) {
                console.error("Failed to load admin data", error);
            } finally {
                setIsFetching(false);
            }
        }
        loadData();
    }, [user]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    if (!user || user.uid !== process.env.NEXT_PUBLIC_ADMIN_UID) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200 bg-red-50 text-center">
                    <CardContent className="pt-6">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-900 mb-2">Acceso Denegado</h2>
                        <p className="text-red-700 mb-6">Esta es un área restringida. No tienes permisos para ver esto.</p>
                        <Link href="/dashboard">
                            <Button variant="outline">Volver al inicio</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-display font-bold">Panel de Telemetría (Admin)</h1>
                    <p className="text-muted-foreground mt-2">Estudio de Feedback y Salud del Sistema IA</p>
                </div>

                {isFetching ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Cargando analíticas...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 text-dua-success"><CheckCircle className="w-4 h-4" /> Planes Generados</CardTitle>
                                </CardHeader>
                                <CardContent><div className="text-3xl font-bold">{summary?.plan_generated || 0}</div></CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 text-brand-600"><Download className="w-4 h-4" /> PDFs Descargados</CardTitle>
                                </CardHeader>
                                <CardContent><div className="text-3xl font-bold">{summary?.pdf_downloaded || 0}</div></CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 text-amber-500"><AlertTriangle className="w-4 h-4" /> Límite API (429)</CardTitle>
                                </CardHeader>
                                <CardContent><div className="text-3xl font-bold">{summary?.ai_error_429 || 0}</div></CardContent>
                            </Card>
                            <Card className="border-border/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 text-red-500"><AlertCircle className="w-4 h-4" /> Fallas de Formato IA</CardTitle>
                                </CardHeader>
                                <CardContent><div className="text-3xl font-bold">{summary?.validation_error_zod || 0}</div></CardContent>
                            </Card>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Feedback de Usuarios</h2>
                            {feedback.length === 0 ? (
                                <p className="text-muted-foreground italic">Aún no hay opiniones formales.</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {feedback.map((f, i) => (
                                        <Card key={i} className="border-border/50 shadow-sm">
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, idx) => (
                                                            <Star key={idx} className={`w-4 h-4 ${idx < f.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{f.createdAt?.toLocaleDateString() || 'Reciente'}</span>
                                                </div>
                                                <p className="text-sm mt-3">{f.comment || <span className="italic text-muted-foreground">Sin comentario escrito.</span>}</p>
                                                <p className="text-xs text-muted-foreground mt-4 font-mono truncate">Plan_ID: {f.planId}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
