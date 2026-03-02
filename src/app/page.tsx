"use client";

import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    Sparkles,
    Shield,
    ArrowRight,
    GraduationCap,
    FileText,
    Accessibility,
    LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { logoutUser } from "@/lib/firebase/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

function AuthNavButtons() {
    const { user, loading } = useAuth();

    if (loading) return <div className="w-24 h-10 animate-pulse bg-muted rounded-xl"></div>;

    if (user) {
        return (
            <>
                <div className="text-sm font-medium text-foreground mr-2 hidden sm:block">
                    Hola, {user.displayName || "Docente"}
                </div>
                <Link
                    href="/dashboard"
                    className="px-5 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/25 transition-all"
                >
                    Ir al Dashboard
                </Link>
                <button
                    onClick={() => logoutUser()}
                    className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </>
        );
    }

    return (
        <>
            <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-lg"
            >
                Iniciar Sesión
            </Link>
            <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium bg-neon-500 hover:bg-neon-600 text-white rounded-xl shadow-lg shadow-neon-500/30 hover:shadow-neon-500/50 transition-all duration-300 hover:-translate-y-0.5"
            >
                Comenzar Gratis
            </Link>
        </>
    );
}

export default function HomePage() {
    const { user, loading } = useAuth();

    return (
        <main className="min-h-screen gradient-bg">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Animated background orbs */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl animate-pulse-subtle" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-dua-info/10 rounded-full blur-3xl animate-pulse-subtle delay-1000" />
                </div>

                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.png" alt="AulaHack" width={36} height={36} className="rounded-lg" />
                        <span className="font-display text-xl font-bold gradient-text">
                            AulaHack
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <AuthNavButtons />
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        Potenciado por Inteligencia Artificial
                    </div>

                    <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        <span className="gradient-text">Planifica tus clases</span>
                        <br />
                        <span className="text-foreground">en minutos, no horas</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
                        Genera planificaciones alineadas a las{" "}
                        <strong className="text-foreground">
                            Bases Curriculares del Mineduc
                        </strong>{" "}
                        con{" "}
                        <strong className="text-foreground">
                            Diseño Universal para el Aprendizaje (DUA)
                        </strong>
                        . Tu asistente pedagógico con IA.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {loading ? (
                            <div className="w-56 h-14 animate-pulse bg-muted/50 rounded-2xl"></div>
                        ) : user ? (
                            <Link
                                href="/planificar"
                                className="group flex items-center gap-2 px-8 py-4 bg-neon-500 hover:bg-neon-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-neon-500/30 hover:shadow-neon-500/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                Crear Planificación
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="group flex items-center gap-2 px-8 py-4 bg-neon-500 hover:bg-neon-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-neon-500/30 hover:shadow-neon-500/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                Comenzar Gratis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                        <Link
                            href="#features"
                            className="px-8 py-4 text-lg font-semibold text-foreground/70 hover:text-foreground transition-colors"
                        >
                            Ver características
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                            Diseñado para{" "}
                            <span className="gradient-text">docentes chilenos</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            Cada función está construida sobre el marco curricular oficial y
                            los principios DUA.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-7 h-7 text-brand-600" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3">
                                Currículum Oficial
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Objetivos de Aprendizaje extraídos directamente de las Bases
                                Curriculares Mineduc. Sin inventos, sin alucinaciones.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-dua-success/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Accessibility className="w-7 h-7 text-dua-success" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3">
                                DUA Integrado
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Cada planificación incluye adecuaciones curriculares en los 3
                                principios DUA: representación, acción y compromiso.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300">
                            <div className="w-14 h-14 rounded-2xl bg-dua-info/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7 text-dua-info" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3">
                                Exporta a PDF
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Descarga tus planificaciones listas para imprimir o compartir.
                                Estructura de clase en 5 pasos según Decreto 67.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16 px-6 border-t border-border/50">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">
                            Cumplimiento normativo garantizado
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-dua-success" />
                            Decreto 67
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-dua-success" />
                            Decreto 83
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-dua-success" />
                            Bases Curriculares
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-dua-success" />
                            Ley 20.903
                        </span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-border/50 text-center text-sm text-muted-foreground">
                <p>© 2026 AulaHack. Plataforma educativa para docentes chilenos.</p>
            </footer>
        </main>
    );
}
