"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Users, Calculator, Settings2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type AchievementLevel = "A" | "B" | "C" | "D" | null;

interface GradeConfig {
    A: number;
    B: number;
    C: number;
    D: number;
}

interface StudentRow {
    name: string;
    grades: Record<string, AchievementLevel>;
}

interface GradingMatrixProps {
    criterios: string[];
    planTitle: string;
}

// ─── Constants ──────────────────────────────────────────────────

const LEVEL_META: Record<string, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
    A: { label: "A", color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/30", borderColor: "border-emerald-300 dark:border-emerald-700", description: "Logro Alto (86%+)" },
    B: { label: "B", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/30", borderColor: "border-blue-300 dark:border-blue-700", description: "Logro Adecuado (71-85%)" },
    C: { label: "C", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/30", borderColor: "border-amber-300 dark:border-amber-700", description: "Por Lograr (60-70%)" },
    D: { label: "D", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/30", borderColor: "border-red-300 dark:border-red-700", description: "No Logrado (≤59%)" },
};

const DEFAULT_GRADES: GradeConfig = { A: 6.6, B: 5.5, C: 4.4, D: 3.0 };

// ─── Component ──────────────────────────────────────────────────

export function GradingMatrix({ criterios, planTitle }: GradingMatrixProps) {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [studentInput, setStudentInput] = useState("");
    const [showConfig, setShowConfig] = useState(false);
    const [gradeConfig, setGradeConfig] = useState<GradeConfig>({ ...DEFAULT_GRADES });
    const [step, setStep] = useState<"input" | "grading">("input");

    // Parse student names from textarea
    const handleLoadStudents = useCallback(() => {
        const names = studentInput
            .split("\n")
            .map((n) => n.trim())
            .filter((n) => n.length > 0);

        if (names.length === 0) return;

        setStudents(
            names.map((name) => ({
                name,
                grades: Object.fromEntries(criterios.map((c) => [c, null])),
            }))
        );
        setStep("grading");
    }, [studentInput, criterios]);

    // Toggle a student's grade for a criterion
    const cycleGrade = useCallback(
        (studentIdx: number, criterio: string) => {
            setStudents((prev) => {
                const next = [...prev];
                const current = next[studentIdx].grades[criterio];
                const cycle: AchievementLevel[] = [null, "A", "B", "C", "D"];
                const idx = cycle.indexOf(current);
                next[studentIdx] = {
                    ...next[studentIdx],
                    grades: {
                        ...next[studentIdx].grades,
                        [criterio]: cycle[(idx + 1) % cycle.length],
                    },
                };
                return next;
            });
        },
        []
    );

    // Calculate final grade for a student
    const calcFinalGrade = useCallback(
        (student: StudentRow): number | null => {
            const values = Object.values(student.grades).filter(
                (g): g is "A" | "B" | "C" | "D" => g !== null
            );
            if (values.length === 0) return null;
            const sum = values.reduce((acc, g) => acc + gradeConfig[g], 0);
            return Math.round((sum / values.length) * 10) / 10;
        },
        [gradeConfig]
    );

    // Export CSV
    const handleExportCSV = useCallback(() => {
        const header = ["Estudiante", ...criterios, "Nota Final"].join(",");
        const rows = students.map((s) => {
            const grades = criterios.map((c) => s.grades[c] || "-");
            const final = calcFinalGrade(s);
            return [s.name, ...grades, final !== null ? final.toFixed(1) : "-"].join(",");
        });
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `calificaciones-${planTitle.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [students, criterios, calcFinalGrade, planTitle]);

    // Stats
    const stats = useMemo(() => {
        const finals = students.map(calcFinalGrade).filter((g): g is number => g !== null);
        if (finals.length === 0) return null;
        return {
            promedio: (finals.reduce((a, b) => a + b, 0) / finals.length).toFixed(1),
            aprobados: finals.filter((g) => g >= 4.0).length,
            reprobados: finals.filter((g) => g < 4.0).length,
        };
    }, [students, calcFinalGrade]);

    // ─── Step 1: Student Input ──────────────────────
    if (step === "input") {
        return (
            <Card className="border-brand-200 dark:border-brand-800 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-brand-600" />
                        Matriz de Calificación
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Pega la lista de tus estudiantes (un nombre por línea). Puedes copiarla directo desde Excel o tu libro de clases.
                    </p>
                    <Textarea
                        value={studentInput}
                        onChange={(e) => setStudentInput(e.target.value)}
                        placeholder={"Juan Pérez\nMaría González\nCarlos López\n..."}
                        rows={8}
                        className="font-mono text-sm bg-background/50"
                    />
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {studentInput.split("\n").filter((n) => n.trim()).length} estudiantes detectados
                        </p>
                        <Button
                            onClick={handleLoadStudents}
                            disabled={!studentInput.trim()}
                            className="rounded-xl font-semibold"
                        >
                            <Calculator className="w-4 h-4 mr-2" />
                            Crear Pauta
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ─── Step 2: Grading Table ──────────────────────
    return (
        <div className="space-y-4">
            {/* Header + Config */}
            <Card className="border-brand-200 dark:border-brand-800 shadow-lg">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="w-5 h-5 text-brand-600" />
                            Pauta de Calificación — {students.length} estudiantes
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowConfig(!showConfig)}
                                className="rounded-lg text-xs"
                            >
                                <Settings2 className="w-3 h-3 mr-1" />
                                Configurar Notas
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStep("input")}
                                className="rounded-lg text-xs"
                            >
                                Cambiar Lista
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    {/* Grade Config Panel */}
                    {showConfig && (
                        <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border/50 space-y-3">
                            <p className="text-sm font-medium">Equivalencia Nivel → Nota (editable)</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(["A", "B", "C", "D"] as const).map((level) => (
                                    <div key={level} className="flex items-center gap-2">
                                        <span className={`text-sm font-bold px-2 py-1 rounded ${LEVEL_META[level].bgColor} ${LEVEL_META[level].color}`}>
                                            {level}
                                        </span>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="2.0"
                                            max="7.0"
                                            value={gradeConfig[level]}
                                            onChange={(e) =>
                                                setGradeConfig((prev) => ({
                                                    ...prev,
                                                    [level]: parseFloat(e.target.value) || prev[level],
                                                }))
                                            }
                                            className="w-20 text-center text-sm font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Escala chilena: 2.0 (mínimo) a 7.0 (máximo). Nota de aprobación: 4.0 (60% exigencia).
                            </p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(["A", "B", "C", "D"] as const).map((level) => (
                            <span key={level} className={`text-xs px-2 py-1 rounded-full border ${LEVEL_META[level].bgColor} ${LEVEL_META[level].color} ${LEVEL_META[level].borderColor}`}>
                                {level}: {LEVEL_META[level].description} → {gradeConfig[level].toFixed(1)}
                            </span>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-border/50">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="text-left px-3 py-2 font-medium border-b border-border/50 min-w-[160px]">Estudiante</th>
                                    {criterios.map((c, i) => (
                                        <th key={i} className="text-center px-2 py-2 font-medium border-b border-border/50 min-w-[90px]">
                                            <span className="text-xs">{c}</span>
                                        </th>
                                    ))}
                                    <th className="text-center px-3 py-2 font-bold border-b border-border/50 min-w-[80px] bg-brand-50 dark:bg-brand-900/20">
                                        Nota
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, si) => {
                                    const finalGrade = calcFinalGrade(student);
                                    const isApproved = finalGrade !== null && finalGrade >= 4.0;
                                    return (
                                        <tr key={si} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 font-medium">{student.name}</td>
                                            {criterios.map((c, ci) => {
                                                const level = student.grades[c];
                                                const meta = level ? LEVEL_META[level] : null;
                                                return (
                                                    <td key={ci} className="text-center px-1 py-1">
                                                        <button
                                                            onClick={() => cycleGrade(si, c)}
                                                            className={`
                                                                w-full py-1.5 rounded-lg text-xs font-bold border transition-all duration-150
                                                                hover:scale-105 active:scale-95 cursor-pointer
                                                                ${meta
                                                                    ? `${meta.bgColor} ${meta.color} ${meta.borderColor}`
                                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700"
                                                                }
                                                            `}
                                                        >
                                                            {level || "—"}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                            <td className={`text-center px-3 py-2 font-bold font-mono text-base ${finalGrade !== null
                                                ? isApproved
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-red-600 dark:text-red-400"
                                                : "text-gray-400"
                                                }`}>
                                                {finalGrade !== null ? finalGrade.toFixed(1) : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Stats + Export */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
                        {stats && (
                            <div className="flex gap-4 text-sm">
                                <span className="text-muted-foreground">Promedio: <strong className="text-foreground">{stats.promedio}</strong></span>
                                <span className="text-emerald-600 dark:text-emerald-400">Aprobados: <strong>{stats.aprobados}</strong></span>
                                <span className="text-red-600 dark:text-red-400">Reprobados: <strong>{stats.reprobados}</strong></span>
                            </div>
                        )}
                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            className="rounded-xl font-semibold"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Notas (CSV)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
