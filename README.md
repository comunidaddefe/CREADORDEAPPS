# AppCraft AI Builder

> An intuitive, SaaS-style visual platform for constructing high-density web dashboards via manual drag-and-drop combined with AI-assisted structural generation and polyglot code synthesis.

---

## Key Features

* **AI Structural Scaffolding:** Prompt-driven layout generation powered by `api.solusol.net` or local LLMs via Ollama.
* **Visual Drag & Drop Canvas:** Reorderable, responsive widget layout powered by `@dnd-kit`.
* **Polyglot Code Synthesis:** Convert visual dashboards directly into production-grade native code across 25 language and framework stacks (React/Next.js, Python/Streamlit, Go, Rust/Tauri, C# WinUI, Flutter, and more).
* **Authentic Live Telemetry:** Node.js runtime process telemetry paired with demo and stream fallback modes with visual health indicators (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`).
* **Zero Boilerplate Prototyping:** Immediate visual feedback with an integrated contextual properties panel for real-time tweaking.

---

## Supported Stacks (25 Targets)

| Category | Technologies |
|---|---|
| **Web & Frontend** | TypeScript (React/Next.js), JavaScript (Vue/Svelte), Modern HTML5/CSS, PHP (Laravel), Ruby (Rails) |
| **Desktop & Native** | C# (.NET / WinUI 3 & WPF), C++ (Windows SDK / WinUI), Rust (Tauri / Slint) |
| **Backend & Enterprise** | Go (Gin / Fiber), Java (Spring Boot), Elixir (Phoenix), Scala (Play / Akka) |
| **Data Science & AI** | Python (Streamlit / FastAPI), R (Shiny), Julia (Genie) |
| **Mobile & Multiplatform** | Dart (Flutter), Swift (SwiftUI), Kotlin (Jetpack Compose) |
| **Low Level & Systems** | C, Zig |
| **Functional & Scripting** | Haskell, Erlang / OTP, Lua, Perl, Bash |

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
SOLUSOL_API_URL=https://api.solusol.net
SOLUSOL_API_KEY=your_solusol_token_optional
PORT=3000
```

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
npm run build
npm start
```

---

## Project Structure

```
CREADORDEAPPS/
├── src/
│   ├── main.tsx        # SPA visual builder, state store & canvas components
│   └── index.css       # Global styles & Tailwind CSS v4 directives
├── server.ts           # Express backend proxy for Gemini, Ollama & telemetry
├── API.md              # Complete API endpoints specification
├── ARCHITECTURE.md     # System design & component interaction details
├── package.json        # Dependencies & build scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite bundler configuration
```

## License
Apache-2.0