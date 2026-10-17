# CreadorDeApps (AppCraft Engine)

> Motor y entorno para la generación asistida de aplicaciones de software completas multi-archivo, asistido por un copiloto de arquitectura técnica (Santiago) y un diseñador visual de pantallas con telemetría en tiempo real.

---

## Doctrina de Reconstrucción e Ingeniería

Todo el ciclo de vida del software, refactorizaciones y generación de código se rige bajo tres directivas estrictas:

1. **ZERO TRUST:** Validación matemática de esquemas y fronteras. Salidas de LLMs, parámetros de red y proxies upstream son sanitizados y aislados. Cero exposición de secretos o stack traces internos al cliente.
2. **ZERO PATCHES:** Soluciones de causa raíz en arquitectura y contratos. Prohibición de adaptadores cosméticos, fallbacks silenciosos o bloques `try/catch` vacíos que enmascaren defectos.
3. **EVIDENCE FIRST:** Comprobación estricta de compilación (`npm run typecheck` y `npm test`), trazabilidad determinista con `traceId` y badges de telemetría sinceros (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`).

---

## Key Features

* **AI Structural Scaffolding:** Prompt-driven layout generation powered by `api.solusol.net` or local LLMs via Ollama.
* **Visual Drag & Drop Canvas:** Reorderable, responsive widget layout powered by `@dnd-kit`.
* **Polyglot Code Synthesis:** Convert visual dashboards directly into production-grade native code across 38 language and framework stacks (HTML, PHP, TSX, Go, JSON, React/Next.js, Python/Streamlit, Rust/Tauri, C# WinUI, Flutter, and more).
* **Guided Interview Mode:** Conversational architectural scoping powered by Santiago (`/api/interview`) to refine app features interactively before scaffolding.
* **Authentic Live Telemetry:** Node.js runtime process telemetry paired with demo and stream fallback modes with visual health indicators (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`).
* **Zero Boilerplate Prototyping:** Immediate visual feedback with an integrated contextual properties panel for real-time tweaking.

---

## Supported Stacks (38 Targets)

| Category | Technologies |
|---|---|
| **Base & Web Direct** | HTML (Standalone), PHP (Vanilla / Laravel), TSX (React Component), Go (Gin / Fiber / CLI), JSON (API Schema) |
| **Web & Frontend** | TypeScript (React/Next.js), JavaScript (Vue/Svelte), Modern HTML5/CSS, Vue.js (SFC), Svelte / SvelteKit, Ruby (Rails) |
| **Desktop & Native** | C# (.NET / WinUI 3 & WPF), C++ (Windows SDK / WinUI), Rust (Tauri / Slint) |
| **Backend & Enterprise** | Java (Spring Boot), Kotlin (Ktor / Spring), Scala (Play / Akka), Clojure (Ring), Elixir (Phoenix), Erlang / OTP, F# (.NET) |
| **Data Science & AI** | Python (Streamlit / FastAPI), R (Shiny), Julia (Genie), SQL (DDL / DML Queries) |
| **Mobile & Multiplatform** | Dart (Flutter), Swift (SwiftUI), Kotlin (Jetpack Compose) |
| **Low Level & Systems** | C, Zig, Nim |
| **Functional & Scripting** | Haskell, OCaml, Lua, Perl, Bash, PowerShell, YAML, Solidity |

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, `@dnd-kit/core`, `@dnd-kit/sortable`, Lucide Icons, Framer Motion.
* **Backend / API Engine:** Node.js, Express, Vite middleware integration.
* **AI Engines:** SoluSol Cloud API (`api.solusol.net`) & Ollama (Local LLM inference).

---

## Getting Started

### 1. Prerequisites

* Node.js `>= 20.0.0`
* npm or pnpm
* *(Optional)* Local Ollama instance running on port 11434 for offline generation.

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
HOST=127.0.0.1
PORT=3000
ALLOWED_ORIGIN=https://apps.solusol.net
SOLUSOL_API_URL=https://api.solusol.net
SOLUSOL_API_KEY=your_server_side_bearer_token
SANTIAGO_AGENT_URL=https://santiago.solusol.net
SANTIAGO_API_KEY=your_server_side_agent_token
```

Keep upstream tokens on the server. Do not add them to frontend code, browser storage, or the repository.

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Server

Runs Express with integrated Vite middleware:

```bash
npm run dev
```

Navigate to `http://localhost:3000` to access the visual workspace.

### 5. Build for Production

```bash
npm run build       # Bundles client into dist/
npm start
```

### 6. Public deployment domains

* The web application is published at `https://apps.solusol.net`.
* The upstream gateway is `https://api.solusol.net`; the server uses it through `SOLUSOL_API_URL`.
* Build with `npm ci` and `npm run build`, then run `npm start` with `NODE_ENV=production`, `HOST=127.0.0.1`, and `PORT=3000`.
* Configure the HTTPS reverse proxy for `apps.solusol.net` to forward requests to `http://127.0.0.1:3000`. Keep TLS termination and public DNS at the hosting provider.
* Set `ALLOWED_ORIGIN=https://apps.solusol.net`. Production CORS no longer includes development localhost origins by default.
* Configure `SOLUSOL_API_KEY` in the host's secret/environment settings. The telemetry endpoint is protected; without this token the dashboard will report an access error instead of showing fabricated live values.
* The app accepts up to 4 JPEG/PNG/WebP/MP4/WebM references, 6 MB per file and 12 MB combined. It sends them to the existing SoluSol generation endpoints in a `references` array (`name`, `mimeType`, `dataBase64`); the API must accept and process that field for multimodal generation to work.
* Verify the deployment with `GET https://apps.solusol.net/health` and confirm the upstream separately with `GET https://api.solusol.net/api/health`.

---

## Project Structure

```
CREADORDEAPPS/
├── src/
│   ├── main.tsx        # SPA visual builder, state store & canvas components
│   └── index.css       # Global styles & Tailwind CSS v4 directives
├── test/
│   ├── auth.test.ts    # Fail-closed authorization & proxy unit tests
│   ├── path-validation.test.ts # Windows reserved names & path traversal tests
│   ├── proxy-auth.test.ts # Proxy authentication & Bearer token authorization tests
│   └── telemetry.test.ts # Node.js runtime process metrics & fallback telemetry tests
├── CALIFICADOR_MODULOS.ps1 # Static heuristic module score auditor
├── Calificar-Proyecto.ps1  # Executable environment, typecheck & build validator
├── clean.ps1           # Deterministic build artifact purge script
├── git-commit-push.ps1 # Secure Git add, commit & push automation pipeline
├── electron.cjs        # Windows desktop runtime container (Electron)
├── build.bat           # Packaging and distribution pipeline script
├── installer.iss       # Inno Setup Windows installer configuration
├── server.ts           # Express backend engine, agent proxies & synthesis routes
├── AGENTE.md           # Santiago Autonomous Agent orchestration protocol
├── CONTRACTS.md        # Canonical JSON schemas for projects, widgets & APIs
├── PROJECT.md          # Product vision, architectural pillars & tech stack
├── UI.md               # Visual workspace, 12-column grid & interaction rules
├── LEVELS.md           # Escala de madurez técnica y hoja de ruta a Nivel 5
├── AI DJ.md            # Especificación técnica de streaming y radio web IA
├── LOGS.md             # Estándar de auditoría, trazabilidad y logs estructurados
├── AUTONOMA.md         # Motor de ejecución autónoma, sandbox y auto-reparación
├── ENCORE.md           # Infraestructura de microservicios type-safe y Pub/Sub
├── STREAMING.md        # Protocolos de streaming en vivo, ducking y Web Audio API
├── LOG_ERROR.md        # Catálogo de errores, códigos y guías de mitigación
├── CONNECTION.md       # Matriz de conectividad, proxies, circuit breakers y TLS
├── SUPPORT.md          # Matriz de soporte técnico, SLAs y runbooks de triage
├── TREE.md             # Mapeo exhaustivo del árbol de directorios y módulos
├── HISTORIALDEACTIVIDADES.md # Project evolution journal & milestone log
├── package.json        # Dependencies & build scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite bundler configuration
```

## License
Apache-2.0