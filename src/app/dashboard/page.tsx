"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    PlusCircle,
    Clock,
    BookOpen,
    TrendingUp,
    GraduationCap,
    FileText,
    Settings,
    LogOut,
    Sparkles,
} from "lucide-react";
import { getTeacherPlans, type StoredLessonPlan } from "@/lib/firebase/firestore";
import { useProtectedRoute } from "@/lib/hooks/useProtectedRoute";
import { logoutUser } from "@/lib/firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeacherCoaching } from "@/components/TeacherCoaching";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardPage() {
    const { user, loading } = useProtectedRoute();
    const [stats, setStats] = useState({
        totalPlans: 0,
        thisMonth: 0,
        uniqueSubjects: 0,
        hoursEstimated: 0,
    });
    const [recentPlans, setRecentPlans] = useState<StoredLessonPlan[]>([]);

    useEffect(() => {
        async function loadDashboardData() {
            if (!user) return;
            try {
                const plans = await getTeacherPlans(user.uid);
                const now = new Date();
                const thisMonthPlans = plans.filter(p => {
                    const d = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });
                const subjects = new Set(plans.flatMap(p => p.plan.asignaturas_involucradas || []));
                setStats({
                    totalPlans: plans.length,
                    thisMonth: thisMonthPlans.length,
                    uniqueSubjects: subjects.size,
                    hoursEstimated: plans.length * 2, // ~2 horas ahorradas por plan
                });
                setRecentPlans(plans.slice(0, 3));
            } catch (err) {
                console.error("[Dashboard] Error cargando datos:", err);
            }
        }
        loadDashboardData();
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-r border-border/50 p-6 flex flex-col z-10"
            >
                <div className="flex items-center gap-2 mb-10">
                    <Image src="/logo.png" alt="AulaHack" width={36} height={36} className="rounded-lg" />
                    <span className="font-display text-xl font-bold gradient-text">
                        AulaHack
                    </span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem href="/dashboard" icon={TrendingUp} label="Dashboard" active />
                    <NavItem href="/planificar" icon={PlusCircle} label="Nueva Planificación" />
                    <NavItem href="/historial" icon={Clock} label="Historial" />
                    <NavItem href="/historial" icon={BookOpen} label="Mis Proyectos" />
                </nav>

                <div className="space-y-2 pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between px-4 py-2">
                        <span className="text-xs font-medium text-muted-foreground">Tema</span>
                        <ThemeToggle />
                    </div>
                    <NavItem href="/dashboard" icon={Settings} label="Configuración" />
                    <button
                        onClick={() => logoutUser()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="ml-64 p-8"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold mb-2">
                        ¡Bienvenido/a, {user?.displayName?.split(" ")[0] || "Docente"}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Tu asistente pedagógico con IA está listo para ayudarte.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Planificaciones"
                        value={stats.thisMonth.toString()}
                        subtitle="este mes"
                        icon={FileText}
                        color="brand"
                    />
                    <StatCard
                        title="Horas Ahorradas"
                        value={stats.hoursEstimated.toString()}
                        subtitle="estimado"
                        icon={Clock}
                        color="success"
                    />
                    <StatCard
                        title="Asignaturas"
                        value={stats.uniqueSubjects.toString()}
                        subtitle={`en ${stats.totalPlans} proyectos`}
                        icon={BookOpen}
                        color="info"
                    />
                </div>

                {/* Quick Action */}
                <Card className="mb-8 border-border/50 bg-background/50 backdrop-blur-sm shadow-sm group hover:shadow-md transition-all duration-300">
                    <CardContent className="p-8 flex items-center justify-between">
                        <div>
                            <h2 className="font-display text-2xl font-bold mb-2 text-foreground">
                                Crear Nueva Planificación
                            </h2>
                            <p className="text-muted-foreground max-w-lg">
                                Nuestro asistente te guiará paso a paso con preguntas
                                inteligentes para crear una planificación alineada al
                                currículum Mineduc con adecuaciones DUA.
                            </p>
                        </div>
                        <Button asChild size="lg" className="rounded-xl bg-neon-500 hover:bg-neon-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all outline-none border-none">
                            <Link href="/planificar" className="flex items-center gap-2">
                                <PlusCircle className="w-5 h-5" />
                                Planificar con IA
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Plans */}
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="font-display text-xl font-bold">
                            Planificaciones Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentPlans.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="font-medium">Aún no tienes planificaciones</p>
                                <p className="text-sm mt-1">
                                    Crea tu primera planificación y aparecerá aquí.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentPlans.map((saved) => (
                                    <PlanRow
                                        key={saved.id}
                                        title={saved.plan.titulo}
                                        subject={saved.plan.asignaturas_involucradas?.[0] || 'ABP'}
                                        level={saved.plan.nivel}
                                        date={formatRelativeDate(saved.createdAt)}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Teacher Coaching AI */}
                <div className="mt-8">
                    <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-600" />
                        Coaching Pedagógico
                    </h2>
                    <TeacherCoaching uid={user.uid} />
                </div>
            </motion.main>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatRelativeDate(dateValue: string | Date): string {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
    });
}

// ─── Sub-components ──────────────────────────────────────────────

function NavItem({
    href,
    icon: Icon,
    label,
    active = false,
}: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                ? "bg-brand-500/10 text-brand-400 border border-brand-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: "brand" | "success" | "info";
}) {
    const colorMap = {
        brand: "bg-brand-100/50 text-brand-600 dark:bg-brand-900/40",
        success: "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/40",
        info: "bg-cyan-100/50 text-cyan-600 dark:bg-cyan-900/40",
    };

    return (
        <Card className="group hover:scale-[1.02] hover:shadow-md border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold tracking-tight text-muted-foreground">
                        {title}
                    </span>
                    <div
                        className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center transition-colors`}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-3xl font-bold font-display text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
            </CardContent>
        </Card>
    );
}

function PlanRow({
    title,
    subject,
    level,
    date,
}: {
    title: string;
    subject: string;
    level: string;
    date: string;
}) {
    return (
        <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">
                        {subject} · {level}
                    </p>
                </div>
            </div>
            <span className="text-sm text-muted-foreground">{date}</span>
        </div>
    );
}
