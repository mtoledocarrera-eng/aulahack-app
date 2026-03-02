"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, loginWithGoogle } from "@/lib/firebase/auth";
import { GraduationCap, Loader2, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { user } = useAuth();

    // Redirigir si ya está logueado (en useEffect para no mutar estado durante render)
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    if (user) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle();
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Google Auth error:", err);
            if (err.code === "auth/popup-closed-by-user") {
                setError("Cancelaste el inicio de sesión con Google.");
            } else if (err.code === "auth/popup-blocked") {
                setError("El navegador bloqueó la ventana emergente de Google.");
            } else {
                setError(err.message || "Error al iniciar sesión con Google.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await loginUser(email, password);
            } else {
                if (!name.trim()) {
                    throw new Error("El nombre es requerido para registrarse.");
                }
                await registerUser(email, password, name);
            }
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Auth error:", err);
            // Mensajes amigables
            if (err.code === "auth/invalid-credential") {
                setError("Correo o contraseña incorrectos.");
            } else if (err.code === "auth/email-already-in-use") {
                setError("Ya existe una cuenta con este correo.");
            } else if (err.code === "auth/weak-password") {
                setError("La contraseña debe tener al menos 6 caracteres.");
            } else {
                setError(err.message || "Ocurrió un error al intentar acceder.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <GraduationCap className="w-8 h-8 text-brand-600" />
                        <span className="font-display text-2xl font-bold gradient-text">
                            360Hacks
                        </span>
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                        {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta docente"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isLogin
                            ? "Ingresa para continuar planificando tus clases."
                            : "Únete y planifica con IA alineada al currículum."}
                    </p>
                </div>

                {/* Card Form */}
                <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-xl rounded-2xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre Completo</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Prof. Juan Pérez"
                                        className="bg-background/50"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.cl"
                                    className="bg-background/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-background/50"
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full h-12 rounded-xl border-2"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continuar con Google
                            </Button>

                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-border/50"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase tracking-wider font-semibold">o por email</span>
                                <div className="flex-grow border-t border-border/50"></div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl text-base"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
                                ) : (
                                    <>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"} <ArrowRight className="ml-2 w-5 h-5" /></>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-border/50 text-center">
                            <p className="text-sm text-muted-foreground">
                                {isLogin ? "¿No tienes cuenta aún?" : "¿Ya tienes una cuenta?"}{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError("");
                                    }}
                                    className="text-brand-600 font-medium hover:underline"
                                >
                                    {isLogin ? "Regístrate gratis" : "Inicia sesión"}
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Trust badge */}
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-dua-success" />
                    <span>Tus planificaciones se guardan de forma segura</span>
                </div>
            </div>
        </div>
    );
}
