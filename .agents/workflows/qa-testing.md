---
name: 360hacks-qa
description: Checklist de QA integral para la app 360Hacks (Next.js + Firebase + Gemini)
---

# QA Testing — 360Hacks

## Pre-requisitos
// turbo
1. Verificar que `.env.local` tiene `GOOGLE_GENERATIVE_AI_API_KEY` configurada
// turbo
2. Ejecutar `npm run build` — debe terminar con Exit code: 0

## Checklist de Auditoría de Código

### Firestore
- Verificar que `firestore.indexes.json` declara todos los índices compuestos necesarios
- Verificar que `getTeacherPlans()` en `src/lib/firebase/firestore.ts` tiene fallback para errores de índice
- Verificar que las colecciones usan los nombres correctos (`lesson_plans`, `teachers`)

### Motor IA (flip-engine.ts)
- Verificar que `PRIMARY_MODEL` y `FALLBACK_MODEL` usan modelos existentes (no deprecados)
- Verificar que modelos `2.5+` tienen `thinkingBudget: 0` para salidas JSON
- Verificar que el fallback se ejecuta SIEMPRE que falla el modelo primario (incluyendo 429)
- Verificar que `extractJSON()` existe como fallback para texto con thinking tokens

### Prompts (prompts.ts)
- Verificar que los prompts FLIP y Generate incluyen el schema JSON explícito con nombres de campos
- Verificar que incluyen la instrucción "SIN wrappers"

### Schemas (schemas.ts)
- Verificar coherencia entre `flipResponseSchema`, `projectPlanSchema` y los prompts

### RAG (src/lib/rag/)
- Verificar que `vector-store.json` tiene embeddings para TODAS las entradas de `curriculum-data.ts`
- Si se añadieron nuevos OAs, regenerar embeddings:
```powershell
$lines = Get-Content .env.local; foreach ($l in $lines) { if ($l -match '^GOOGLE_GENERATIVE_AI_API_KEY=(.+)$') { $env:GOOGLE_GENERATIVE_AI_API_KEY = $Matches[1] } }; npx tsx src/lib/rag/build-embeddings.ts
```

## Testing E2E via Browser

### Flujo de Login
1. Navegar a `http://localhost:3000`
2. Hacer clic en "Iniciar Sesión"
3. Completar login con credenciales de prueba
4. Verificar que redirige al Dashboard

### Flujo de Planificación ABP
1. Ir a `/planificar`
2. Completar el formulario: Nivel, Asignatura, Propósito
3. Enviar → verificar que FLIP responde con preguntas o readyToGenerate
4. Si readyToGenerate, presionar "Diseñar Propuesta DUA/ABP"
5. Verificar que las 3 fases se renderizan (Preparación, Investigación, Síntesis)
6. Verificar DUA y Evaluación

### Exportar PDF
1. Desde el resultado de planificación, presionar "Descargar PDF"
2. Verificar que el PDF se descarga y contiene las 3 fases

### Historial
1. Ir a `/historial`
2. Verificar que las planificaciones guardadas aparecen
3. Verificar que el filtro de búsqueda funciona
4. Probar eliminar una planificación
5. Probar descargar PDF desde el historial

### Dashboard
1. Ir a `/dashboard`
2. Verificar que las estadísticas se muestran correctamente
3. Verificar que los planes recientes aparecen

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|---|---|---|
| `FirebaseError: index required` | Índice compuesto no existe | Clic en el link del error o `firebase deploy --only firestore:indexes` |
| `FirebaseError: index building` | Índice en construcción | Esperar 2-5 min. El fallback in-memory ordena temporalmente |
| `invalid JSON` de gemini-2.5-flash | Thinking mode filtra razonamiento | Verificar `thinkingBudget: 0` en `callModel()` |
| `mentorResponse` wrapper | Modelo inventa estructura propia | Verificar que prompts tienen schema explícito |
| 429 en ambos modelos | Cuota de API agotada en ambos | Esperar 60 seg. Considerar API key con billing |
| `dotenv` not found al correr scripts | `dotenv` no está instalado | Inyectar env var via PowerShell (ver script RAG arriba) |
