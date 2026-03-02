# 360Hacks — SaaS Educativo para Docentes Chilenos

Plataforma de planificación pedagógica con IA, alineada al currículum oficial del Mineduc (Decretos 67/83) con Diseño Universal para el Aprendizaje (DUA).

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# 3. Correr en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## 🧠 Arquitectura

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── flip/           # Flip Prompting endpoint
│   │   └── generate/       # Generación de planificaciones
│   ├── dashboard/          # Panel del docente
│   ├── planificar/         # Wizard de planificación
│   ├── historial/          # Historial de planificaciones
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── lib/
│   ├── ai/                 # Motor de IA
│   │   ├── flip-engine.ts  # Flip Prompting engine
│   │   ├── prompts.ts      # System prompts
│   │   └── schemas.ts      # Zod schemas
│   ├── firebase/           # Auth + Firestore
│   ├── payments/           # Flow.cl (mock)
│   └── rag/                # RAG curricular (mock)
└── docs/                   # PDFs del Mineduc (para RAG futuro)
```

## 🔑 Variables de Entorno

| Variable | Descripción |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key de Google AI (Gemini) |
| `AI_MODEL_PRIMARY` | Modelo primario: `gemini-2.5-flash` |
| `AI_MODEL_FALLBACK` | Modelo fallback: `gemini-2.0-flash` |
| `NEXT_PUBLIC_FIREBASE_*` | Configuración de Firebase |
| `FLOW_API_KEY` / `FLOW_SECRET_KEY` | Credenciales Flow.cl |

## 🎯 Flip Prompting

Motor de "preguntar antes de generar":

1. Docente ingresa input parcial
2. IA detecta campos faltantes
3. Genera preguntas clarificadoras (máx. 3)
4. Solo genera planificación con datos completos

## 📋 Estructura de Clase (5 Pasos)

1. **Inicio**: Activación de conocimientos previos
2. **Desarrollo**: Actividades diferenciadas DUA
3. **Cierre**: Síntesis y metacognición
4. **Evaluación**: Según Decreto 67
5. **Adecuaciones DUA**: Decreto 83 (representación, acción, compromiso)

## 🐳 Docker

```bash
docker build -t 360hacks .
docker run -p 3000:3000 360hacks
```

## 🧪 Tests

```bash
npm run test          # Unit tests (Jest)
npm run test:e2e      # E2E tests (Playwright)
npm run test:all      # Todos
```

## 📄 Licencia

Privado — 360Hacks © 2026
