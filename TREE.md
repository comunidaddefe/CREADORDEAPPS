# Árbol Estructural y Mapeo de Archivos: CreadorDeApps (AppCraft Engine)

Este documento describe la topología física y lógica del repositorio, detallando el propósito y responsabilidad de cada componente en la arquitectura.

---

## 1. Topología del Repositorio

```
CREADORDEAPPS/
│
├── 📁 src/                                  # Código fuente de la interfaz de usuario (React 19)
│   ├── 📁 server/                           # Módulos puros desacoplados del runtime HTTP
│   │   ├── project-validation.ts            # Validador canónico de rutas y tamaño de proyectos
│   │   ├── proxy-policy.ts                  # Lista blanca de métodos y rutas proxy
│   │   └── extraction.ts                    # Extractor determinista por balanceo de caracteres
│   ├── main.tsx                             # SPA visual builder, store de estado, canvas y explorer
│   └── index.css                            # Directivas Tailwind CSS v4 y estilos globales
├── 📁 test/                                 # Suite automatizada de pruebas perimetrales
│   ├── auth.test.ts                         # Pruebas de autorización fail-closed y proxies
│   └── path-validation.test.ts              # Validación contra path traversal y nombres reservados
│
├── 📄 server.ts                             # Backend Node/Express: API Gateway, proxies y síntesis
├── 📄 electron.cjs                          # Envoltura de escritorio de Windows (Chromium container)
├── 📄 build.bat                             # Script de automatización de compilación y empaquetado
├── 📄 installer.iss                         # Script de empaquetado de instalador Inno Setup (x64)
├── 📄 CALIFICADOR_MODULOS.ps1               # Auditor estático heurístico de alta confiabilidad
├── 📄 Calificar-Proyecto.ps1                # Verificador ejecutable de entorno, tipado, pruebas y build
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

### 2.4 Capa de Compilación y Distribución (`build.bat`, `installer.iss`)
* **`build.bat`:** Validador de entorno (Node/npm), ejecución estricta de `npm run typecheck` (Evidence First), compilación de producción con Vite (`dist/`) y orquestación del compilador `ISCC.exe`.
* **`installer.iss`:** Definición declarativa de empaquetado para Inno Setup: genera un instalador de Windows nativo de 64 bits en `dist-installer/` con soporte bilingüe (español/inglés) y desinstalador limpio.

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