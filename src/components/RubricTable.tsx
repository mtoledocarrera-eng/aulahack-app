"use client";

import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import type { Rubric } from "@/lib/ai/schemas";

interface RubricTableProps {
    rubric: Rubric;
}

export default function RubricTable({ rubric }: RubricTableProps) {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                    <h3 className="font-display text-lg font-bold">
                        {rubric.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Rúbrica analítica alineada al Decreto 67
                    </p>
                </div>
            </div>

            {/* Indicadores */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Indicadores de Evaluación
                </p>
                <ul className="grid md:grid-cols-2 gap-2">
                    {rubric.indicadores_evaluacion.map((ind, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                            <span>{ind}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tabla de Rúbrica */}
            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="p-4 text-sm font-bold w-1/4">Criterio / Dimensión</th>
                            <th className="p-4 text-sm font-bold bg-green-50/50 dark:bg-green-900/10">Logrado (3 pts)</th>
                            <th className="p-4 text-sm font-bold bg-yellow-50/50 dark:bg-yellow-900/10">Medianamente (2 pts)</th>
                            <th className="p-4 text-sm font-bold bg-red-50/50 dark:bg-red-900/10">Por Lograr (1 pt)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rubric.criterios.map((crit, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 align-top">
                                    <p className="font-bold text-sm">{crit.dimension}</p>
                                </td>
                                {crit.niveles.map((nivel, j) => (
                                    <td
                                        key={j}
                                        className={`p-4 align-top text-xs leading-relaxed ${nivel.nombre === "Logrado" ? "bg-green-50/20 dark:bg-green-900/5" :
                                            nivel.nombre === "Medianamente Logrado" ? "bg-yellow-50/20 dark:bg-yellow-900/5" :
                                                "bg-red-50/20 dark:bg-red-900/5"
                                            }`}
                                    >
                                        {nivel.descripcion}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
