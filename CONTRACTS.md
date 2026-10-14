# Contratos de Datos e Interfaces: AppCraft

Este documento define formalmente las interfaces tipadas, estructuras JSON y esquemas de validación que gobiernan la comunicación entre la interfaz de usuario, el servidor intermedio, el agente Santiago y las APIs upstream de SoluSol.

---

## 1. Esquema Canónico del Widget (`DashboardWidget`)

Todo componente colocado en el lienzo debe cumplir estrictamente con esta estructura serializable:

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

## 2. Contrato de Respuesta de Telemetría (`MetricResponse`)

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

## 3. Contratos de la API REST

### 3.1 Scaffolding de Layout (`POST /api/generate-dashboard`)

#### Payload de Entrada
```json
{
  "prompt": "string (obligatorio, no vacío)",
  "stack": "typescript", // Cualquiera de los 25 stacks soportados
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

### 3.2 Exportación de Código Nativo (`POST /api/export-code`)

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

## 4. Reglas de Validación de Entrada

1. **Límites de Grid:** `colSpan` debe ser un número entero acotado entre `1` y `12`.
2. **Fuentes de Datos:** No se admiten cadenas en blanco. Los prefijos válidos de dominio son:
   * `solusol.*`: Consultas dirigidas a la infraestructura fotovoltaica.
   * `system.*` o `runtime.*`: Telemetría directa del entorno Node.js.
   * Cualquier otro prefijo se marcará con estado `DEMO` o `NO_DATA`.
3. **Esterilización de Código LLM:** Cualquier bloque markdown que contenga ` ```json ` o ` ``` ` debe ser extraído y depurado con expresiones regulares antes de su renderizado.