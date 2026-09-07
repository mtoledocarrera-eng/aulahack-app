import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AulaHack — Planificador Pedagógico con IA",
    description:
        "Plataforma SaaS para docentes chilenos. Genera planificaciones de clase alineadas al currículum Mineduc con Diseño Universal para el Aprendizaje (DUA).",
    keywords: [
        "planificación docente",
        "DUA",
        "currículum chile",
        "inteligencia artificial educación",
        "Mineduc",
        "AulaHack",
    ],
    authors: [{ name: "AulaHack" }],
    icons: {
        icon: "/logo.png",
        apple: "/logo.png",
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "AulaHack",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    ],
    width: "device-width",
    initialScale: 1,
};

import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es-CL" suppressHydrationWarning>
            <body
                className="font-sans min-h-screen"
            >
                <ThemeProvider>
                    <AuthProvider>
                        {children}
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
