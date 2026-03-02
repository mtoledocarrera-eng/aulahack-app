"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="w-9 h-9" />;

    const isDark = theme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative w-9 h-9 rounded-xl hover:bg-brand-500/10 transition-all duration-300 group"
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            <Sun
                className={`w-5 h-5 absolute transition-all duration-300 ${isDark
                        ? "opacity-0 rotate-90 scale-0"
                        : "opacity-100 rotate-0 scale-100 text-neon-500"
                    }`}
            />
            <Moon
                className={`w-5 h-5 absolute transition-all duration-300 ${isDark
                        ? "opacity-100 rotate-0 scale-100 text-brand-400"
                        : "opacity-0 -rotate-90 scale-0"
                    }`}
            />
            <span className="sr-only">
                {isDark ? "Modo claro" : "Modo oscuro"}
            </span>
        </Button>
    );
}
