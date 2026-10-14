# Contratos de Datos e Interfaces: CreadorDeApps (AppCraft Engine)

Este documento define formalmente los esquemas canónicos que gobiernan la generación de aplicaciones completas, proyectos multi-archivo, vistas de interfaz y telemetría interactiva.

---

## 0. Política de Gobernanza de Contratos
* **Zero Trust:** Todo payload entrante y saliente se parsea y valida estructuralmente. Los valores fuera de rango son rechazados con códigos HTTP semánticos (400, 502, 503).
* **Zero Patches:** Las interfaces son canónicas e invariantes. No se introducen campos temporales ni adaptadores ad-hoc para enmascarar discrepancias entre capas.
* **Evidence First:** Los tipos declarados en este documento deben ser idénticos a los tipos en TypeScript en `server.ts` y `src/main.tsx`, validados mediante `npm run typecheck`.

---

## 1. Esquema Canónico de Proyecto de Aplicación (`ApplicationProject`)

Representa una aplicación de software funcional, ejecutable y compilable en cualquiera de los stacks soportados:

```typescript
export interface ProjectFile {
  path: string;       // Ruta relativa: "src/Program.cs", "package.json", "main.py"
  content: string;    // Código fuente completo y ejecutable (Zero AI Design)
}

export interface ApplicationProject {
  appName: string;       // Identificador único o slug del proyecto
  description: string;   // Resumen técnico de la solución
  stack: string;         // Identificador del lenguaje o framework objetivo
  runCommand: string;    // Comando exacto para terminal ("dotnet run", "python main.py")
  files: ProjectFile[];  // Conjunto de archivos necesarios para compilar y ejecutar
  readme: string;        // Guía de puesta en marcha paso a paso
}
```

### Ejemplo JSON de Proyecto Válido
```json
{
  "appName": "MailWatcherDesktop",
  "description": "Widget de escritorio en C# WinUI para monitoreo local de bandejas de entrada",
  "stack": "csharp",
  "runCommand": "dotnet run",
  "files": [
    {
      "path": "MailWatcher.csproj",
      "content": "<Project Sdk=\"Microsoft.NET.Sdk\">...</Project>"
    },
    {
      "path": "Program.cs",
      "content": "using System;\nnamespace MailWatcher { ... }"
    }
  ],
  "readme": "1. Ejecutar 'dotnet restore'\n2. Compilar con 'dotnet run'"
}
```

---

## 2. Esquema Canónico de Widgets y Vistas de UI (`DashboardWidget`)

Unidad modular de interfaz utilizada dentro del diseñador visual responsivo de 12 columnas:

```typescript
export type ComponentType = 'stat' | 'bar_chart' | 'line_chart' | 'table' | 'list';

export interface WidgetGridPosition {
  colSpan: number; // Entero de 1 a 12
  rowSpan?: number;
}

export interface WidgetProps {
  title: string;
  data_source: string;
  value?: string; // Requerido o recomendado para widgets tipo 'stat'
}

export interface DashboardWidget {
  id: string; // Formato UUID o slug único alfanumérico
  type: ComponentType;
  gridPosition?: WidgetGridPosition;
  props: WidgetProps;
}
```

### Ejemplo JSON Válido
```json
{
  "id": "sol_power_card",
  "type": "stat",
  "gridPosition": {
    "colSpan": 4
  },
  "props": {
    "title": "Potencia Activa (kW)",
    "data_source": "solusol.telemetry.power",
    "value": "142.8 kW"
  }
}
```

---

## 3. Contrato de Telemetría en Vivo (`MetricResponse`)

Devuelto por el endpoint `GET /api/data?source={source}&type={type}` y por `https://api.solusol.net/telemetry`:

```typescript
export interface MetricResponse {
  origin: string; // Ej: 'solusol.cloud', 'system.node_runtime', 'demo.mock_provider'
  status: 'LIVE' | 'DEMO' | 'NO_DATA' | 'ERROR';
  unit: string;   // Ej: 'kW', 'MB', 'seconds', 'ratio_index'
  value?: string;
  series?: Array<{ label: string; value: number }>; // Para 'bar_chart'
  points?: number[];                               // Para 'line_chart' (0-100 escalado)
  rows?: Array<{ key: string; value: string }>;     // Para 'table'
  items?: Array<{ id: string; text: string; status: string }>; // Para 'list'
  updatedAt: string; // ISO 8601 Timestamp
  description?: string;
}
```

---

## 4. Endpoints y Contratos de Servicio

### 4.1 Scaffolding de Layout (`POST /api/generate-dashboard`)

#### Payload de Entrada
```json
{
  "prompt": "string (obligatorio, no vacío)",
  "stack": "typescript", // Cualquiera de los 38 stacks soportados
  "provider": "solusol" | "ollama",
  "model": "llama3.2" // Opcional, utilizado si provider === 'ollama'
}
```

#### Respuesta Exitosa (`200 OK`)
```json
[
  {
    "id": "uuid-1",
    "type": "stat",
    "gridPosition": { "colSpan": 4 },
    "props": { "title": "...", "data_source": "..." }
  }
]
```

---

### 4.2 Exportación de Código Nativo (`POST /api/export-code`)

#### Payload de Entrada
```json
{
  "layout": [ /* Array de DashboardWidget */ ],
  "stack": "csharp",
  "provider": "solusol" | "ollama",
  "model": "llama3.2"
}
```

#### Respuesta Exitosa (`200 OK`)
```json
{
  "code": "// Código compilable sin comentarios sintéticos ni placeholders",
  "stack": "csharp",
  "provider": "solusol"
}
```

---

### 4.3 Generación de Proyecto Multi-Archivo (`POST /api/generate-project`)

#### Payload de Entrada
```json
{
  "prompt": "string (obligatorio, no vacío)",
  "stack": "csharp",
  "provider": "solusol" | "ollama",
  "model": "llama3.2"
}
```

#### Respuesta Exitosa (`200 OK`)
```json
{
  "appName": "MailWatcherDesktop",
  "description": "Widget de escritorio en C# WinUI para monitoreo local de bandejas de entrada",
  "stack": "csharp",
  "runCommand": "dotnet run",
  "files": [
    { "path": "Program.cs", "content": "..." }
  ],
  "readme": "Guía de compilación y ejecución paso a paso"
}
```

---

### 4.4 Entrevista Arquitectónica Guiada (`POST /api/interview`)

Permite acotar y definir requisitos de la app mediante diálogo asistido antes de generar el código o layout final.

#### Payload de Entrada
```json
{
  "message": "Quiero una pagina web de una radio por internet",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "stack": "html",
  "provider": "solusol",
  "model": "llama3.2"
}
```

#### Respuesta Exitosa (`200 OK`)
```json
{
  "reply": "¡Me encanta la idea de la radio por internet! Definamos estos 3 detalles clave:",
  "questions": [
    "¿Cómo transmitirás el audio?",
    "¿Qué módulos necesita la interfaz?",
    "¿Qué estilo visual prefieres?"
  ],
  "options": [
    {
      "question": "Fuente de Audio",
      "choices": [
        "Icecast / Shoutcast (Stream en Vivo)",
        "Audio HLS / Stream M3U8",
        "Lista de Reproducción MP3"
      ]
    }
  ],
  "isReadyToBuild": false,
  "refinedPrompt": "Sitio web de radio por internet en html con reproductor continuo..."
}
```

---

## 5. Reglas de Validación de Entrada

1. **Límites de Grid:** `colSpan` debe ser un número entero acotado entre `1` y `12`.
2. **Fuentes de Datos:** No se admiten cadenas en blanco. Los prefijos válidos de dominio son:
   * `solusol.*`: Consultas dirigidas a la infraestructura fotovoltaica.
   * `system.*` o `runtime.*`: Telemetría directa del entorno Node.js.
   * Cualquier otro prefijo se marcará con estado `DEMO` o `NO_DATA`.
3. **Extracción y Validación de JSON:** Las respuestas de LLM se procesan mediante el extractor determinista por balanceo de caracteres (`extractBalancedJson`), validando la integridad del árbol JSON antes de su entrega.