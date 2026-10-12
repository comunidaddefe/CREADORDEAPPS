# Implementation Plan: AppCraft AI Builder

An intuitive, SaaS-style platform for building simple web dashboards through manual drag-and-drop combined with AI-assisted structural generation.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed and will guide the build:

- **Primary Focus**: Simple Web Dashboards.
- **AI Interaction Model**: Mostly manual drag-and-drop with AI assistance for structural scaffolding.
- **Architecture**: A single-page application (SPA) featuring a workspace canvas, component sidebar, and AI-prompt integration.

### 1. Overview & Core Concept

- **What It Does**: Provides a visual canvas where users drag-and-drop dashboard widgets (e.g., charts, lists, stat cards) and use a natural language interface to generate dashboard structures or modify existing component properties.
- **Target Audience**: Business users needing quick dashboard prototypes or simple operational monitors without writing code.
- **Key Value**: Rapid prototyping of web-based data dashboards.

### 2. User Experience & Visual Design

- **Key User Flows**: 
    1.  User opens the AppCraft Builder.
    2.  User enters a prompt (e.g., "Create a sales dashboard with a revenue chart and a list of top customers") to generate initial layout.
    3.  User drags-and-drops additional components from the sidebar to refine the dashboard.
    4.  User selects a component to edit its properties (e.g., change chart colors, title).
    5.  User saves the configuration.
- **Visual Identity & Theme**:
    - *Aesthetic Direction*: Professional, high-density SaaS Dashboard (inspired by `references/3_saas_dashboard.md`).
    - *Color Palette & Mood*: Neutral slate background (`#F8FAFC`), crisp white surface cards (`#FFFFFF`), subtle hairline borders (`#E2E8F0`), and a single primary accent (e.g., a professional blue `#2563EB`).
    - *Typography*: Clean, legible sans-serif for UI (e.g., Plus Jakarta Sans) and monospace tabular-nums for data.
- **Interactive Feedback**: Smooth transitions when dragging components; immediate visual feedback on AI-generated structure updates.

### 3. Key Product Decisions & Trade-Offs

- **Builder Canvas Implementation**: 
    - *Chosen Approach*: React-based state store maintaining the dashboard JSON structure.
    - *Why*: Allows simple serialization and manipulation of the dashboard layout.
- **AI Integration**:
    - *Chosen Approach*: Backend proxy route to the Gemini API, returning the JSON layout structure.
    - *Why*: Ensures API security and centralizes LLM orchestration.
- **State Management**:
    - *Chosen Approach*: React `useState`/`useContext` within the app context.
    - *Why*: Simplest approach for a prototype/MVP without complex persistence requirements.

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                    App Header (Top Bar)                │
├─────────────┬──────────────────────────┬───────────────┤
│ Component   │      Builder Canvas      │  Properties   │
│ Sidebar     │      (Workspace)         │    Panel      │
│ (Pallet)    │                          │               │
├─────────────┴──────────────────────────┴───────────────┤
│              AI Builder Input (Footer / Modal)         │
└────────────────────────────────────────────────────────┘
```

- **Data Model**: JSON object representing an array of components with `id`, `type`, `props` (title, data_source, color), and `layout` information.
- **Interactive Component Mapping**:
    - `Sidebar`: Draggable items (`ComponentPallet`).
    - `BuilderCanvas`: Drop target, grid management.
    - `PropertiesPanel`: Form UI modifying the selected component's `props`.
    - `AIBuilderAssistant`: Input field sending prompt to `POST /api/generate-dashboard`.
- **API Endpoints**:
    - `POST /api/generate-dashboard`: Proxy to Gemini, generates initial dashboard JSON structure.
