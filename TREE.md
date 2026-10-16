# Árbol Estructural y Mapeo de Archivos: CreadorDeApps (AppCraft Engine)

Este documento describe la topología física y lógica del repositorio, detallando el propósito y responsabilidad de cada componente en la arquitectura.

---

## 1. Topología del Repositorio

```
CREADORDEAPPS/
│
├── 📁 src/                                  # Código fuente de la interfaz de usuario (React 19)
│   ├── 📁 components/                       # Componentes desacoplados de UI
│   │   └── SortableWidgetCard.tsx           # Tarjeta de widget interactiva con drag-and-drop
│   │   ├── 📁 modals/                       # Diálogos modales atómicos
│   │   │   ├── JsonSchemaModal.tsx          # Importación, exportación y validación de JSON
│   │   │   ├── SettingsModal.tsx            # Configuración de upstream SoluSol Cloud
│   │   │   └── InterviewModal.tsx           # Diálogo conversacional guiado con Santiago
│   │   ├── 📁 views/                        # Vistas y paneles del área de trabajo
│   │   │   ├── PaletteSidebar.tsx           # Barra lateral de paleta de componentes
│   │   │   ├── PropertiesPanel.tsx          # Inspector de atributos y selector de 12 cols
│   │   │   ├── ProjectWorkspace.tsx         # Visor multi-archivo y terminal command
│   │   │   └── CodeSynthesisViewer.tsx      # Visor monolítico de código exportado
│   │   └── 📁 navigation/                   # Cabeceras y barras de acción
│   │       ├── TopNavBar.tsx                # Barra principal de 3 zonas con selectores
│   │       └── ScaffoldingBar.tsx           # Barra de prompt y disparadores de scaffolding
│   ├── 📁 hooks/                            # Custom hooks desacoplados de estado
│   │   ├── useDashboardHistory.ts           # Undo/Redo, persistencia y atajos de teclado
│   │   ├── useTelemetryPolling.ts           # Bucle reactivo con retroceso adaptativo (3s-30s)
│   │   └── useCodeGeneration.ts             # Control asíncrono de llamadas de síntesis
│   ├── 📁 constants/                        # Catálogo de stacks, presets y traducciones
│   │   └── stacks.ts                        # Presets de telemetría y constantes del sistema
│   ├── 📁 types/                            # Tipado e interfaces canónicas del dominio
│   │   └── dashboard.ts                     # Esquemas TypeScript de widgets y proyectos
│   ├── 📁 server/                           # Módulos puros desacoplados del runtime HTTP
│   │   ├── 📁 controllers/                  # Controladores de endpoints y orquestación
│   │   │   ├── generation.controller.ts     # Generación de layout, código y proyectos
│   │   │   ├── interview.controller.ts      # Conversación estructurada con Santiago
│   │   │   └── telemetry.controller.ts      # Despacho de telemetría de activos y Node.js
│   │   ├── 📁 middleware/                   # Middlewares perimetrales de seguridad y red
│   │   │   ├── concurrency-guard.ts         # Control de hasta 3 tareas pesadas simultáneas
│   │   │   ├── error-handler.ts             # Captura centralizada de excepciones
│   │   │   ├── proxy-auth.ts                # Validación fail-closed de clave interna
│   │   │   ├── rate-limiter.ts              # Ventana deslizante con desalojo en memoria
│   │   │   └── trace-context.ts             # Inyección y propagación de X-Trace-Id
│   │   ├── 📁 services/                     # Clientes HTTP aislados de upstream e inferencia
│   │   │   ├── ollama.service.ts            # Cliente HTTP para LLMs locales
│   │   │   ├── santiago.service.ts          # Cliente HTTP para santiago.solusol.net
│   │   │   └── solusol.service.ts           # Cliente HTTP para api.solusol.net
│   │   ├── index.ts                         # Barril canónico de exportación lógica
│   │   ├── project-validation.ts            # Validador canónico de rutas y tamaño de proyectos
│   │   ├── proxy-policy.ts                  # Lista blanca de métodos y rutas proxy
│   │   └── extraction.ts                    # Extractor determinista por balanceo de caracteres
│   ├── main.tsx                             # SPA visual builder, store de estado, canvas y explorer
│   └── index.css                            # Directivas Tailwind CSS v4 y estilos globales
├── 📁 test/                                 # Suite automatizada de pruebas perimetrales
│   ├── auth.test.ts                         # Pruebas de autorización fail-closed y proxies
│   ├── path-validation.test.ts              # Validación contra path traversal y nombres reservados
│   ├── proxy-auth.test.ts                   # Validación de autenticación proxy fail-closed y tokens Bearer
│   └── telemetry.test.ts                    # Validación de telemetría Node.js y fallbacks declarativos
│
├── 📄 server.ts                             # Backend Node/Express: API Gateway, proxies y síntesis
├── 📄 electron.cjs                          # Envoltura de escritorio de Windows (Chromium container)
├── 📄 build.bat                             # Script de automatización de compilación y empaquetado
├── 📄 installer.iss                         # Script de empaquetado de instalador Inno Setup (x64)
├── 📄 CALIFICADOR_MODULOS.ps1               # Auditor estático heurístico de alta confiabilidad
├── 📄 Calificar-Proyecto.ps1                # Verificador ejecutable de entorno, tipado, pruebas y build
├── 📄 clean.ps1                             # Script de purga determinista de artefactos y residuos
├── 📄 git-commit-push.ps1                   # Pipeline automatizado y seguro de add, commit y push
│
├── 📚 Documentación Canónica (.md)
│   ├── PROJECT.md                           # Visión del producto, pilares y catálogo de 38 stacks
│   ├── CONTRACTS.md                         # Esquemas formales JSON (ApplicationProject, Widgets, API)
│   ├── AGENTE.md                            # Arquitectura y herramientas del agente autónomo Santiago
│   ├── UI.md                                # Sistema matricial de 12 columnas, drag-and-drop y atajos
│   ├── README.md                            # Guía de instalación, comandos y características clave
│   ├── HISTORIALDEACTIVIDADES.md            # Bitácora narrativa de hitos y política Zero Patch
│   ├── LEVELS.md                            # Escala evolutiva de autonomía (Niveles 1 a 5)
│   ├── AI DJ.md                             # Especificación técnica de streaming y radio web IA
│   ├── LOGS.md                              # Estándar de auditoría, trazabilidad y logs estructurados
│   ├── AUTONOMA.md                          # Motor de ejecución autónoma, sandbox y auto-reparación
│   ├── ENCORE.md                            # Infraestructura de microservicios type-safe y Pub/Sub
│   ├── STREAMING.md                         # Protocolos de streaming en vivo, ducking y Web Audio API
│   ├── LOG_ERROR.md                         # Catálogo de errores, códigos y guías de mitigación
│   ├── CONNECTION.md                        # Matriz de conectividad, proxies, circuit breakers y TLS
│   ├── SUPPORT.md                           # Matriz de soporte técnico, SLAs y runbooks de triage
│   └── TREE.md                              # Mapeo exhaustivo del árbol de directorios y módulos
│
├── 📦 Artefactos de Compilación (Git-Ignored)
│   ├── 📁 dist/                             # Bundle web de producción generado por Vite
│   ├── 📁 dist-server/                      # Bundle de servidor independiente (server.cjs via esbuild)
│   └── 📁 dist-installer/                   # Ejecutable setup de instalación generado por Inno Setup
│
├── ⚙️ Configuración y Runtime
│   ├── package.json                         # Manifiesto npm: scripts canónicos (start, dev, typecheck)
│   ├── package-lock.json                    # Lockfile determinista de dependencias npm
│   ├── bun.lock                             # Lockfile alternativo de Bun
│   ├── vite.config.ts                       # Configuración del empaquetador Vite y plugins React/Tailwind
│   ├── tsconfig.json                        # Reglas del compilador TypeScript (strict mode)
│   ├── .env.example                         # Plantilla de variables de entorno requeridas
│   └── .gitignore                           # Exclusiones de Git (node_modules, dist, artefactos)
```

---

## 2. Responsabilidad por Módulo

### 2.1 Capa de Aplicación y Servidor (`server.ts`)
* **Gateway REST:** Expone los endpoints `/api/generate-project` (proyectos multi-archivo) y `/api/generate-dashboard` (vistas visuales).
* **Proxy de Telemetría e Inferencia:**
  * Enrutamiento transparente a `https://api.solusol.net` vía `/api/solusol/*`.
  * Enrutamiento al agente orquestador `https://santiago.solusol.net` vía `/api/agent/*`.
  * Soporte local sin conexión contra Ollama (`http://localhost:11434`).
* **Parser Determinista (`extractBalancedJson`):** Extracción matemática por balanceo de caracteres (`{}` y `[]`) para procesar respuestas de LLM sin riesgo de fallas por expresiones regulares voraces.
* **Doble Modo:** Middleware integrado de desarrollo con Vite HMR y servicio de estáticos compilados en producción (`dist/`).

### 2.2 Capa de Interfaz de Usuario (`src/`)
* **`src/main.tsx`:**
  * **Nivel 1 (IDE de Proyecto):** Explorador de archivos (`files[]`), visor de código con resaltado y pestaña integrada para la guía de ejecución (`README.md`).
  * **Nivel 2 (Canvas Visual de 12 Columnas):** Matriz interactiva de componentes (`@dnd-kit/core` y `@dnd-kit/sortable`) con estrategia `rectSortingStrategy`.
  * **Copiloto en Modo Entrevista:** Modal conversacional que interactúa con Santiago (`/api/interview`) para refinar requisitos antes de generar la app.
  * **Telemetría en Vivo:** Polling adaptativo con retroceso exponencial (3s a 30s) y badges de estado (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`).
* **`src/index.css`:** Importación de Tailwind CSS v4 para diseño atómico y responsivo.

### 2.3 Capa de Contenedor de Escritorio (`electron.cjs`)
* Envoltura de aplicación nativa Windows con aceleración gráfica configurable, tamaño de ventana estándar (1366x860) y delegación segura de enlaces externos hacia el navegador predeterminado.

### 2.4 Capa de Compilación, Empaquetado y Automatización (`build.bat`, `installer.iss`, `clean.ps1`, `git-commit-push.ps1`)
* **`build.bat`:** Validador de entorno (Node/npm), ejecución estricta de `npm run typecheck` (Evidence First), compilación de producción con Vite (`dist/`) y orquestación del compilador `ISCC.exe`.
* **`installer.iss`:** Definición declarativa de empaquetado para Inno Setup: genera un instalador de Windows nativo de 64 bits en `dist-installer/` con soporte bilingüe (español/inglés) y desinstalador limpio.
* **`clean.ps1`:** Limpiador determinista que purga artefactos generados (`dist/`, `dist-server/`, `dist-installer/`, `coverage/`) y archivos temporales residuales.
* **`git-commit-push.ps1`:** Automatización de flujo Git seguro con verificación de working tree, detección de cambios y publicación directa a la rama activa.

---

## 3. Matriz de Flujos de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                       AppCraft UI (src/main.tsx)                       │
└───────────────┬────────────────────────┬───────────────────────────────┘
                │                        │
  POST /api/generate-project             │ POST /api/interview
  (Scaffolding multi-archivo)            │ (Copiloto de arquitectura)
                ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          server.ts (Gateway)                           │
└───────────────┬────────────────────────┬───────────────────────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌──────────────────────────────────────┐
│     santiago.solusol.net      │ │         api.solusol.net              │
│  (Agente autónomo y lógica)   │ │  (Telemetría de activos e inversores)│
└───────────────────────────────┘ └──────────────────────────────────────┘
```