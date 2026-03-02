"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Search,
    Calendar,
    GraduationCap,
    Download,
    Trash2,
    Loader2,
    BookOpen,
    Edit3,
    History,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getTeacherPlans, deleteLessonPlan, type StoredLessonPlan } from "@/lib/firebase/firestore";
import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function HistorialPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useProtectedRoute();
    const { toast } = useToast();
    const [plans, setPlans] = useState<StoredLessonPlan[]>([]);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);
    const [selectedPlanVersions, setSelectedPlanVersions] = useState<StoredLessonPlan | null>(null);

    useEffect(() => {
        async function loadPlans() {
            if (user) {
                setPlansLoading(true);
                setPlansError(null);
                try {
                    const firebasePlans = await getTeacherPlans(user.uid);
                    setPlans(firebasePlans);
                } catch (err: unknown) {
                    console.error("[Historial] Error al cargar planes:", err);
                    setPlansError("No se pudieron cargar tus planificaciones. Por favor, recarga la página.");
                } finally {
                    setPlansLoading(false);
                }
            }
        }
        loadPlans();
    }, [user]);

    // Obtener asignaturas únicas para el filtro
    const subjects = useMemo(() => {
        const set = new Set(plans.map((p) => p.plan.asignaturas_involucradas?.[0] || 'ABP'));
        return Array.from(set).sort();
    }, [plans]);

    // Filtrar planes
    const filteredPlans = useMemo(() => {
        return plans.filter((p) => {
            const mainSubject = p.plan.asignaturas_involucradas?.[0] || 'ABP';
            const searchLower = search.toLowerCase();
            const matchesSearch =
                !search ||
                p.plan.titulo.toLowerCase().includes(searchLower) ||
                mainSubject.toLowerCase().includes(searchLower) ||
                p.plan.nivel.toLowerCase().includes(searchLower) ||
                p.plan.oas_sugeridos?.some(oa => oa.toLowerCase().includes(searchLower)) ||
                p.plan.habilidades_desarrolladas?.some(h => h.toLowerCase().includes(searchLower)) ||
                p.plan.asignaturas_involucradas?.some(a => a.toLowerCase().includes(searchLower));
            const matchesSubject =
                !subjectFilter || subjectFilter === "all_subjects" || mainSubject === subjectFilter;
            return matchesSearch && matchesSubject;
        });
    }, [plans, search, subjectFilter]);

    async function handleDelete(id: string) {
        // Remoción optimista: quitar de la lista inmediatamente
        setPlans(prev => prev.filter(p => p.id !== id));
        try {
            await deleteLessonPlan(id);
            setDeletingId(null);
            toast({
                title: "Planificación eliminada",
                description: "Se ha borrado del historial correctamente.",
            });
        } catch (err) {
            console.error("[Historial] Error al eliminar:", err);
            // Si falla, recargar lista desde Firebase
            if (user) {
                const firebasePlans = await getTeacherPlans(user.uid);
                setPlans(firebasePlans);
            }
            toast({
                title: "Error al eliminar",
                description: "Por favor intenta de nuevo.",
                variant: "destructive",
            });
            setDeletingId(null);
        }
    }

    async function handleDownload(saved: StoredLessonPlan) {
        setExportingId(saved.id);
        try {
            const teacherName = user?.displayName || user?.email?.split('@')[0] || "Docente";
            const res = await fetch("/api/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: saved.plan, rubric: null, teacherName }),
            });
            if (!res.ok) throw new Error("Error al generar PDF");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `proyecto-${saved.plan.nivel}-${Date.now()}.pdf`
                .replace(/\s+/g, "-")
                .toLowerCase();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
                title: "PDF Exportado",
                description: "Tu planificación se ha descargado correctamente.",
            });
        } catch {
            toast({
                title: "Error al generar PDF",
                description: "Hubo un problema al exportar. Por favor intenta de nuevo.",
                variant: "destructive",
            });
        } finally {
            setExportingId(null);
        }
    }

    function formatDate(dateValue: string | Date): string {
        const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return d.toLocaleDateString("es-CL", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
            </div>
        );
    }

    if (plansLoading) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center flex-col gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
                <p className="text-sm text-muted-foreground">Cargando planificaciones...</p>
            </div>
        );
    }

    if (plansError) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center flex-col gap-4">
                <div className="glass-card p-8 text-center max-w-md">
                    <p className="text-red-500 font-medium mb-2">⚠️ Error</p>
                    <p className="text-sm text-muted-foreground mb-4">{plansError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="border-b border-border/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-display text-xl font-bold">
                                Historial de Planificaciones
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {plans.length} planificaciones guardadas
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-5xl mx-auto px-6 py-8"
            >
                {/* Search & Filters */}
                <Card className="mb-6 p-4 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar por título, asignatura o nivel..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 bg-background"
                        />
                    </div>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger className="w-full md:w-[250px] bg-background">
                            <SelectValue placeholder="Todas las asignaturas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_subjects">Todas las asignaturas</SelectItem>
                            {subjects.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Card>

                {/* Plans List */}
                {filteredPlans.length === 0 ? (
                    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-16 text-center text-muted-foreground">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            {plans.length === 0 ? (
                                <>
                                    <p className="font-display text-lg font-bold mb-2 text-foreground">
                                        Aún no tienes planificaciones
                                    </p>
                                    <p className="text-sm mb-6">
                                        Crea tu primera planificación con nuestro asistente de IA.
                                    </p>
                                    <Button asChild size="lg" className="rounded-xl shadow-lg shadow-brand-600/25">
                                        <Link href="/planificar">
                                            Crear Planificación
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <p className="font-display text-lg font-bold mb-2 text-foreground">
                                        Sin resultados
                                    </p>
                                    <p className="text-sm">
                                        No se encontraron planificaciones con ese filtro.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredPlans.map((saved) => (
                            <Card
                                key={saved.id}
                                className="border-border/50 bg-background/50 backdrop-blur-sm group hover:scale-[1.01] hover:shadow-md transition-all duration-200"
                            >
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <FileText className="w-6 h-6 text-brand-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-foreground">
                                                    {saved.plan.titulo}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="w-3.5 h-3.5" />
                                                    {saved.plan.nivel}
                                                </span>
                                                <span className="hidden sm:inline">·</span>
                                                <span>{saved.plan.asignaturas_involucradas?.[0] || 'ABP'}</span>
                                                <span className="hidden sm:inline">·</span>
                                                <span className="truncate max-w-[120px] hidden md:inline">{saved.plan.oas_sugeridos?.[0] || 'Propósito Abierto'}</span>
                                                <span className="hidden md:inline">·</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(saved.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                localStorage.setItem("360hacks_edit_plan", JSON.stringify(saved));
                                                router.push("/planificar");
                                            }}
                                            className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
                                            title="Abrir y Editar"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDownload(saved)}
                                            disabled={exportingId === saved.id}
                                            className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
                                        >
                                            {exportingId === saved.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedPlanVersions(saved)}
                                            className="text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
                                            title="Historial de Versiones (UTP)"
                                        >
                                            <History className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingId(saved.id)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </motion.main>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">¿Eliminar planificación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente de tu historial y no podrás iterar sobre ella.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Historial de Versiones (UTP) */}
            <Dialog open={!!selectedPlanVersions} onOpenChange={(open) => !open && setSelectedPlanVersions(null)}>
                <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-brand-200/50 dark:border-brand-800/50 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-display text-brand-900 dark:text-brand-100">
                            <History className="w-5 h-5 text-brand-600" />
                            Historial de Versiones (UTP)
                        </DialogTitle>
                        <DialogDescription>
                            Registro de iteraciones de &quot;{selectedPlanVersions?.plan.titulo}&quot; para trazabilidad técnico-pedagógica.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        {selectedPlanVersions?.versions && selectedPlanVersions.versions.length > 0 ? (
                            <div className="relative border-l-2 border-brand-200 dark:border-brand-800 ml-3 pl-6 space-y-6">
                                {/* Sort versions descending */}
                                {[...selectedPlanVersions.versions].sort((a, b) => b.version - a.version).map((v) => (
                                    <div key={v.version} className="relative">
                                        <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-brand-500 border-4 border-background" />
                                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-brand-700 dark:text-brand-300">
                                                    Versión {v.version}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(v.updatedAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground">
                                                {v.plan.duracion_total} · {v.plan.nivel}
                                            </p>
                                            {/* Show diff highlight if possible, for now just show title, or a note */}
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                Cambios registrados por iteración con IA.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 bg-muted/30 rounded-xl border border-border/50">
                                <History className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-sm font-medium text-foreground">Sin iteraciones registradas</p>
                                <p className="text-xs text-muted-foreground mt-1">Este proyecto solo tiene su versión inicial (v1).</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
