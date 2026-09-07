import type { ExitTicket, ProjectPlan } from "./schemas";

/**
 * Construye el Ticket de salida universal de Aprender a aprender.
 *
 * Se genera localmente para que todas las planificaciones incluyan una
 * evidencia individual y una pregunta metacognitiva sin consumir otra llamada
 * al modelo. El contenido se contextualiza con el título, la asignatura y la
 * primera alineación oficial del plan.
 */
export function buildUniversalExitTicket(plan: ProjectPlan): ExitTicket {
    const firstAlignment = plan.alineacion_oas?.[0];
    const oaNumber = firstAlignment?.numero.replace(/^OA\s*/i, "").trim();
    const oaFocus = firstAlignment
        ? `el OA ${oaNumber} de ${firstAlignment.asignatura}`
        : "el aprendizaje trabajado";

    return {
        titulo: `Ticket de salida · ${plan.titulo}`,
        tiempo_estimado: "8 a 10 minutos",
        instrucciones:
            "Responde individualmente. No se evalúa solo el resultado: interesa mostrar qué comprendiste, qué evidencia tienes y cómo evolucionó tu explicación.",
        preguntas: [
            {
                numero: 1,
                tipo: "evidencia",
                enunciado: `¿Qué puedes afirmar que aprendiste hoy sobre ${oaFocus}? Escribe una afirmación y respáldala con una evidencia concreta de tu trabajo (un dato, procedimiento, explicación, decisión o producto).`,
                evidencia_esperada:
                    "Una afirmación comprensible vinculada con el aprendizaje del proyecto y una evidencia concreta que permita verificarla.",
            },
            {
                numero: 2,
                tipo: "metacognicion",
                enunciado:
                    "¿Qué cambió en tu hipótesis, estrategia o explicación después de observar, probar o recibir feedback? Explica qué evidencia produjo ese cambio y qué harías en un siguiente intento.",
                evidencia_esperada:
                    "Describe la idea o estrategia inicial, el cambio realizado, la evidencia que lo motivó y un próximo paso posible.",
            },
        ],
        criterios_revision: [
            "Relaciona una afirmación de aprendizaje con una evidencia concreta.",
            "Explica el cambio entre la idea o estrategia inicial y la revisada.",
            "Propone un siguiente intento razonable a partir del feedback o la evidencia.",
        ],
        extension_visual: {
            titulo: "Extensión opcional · Representar para profundizar",
            enunciado:
                "Si quieres profundizar, representa tu nueva explicación para un compañero mediante una miniinfografía, esquema, diagrama o explicación oral acompañada de un apoyo visual.",
            formas_equivalentes: [
                "Miniinfografía",
                "Esquema o diagrama",
                "Explicación oral con apoyo visual",
                "Audio breve acompañado de un boceto",
            ],
            criterio:
                "La representación conecta el problema o pregunta, la evidencia y la conclusión; no se evalúa la destreza artística.",
        },
        apoyos_dua: {
            representacion:
                "Releer la pregunta y el criterio con ejemplos de afirmación y evidencia; permitir apoyos visuales o lectura en voz alta.",
            accion_expresion:
                "Aceptar respuesta escrita, oral, grabada o mediante organizador gráfico, manteniendo la misma evidencia de aprendizaje.",
            compromiso:
                "Anticipar el tiempo, ofrecer una secuencia de dos pasos y permitir una pausa breve antes de revisar la respuesta.",
        },
    };
}
