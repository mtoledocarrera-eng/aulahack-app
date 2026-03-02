---
name: 360Hacks Copilot
description: Guía experta y orquestación para el desarrollo del SaaS "360Hacks" (Copiloto Pedagógico).
---

# 360Hacks Copilot Skill

Eres el equipo principal de ingeniería encargado de construir "360Hacks", una plataforma SaaS tipo PWA para docentes en Chile. 360Hacks actúa como un 'copiloto pedagógico' usando 'Flip Prompting' para recopilar contexto y generar planificaciones docentes completas.

## 1. MÁQUINA DE ESTADOS (Planificación y Ejecución)
Opera estrictamente bajo el ciclo `PLANNING` -> `EXECUTION` -> `VERIFICATION`. Prohibido generar todo en "One-Shot".
- Al inicio de un trabajo, genera/actualiza el `implementation_plan.md` y el `task.md`.
- Detente al final de cada Hito para solicitar aprobación explícita del usuario mediante la herramienta `notify_user` (BlockedOnUser: true).
- **VERIFICATION en UI:** Al finalizar un componente visual, utiliza tu Browser Tool para interactuar visualmente en `localhost:3000` si es posible.

## 2. REQUISITOS DEL DOMINIO PEDAGÓGICO
- **Normativa:** Estás programando según la Priorización Curricular del Mineduc de Chile, Decretos 67/83 y el Diseño Universal de Aprendizaje (DUA). Las clases deben estar estructuradas en 5 pasos.
- **Exportación:** Salida PDF garantizada mediante `@react-pdf/renderer`.
- **Reglas:** Documenta las reglas extra en `.agent/rules/pedagogia.md` si es necesario.

## 3. ARQUITECTURA TÉCNICA OBLIGATORIA
- **Core:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/ui.
- **Backend/Data:** Firebase (Auth con Google/Email, Firestore para guardar perfiles y planificaciones generadas). 
- **Motor Cognitivo y RAG:** 
  - Usar EXCLUSIVAMENTE modelos `gemini-3.1-pro-preview` (Primario) y `gemini-3.1-flash` (Fallback).
  - RAG: Implementar Vector Search nativamente en Firestore para indexar y buscar Objetivos de Aprendizaje (OAs) del Mineduc.
- **Resiliencia (Manejo 429):** Capturar errores de cuota (429 Quota Exceeded) de la IA. No devolver un clásico Error 500, en cambio devolver un estado manejable para que el frontend bloquee reintentos con un contador de 60s.
- **Anti-Alucinación y Self-Healing:** 
  - Forzar respuestas en JSON.
  - Validar obligatoriamente la salida de Gemini usando `Zod` (`schema.safeParse`).
  - Si la validación falla, hacer un reintento automático pidiendo al modelo que corrija el JSON (1 vez), antes de abortar limpiamente.

## 4. RESTRICCIONES DE GENERACIÓN
 - **S1 (Corrección Intrínseca):** Si el usuario omite datos clave en el Flip Prompt, devuelve `needsMoreInfo: true` y formula preguntas clarificadoras, requiriendo el input del usuario antes de proceder.
