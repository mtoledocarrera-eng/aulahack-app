/**
 * PDF Lesson Plan Template — @react-pdf/renderer
 *
 * Exporta planificaciones como PDF estructurado con los 5 pasos,
 * adecuaciones DUA y referencia al Decreto 67.
 */

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";
import type { ProjectPlan, Rubric } from "@/lib/ai/schemas";

// ─── Styles ──────────────────────────────────────────────────────

const colors = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    success: "#10b981",
    successLight: "#ecfdf5",
    warning: "#f59e0b",
    text: "#1e293b",
    textMuted: "#64748b",
    border: "#e2e8f0",
    white: "#ffffff",
};

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: colors.text,
        lineHeight: 1.5,
        paddingBottom: 60, // Leave room for footer
    },
    // Header
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        borderBottom: `2px solid ${colors.primary}`,
        paddingBottom: 15,
    },
    headerTitleBox: {
        flex: 1,
        paddingRight: 16,
    },
    headerMetaBox: {
        alignItems: "flex-end",
        width: 150,
    },
    branding: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    logoBadge: {
        backgroundColor: colors.primary,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginRight: 2,
    },
    logoBadgeText: {
        color: colors.white,
        fontFamily: "Helvetica-Bold",
        fontSize: 14,
    },
    logoText: {
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
        fontSize: 14,
    },
    dateText: {
        fontSize: 9,
        color: colors.textMuted,
    },
    teacherText: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: colors.text,
        marginTop: 2,
    },
    title: {
        fontSize: 18,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 4,
    },
    metaItem: {
        fontSize: 9,
        color: colors.textMuted,
        marginBottom: 4,
    },
    metaValue: {
        fontFamily: "Helvetica-Bold",
        color: colors.text,
    },
    // OA Box
    oaBox: {
        backgroundColor: colors.primaryLight,
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
        borderLeft: `3px solid ${colors.primary}`,
    },
    oaLabel: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        marginBottom: 4,
    },
    oaText: {
        fontSize: 10,
        lineHeight: 1.4,
    },
    // Step Section
    section: {
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    stepNumber: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.primary,
        color: colors.white,
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        textAlign: "center",
        lineHeight: 22, // Vertically center
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
    },
    duration: {
        fontSize: 9,
        color: colors.textMuted,
        marginLeft: "auto",
    },
    sectionBody: {
        paddingLeft: 30,
    },
    description: {
        fontSize: 10,
        marginBottom: 6,
        lineHeight: 1.4,
    },
    resourcesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 6,
    },
    resourceTag: {
        fontSize: 8,
        backgroundColor: colors.primaryLight,
        color: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    teacherNote: {
        fontSize: 9,
        color: colors.textMuted,
        fontStyle: "italic",
    },
    teacherTip: {
        fontSize: 9,
        color: colors.warning,
        fontStyle: "italic",
        marginTop: 4,
    },
    // Guia Docente Box
    guideBox: {
        backgroundColor: "#fef2f2",
        borderRadius: 6,
        padding: 12,
        marginBottom: 14,
        borderLeft: `3px solid #ef4444`,
    },
    guideTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#ef4444",
        marginBottom: 8,
    },
    guideItemTitle: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.text,
        marginBottom: 2,
    },
    guideItemText: {
        fontSize: 9,
        color: colors.textMuted,
        marginBottom: 6,
    },
    // Evaluation
    evalBox: {
        backgroundColor: "#f0f9ff",
        borderRadius: 6,
        padding: 12,
        marginBottom: 14,
        borderLeft: `3px solid ${colors.warning}`,
    },
    evalType: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.warning,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    criteriaItem: {
        fontSize: 9,
        marginBottom: 2,
        paddingLeft: 8,
    },
    // DUA Section
    duaBox: {
        backgroundColor: colors.successLight,
        borderRadius: 6,
        padding: 12,
        borderLeft: `3px solid ${colors.success}`,
        marginBottom: 14,
    },
    duaTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: colors.success,
        marginBottom: 8,
    },
    duaGrid: {
        flexDirection: "row",
        gap: 8,
    },
    duaCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 4,
        padding: 8,
    },
    duaCardTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: colors.success,
        marginBottom: 4,
        textTransform: "uppercase",
    },
    duaCardContent: {
        fontSize: 9,
        lineHeight: 1.3,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 25,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 8,
        color: colors.textMuted,
        borderTop: `1px solid ${colors.border}`,
        paddingTop: 8,
    },
    footerBranding: {
        flexDirection: "row",
        alignItems: "center",
    },
    footerBadge: {
        backgroundColor: colors.primaryLight,
        borderRadius: 2,
        paddingHorizontal: 2,
        paddingVertical: 1,
        marginRight: 2,
    },
    footerBadgeText: {
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
    },
    footerLogoText: {
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
        marginRight: 4,
    },
    // Table Styles (for Rubric)
    table: {
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: colors.border,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: colors.primaryLight,
        padding: 5,
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableCellHeader: {
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
    },
    tableCell: {
        fontSize: 8,
    },
});

// ─── Component ───────────────────────────────────────────────────

interface LessonPlanPDFProps {
    plan: ProjectPlan;
    rubric?: Rubric | null;
    teacherName?: string;
}

export function LessonPlanPDF({ plan, rubric, teacherName }: LessonPlanPDFProps) {
    const formattedDate = new Intl.DateTimeFormat("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.headerTitleBox}>
                        <Text style={styles.title}>{plan.titulo}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaItem}>
                                Nivel: <Text style={styles.metaValue}>{plan.nivel}</Text>
                            </Text>
                            <Text style={styles.metaItem}>
                                Asignaturas:{" "}
                                <Text style={styles.metaValue}>{plan.asignaturas_involucradas?.join(", ")}</Text>
                            </Text>
                            <Text style={styles.metaItem}>
                                Duración:{" "}
                                <Text style={styles.metaValue}>{plan.duracion_total}</Text>
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerMetaBox}>
                        <View style={styles.branding}>
                            <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>360</Text></View>
                            <Text style={styles.logoText}>HACKS</Text>
                        </View>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                        {teacherName && <Text style={styles.teacherText}>{teacherName}</Text>}
                    </View>
                </View>

                {/* OA */}
                <View style={styles.oaBox}>
                    <Text style={styles.oaLabel}>Alineación Curricular y Propósito</Text>
                    <Text style={styles.oaText}>{plan.oas_sugeridos.join("\n")}</Text>

                    <Text style={[styles.oaLabel, { marginTop: 8 }]}>Habilidades a Desarrollar:</Text>
                    <Text style={styles.oaText}>{plan.habilidades_desarrolladas.join(", ")}</Text>

                    {plan.indicador_desarrollo_personal_social && (
                        <>
                            <Text style={[styles.oaLabel, { marginTop: 8 }]}>Dimensión Socioemocional (IDPS):</Text>
                            <Text style={styles.oaText}>{plan.indicador_desarrollo_personal_social}</Text>
                        </>
                    )}
                </View>

                {/* Step 1: Inicio */}
                <StepSection step={1} title="Preparación / Gancho" data={plan.fase_preparacion} />

                {/* Step 2: Desarrollo */}
                <StepSection step={2} title="Investigación y Acción" data={plan.fase_investigacion_accion} />

                {/* Step 3: Cierre */}
                <StepSection step={3} title="Síntesis y Metacognición" data={plan.fase_sintesis_metacognicion} />

                {/* Guía Docente */}
                {plan.guia_docente && (
                    <View style={styles.section}>
                        <View style={styles.guideBox}>
                            <Text style={styles.guideTitle}>Guía para el Docente</Text>
                            <Text style={styles.guideItemTitle}>🎯 Estrategia Motivacional:</Text>
                            <Text style={styles.guideItemText}>{plan.guia_docente.estrategia_motivacional}</Text>

                            <Text style={styles.guideItemTitle}>🚧 Posibles Obstáculos y Soluciones:</Text>
                            <Text style={styles.guideItemText}>{plan.guia_docente.posibles_obstaculos_y_soluciones}</Text>

                            <Text style={styles.guideItemTitle}>🌍 Conexiones con la Vida Real:</Text>
                            <Text style={styles.guideItemText}>{plan.guia_docente.conexiones_vida_real}</Text>
                        </View>
                    </View>
                )}

                {/* Step 4: Evaluación */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.stepNumber}>4</Text>
                        <Text style={styles.sectionTitle}>Evaluación (Decreto 67)</Text>
                    </View>
                    <View style={styles.evalBox}>
                        <Text style={styles.evalType}>Evaluación de Proceso y Final</Text>
                        <Text style={styles.description}>
                            Estrategia: {plan.evaluacion.estrategia_formativa}
                        </Text>
                        <Text style={styles.description}>
                            Instrumento: {plan.evaluacion.instrumento_calificacion}
                        </Text>
                        <Text
                            style={{
                                fontSize: 9,
                                fontFamily: "Helvetica-Bold",
                                marginBottom: 4,
                            }}
                        >
                            Criterios Clave:
                        </Text>
                        {plan.evaluacion.criterios.map((c, i) => (
                            <Text key={i} style={styles.criteriaItem}>
                                • {c}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Step 5: DUA */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text
                            style={[styles.stepNumber, { backgroundColor: colors.success }]}
                        >
                            5
                        </Text>
                        <Text style={styles.sectionTitle}>
                            Adecuaciones DUA (Decreto 83)
                        </Text>
                    </View>
                    <View style={styles.duaBox}>
                        <View style={styles.duaGrid}>
                            <View style={styles.duaCard}>
                                <Text style={styles.duaCardTitle}>Representación</Text>
                                <Text style={styles.duaCardContent}>
                                    {plan.adecuaciones_dua.representacion}
                                </Text>
                            </View>
                            <View style={styles.duaCard}>
                                <Text style={styles.duaCardTitle}>Acción y Expresión</Text>
                                <Text style={styles.duaCardContent}>
                                    {plan.adecuaciones_dua.accion_expresion}
                                </Text>
                            </View>
                            <View style={styles.duaCard}>
                                <Text style={styles.duaCardTitle}>Compromiso</Text>
                                <Text style={styles.duaCardContent}>
                                    {plan.adecuaciones_dua.compromiso}
                                </Text>
                            </View>
                            {plan.adecuaciones_dua.ajustes_ambientales_y_sensoriales_tea && (
                                <View style={[styles.duaCard, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
                                    <Text style={[styles.duaCardTitle, { color: '#d97706' }]}>Ley TEA (Ajustes - Insumo FU PIE)</Text>
                                    <Text style={styles.duaCardContent}>
                                        {plan.adecuaciones_dua.ajustes_ambientales_y_sensoriales_tea}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Disclaimer Decreto 67 */}
                <View style={[styles.section, { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }]}>
                    <Text style={{ fontSize: 8, color: '#64748b', fontStyle: 'italic', textAlign: 'justify' }}>
                        Nota de Responsabilidad Profesional: La presente planificación generada por AulaHack constituye un recurso de apoyo técnico-pedagógico inicial. El o la docente, en uso de su autonomía profesional y en estricto cumplimiento del Decreto 67 y normativas vigentes, debe validar, contextualizar y ajustar esta propuesta a la realidad específica de su aula y estudiantes. Bajo ningún concepto esta herramienta tecnológica reemplaza el proceso deliberativo del Equipo de Aula ni la toma de decisiones pedagógicas del Jefe Técnico (UTP).
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerBranding}>
                        <View style={styles.footerBadge}><Text style={styles.footerBadgeText}>360</Text></View>
                        <Text style={styles.footerLogoText}>HACKS</Text>
                        <Text>Planificador Pedagógico con IA</Text>
                    </View>
                    <Text>Generado automáticamente · Decreto 67/83</Text>
                    <Text render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`} />
                </View>
            </Page>

            {/* Rubric Page (Optional) */}
            {rubric && (
                <Page size="LETTER" style={styles.page}>
                    <View style={styles.headerContainer} fixed>
                        <View style={styles.headerTitleBox}>
                            <Text style={styles.title}>Rúbrica de Evaluación</Text>
                            <Text style={styles.subtitle}>{rubric.titulo}</Text>
                        </View>
                        <View style={styles.headerMetaBox}>
                            <View style={styles.branding}>
                                <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>360</Text></View>
                                <Text style={styles.logoText}>HACKS</Text>
                            </View>
                            <Text style={styles.dateText}>{formattedDate}</Text>
                            {teacherName && <Text style={styles.teacherText}>{teacherName}</Text>}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Indicadores de Evaluación</Text>
                        {rubric.indicadores_evaluacion.map((ind, i) => (
                            <Text key={i} style={styles.criteriaItem}>• {ind}</Text>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Matriz de Logro</Text>
                        <View style={styles.table}>
                            {/* Header */}
                            <View style={styles.tableRow}>
                                <View style={[styles.tableColHeader, { width: '15%' }]}>
                                    <Text style={styles.tableCellHeader}>Dimensión</Text>
                                </View>
                                {rubric.criterios[0].niveles.map((nivel, i) => (
                                    <View key={i} style={[styles.tableColHeader, { width: `${85 / rubric.criterios[0].niveles.length}%` }]}>
                                        <Text style={styles.tableCellHeader}>{nivel.nombre} ({nivel.puntaje} pts)</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Body */}
                            {rubric.criterios.map((criterio, i) => (
                                <View key={i} style={styles.tableRow}>
                                    <View style={[styles.tableCol, { width: '15%', backgroundColor: '#f8fafc' }]}>
                                        <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{criterio.dimension}</Text>
                                    </View>
                                    {criterio.niveles.map((nivel, j) => (
                                        <View key={j} style={[styles.tableCol, { width: `${85 / criterio.niveles.length}%` }]}>
                                            <Text style={styles.tableCell}>{nivel.descripcion}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Footer for Rubric Page */}
                    <View style={styles.footer} fixed>
                        <View style={styles.footerBranding}>
                            <View style={styles.footerBadge}><Text style={styles.footerBadgeText}>360</Text></View>
                            <Text style={styles.footerLogoText}>HACKS</Text>
                            <Text>Rúbrica de Evaluación generada con IA</Text>
                        </View>
                        <Text render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`} />
                    </View>
                </Page>
            )}
        </Document>
    );
}

// ─── Sub-components ──────────────────────────────────────────────

function StepSection({
    step,
    title,
    data,
}: {
    step: number;
    title: string;
    data: {
        titulo: string;
        duracion: string;
        tiempo_estimado_minutos?: number;
        descripcion_actividad_estudiante: string;
        recursos: string[];
        rol_docente: string;
        tips_gestion_aula?: string;
    };
}) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.stepNumber}>{step}</Text>
                <Text style={styles.sectionTitle}>
                    {title}: {data.titulo}
                </Text>
                <Text style={styles.duration}>{data.duracion} {data.tiempo_estimado_minutos ? `(~${data.tiempo_estimado_minutos}m)` : ''}</Text>
            </View>
            <View style={styles.sectionBody}>
                <Text style={[styles.description, { fontFamily: "Helvetica-Bold" }]}>Acción del Estudiante:</Text>
                <Text style={styles.description}>{data.descripcion_actividad_estudiante}</Text>
                {data.recursos && data.recursos.length > 0 && (
                    <View style={styles.resourcesRow}>
                        {data.recursos.map((r, i) => (
                            <Text key={i} style={styles.resourceTag}>
                                {r}
                            </Text>
                        ))}
                    </View>
                )}
                <Text style={styles.teacherNote}>
                    💡 Mediación: {data.rol_docente}
                </Text>
                {data.tips_gestion_aula && (
                    <Text style={styles.teacherTip}>
                        🛡️ Tip de Aula: {data.tips_gestion_aula}
                    </Text>
                )}
            </View>
        </View>
    );
}
