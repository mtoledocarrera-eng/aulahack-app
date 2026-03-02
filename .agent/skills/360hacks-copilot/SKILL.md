---
name: 360Hacks Copilot (Full Stack SaaS Edition)
description: Guía maestra definitiva para la reconstrucción, mantenimiento y escalamiento del SaaS "AulaHack / 360Hacks", el Copiloto Pedagógico Inteligente.
---

# 360Hacks Copilot Skill: Arquitectura Definitiva (CGE-360)

Eres el equipo principal de ingeniería a cargo del SaaS "AulaHack" (anteriormente 360Hacks). 
Esta guía contiene el ADN tecnológico, normativo y arquitectónico del sistema. Úsala como base de conocimiento para reparar bugs, añadir funcionalidades o incluso reconstruir la app desde cero.

## 1. STACK TECNOLÓGICO Y ARQUITECTURA
- **Frontend & Meta-Framework:** Next.js 15 (App Router). Optimizado para Vercel.
- **Lenguaje:** TypeScript estricto.
- **Estilos y UI:** Tailwind CSS y Shadcn UI. Tema oscuro/claro interactivo. Estética "Data-Dense Dashboard" (diseño premium, neón, glassmorphism).
- **Backend (BaaS):** Firebase.
  - *Auth:* Autenticación con credenciales Google y Email/Password.
  - *Firestore:* Base de datos documental (`users`, `lesson_plans`, `user_feedback`, `analytics_events`).
  - *Storage:* Para almacenar recursos estáticos si se requiere a futuro.

## 2. MOTOR DE INTELIGENCIA ARTIFICIAL (Flip Engine)
El corazón de AulaHack es un motor de IA orquestado meticulosamente en `src/lib/ai`, no un simple chatbot.
- **Modelos:** Se utiliza el SDK oficial `@google/generative-ai`.
- **Patrón de Cascada (Fallback):** Generación resiliente. Si falla el modelo primario (ej. `gemini-2.5-flash` por Cuota 429), el sistema escala automáticamente hacia un array de 4 modelos de respaldo (`gemini-2.5-flash-lite`, `gemini-2.0-flash`, etc.).
- **Validación Estricta Estructurada (Zod):** Todo el output de la IA debe adherirse a esquemas garantizados (`projectPlanSchema`, `teacherInputSchema`, `rubricSchema`). Si el JSON viene roto, el sistema salta al siguiente modelo.
- **Flip Prompting:** La IA invierte el rol. En vez de solo responder, evalúa el input del docente. Si falta información crítica (ej. "Ni el propósito de la clase"), formula una `flipQuestion` clarificadora en pantalla (con opciones e inspiración creativa) antes de proceder a la planificación pesada.
- **Scrubbing PII (Data Privacy):** Antes de enviar la carga útil a la API de Google, un middleware elimina RUTs (RegEx chileno) y Nombres Sensibles del texto de entrada para cumplir cabalmente la Ley 19.628 de protección de datos.

## 3. LÓGICA DE NEGOCIO Y PAGOS (Flow.cl)
- Modelo de Suscripción PWA manejado a través de **Flow.cl**.
- **Tiering:** Plan "Free/Trial", "Pro" y "Premium".
- **Gestión de Acceso (`src/lib/payments/flow.ts`):** Función `hasAccess(uid)` que verifica fechas de expiración. Incluye Grace Period (3 días de salvavidas) en caso de fallo de tarjeta bancaria, priorizando no cortar el uso en la sala de clases.
- **Restricción UI:** Paywall Dialog interactivo en el Frontend si la suscripción expiró.

## 4. MOTOR RAG: CONTEXTUALIZACIÓN PEDAGÓGICA Y NORMATIVA
Toda respuesta del modelo debe cumplir con este "cerebro" institucional inyectado dinámicamente mediante Prompts Extendidos (`src/lib/ai/prompts.ts`):
- **Agencia de Calidad:** Existe un documento `docs/agencia_calidad_report.txt` que es inyectado vía lectura asíncrona (`fs.readFileSync`) en el Coach Pedagógico. Obliga a la IA a priorizar el "Pensamiento Crítico" y "Creativo" de la escuela.
- **Constructivismo:** Las clases deben tener 3 fases (Activación/Preparación, Investigación/Construcción, Síntesis/Metacognición) e indicar el tiempo exacto en minutos.
- **Ley TEA y DUA:** El generador siempre incluirá las 3 redes DUA (Decreto 83) y una sección de "Ajustes Ambientales y Sensoriales" orientados al espectro autista (Ley 21.545), exportables como insumo al Formulario Único PIE.
- **Decreto 67:** Sugerencias robustas sobre evaluación formativa integrada (Rúbricas generables y pautas de observación constructivas).
- **Control UTP:** Trazabilidad de cada documento y exportación limpia a PDF mediante `@react-pdf/renderer` con un potente disclaimer jurídico de Responsabilidad Profesional Docente.

## 5. RECOMENDACIONES PARA EL DESARROLLO FUTURO
- Para agregar o modificar lógicas o flujos, **SIEMPRE** usar la herramienta `task_boundary` en la terminal (modo `PLANNING` primero, luego `EXECUTION`).
- Las variables para producción (Vercel) siempre requieren actualización dual (en `.env.local` y en el portal web GUI de configuración de Vercel). Prestar vital atención a `NEXT_PUBLIC_APP_URL` para que los retornos de Pasarela de Pagos (Flow) apunten al destino Vercel y no a `localhost`.
- Antes de cada despliegue, compilar la build usando `npm run build` y correr las pruebas (`npm run test`) ejecutadas por `Jest` para certificar la estabilidad de los flujos de "Cascada IA", "Flip Prompts" y validadores "Zod".
