# Especificación del Agente Autónomo: Santiago Bridge & Engine

Este documento define la arquitectura, protocolos de interacción y contratos operativos del agente autónomo **Santiago**, alojado en `https://santiago.solusol.net` y conectado de forma nativa a `https://api.solusol.net`.

---

## 1. Topología del Agente

```
┌────────────────────────────────────────────────────────┐
│                 AppCraft Builder UI                    │
│         (React 19 + Vite / Express Proxy :3000)        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼  POST /api/agent/*
┌────────────────────────────────────────────────────────┐
│                santiago.solusol.net                    │
│             (Santiago Agent Orchestrator)              │
│  • Bucle Autónomo de Herramientas (Tool Loop)          │
│  • Memoria Contextual de Sesión y Workspace            │
│  • Validador de Reglas 'Zero AI Design'                │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼ Telemetría                 ▼ Inferencia
┌───────────────────────────┐  ┌─────────────────────────┐
│      api.solusol.net      │  │ LLM Engine Host         │
│  (Sensores, Inversores,   │  │ (Privado / OpenAI /     │
│   Parques Solares)        │  │  Anthropic / Ollama)    │
└───────────────────────────┘  └─────────────────────────┘
```

---

## 2. Principios de Diseño

1. **Desacoplamiento Financiero y de Cómputo:**
   * El cliente final y la interfaz de usuario no ejecutan bucles costosos ni queman tokens externos de manera impredecible.
   * Santiago gestiona internamente la cantidad de pasos de razonamiento (*reasoning steps*) y herramientas necesarias antes de devolver una respuesta terminada a AppCraft.
2. **Consciencia de Dominio Solar e Industrial:**
   * Santiago conoce de antemano el catálogo de dispositivos de `api.solusol.net` (inversores de potencia, trackers solares, cadenas de módulos fotovoltaicos, medidores de subestación).
   * Al sintetizar layouts o código, selecciona automáticamente las fuentes de datos exactas (`solusol.telemetry.power`, `solusol.generation.daily`, `solusol.inverters.status`) sin inventar nombres ni generar endpoints rotos.
3. **Gobernanza 'Zero AI Design':**
   * Santiago valida que ningún componente generado contenga comentarios artificiales (`// TODO`), números fijos inventados sin contexto ni componentes visuales sin contenedor de contingencia.

---

## 3. Capacidades y Herramientas (Tool Calling)

Santiago dispone del siguiente inventario de herramientas para ejecutar de forma autónoma:

| Herramienta | Parámetros | Objetivo |
|---|---|---|
| `get_telemetry_schema` | `{ prefix?: string }` | Inspecciona los tipos de métricas y dispositivos activos en `api.solusol.net`. |
| `validate_widget_layout` | `{ widgets: Widget[] }` | Comprueba que las columnas sumen múltiplos de 12 y cumplan con el esquema canónico. |
| `synthesize_code` | `{ layout, stack }` | Genera código nativo en cualquiera de los 38 stacks soportados bajo directivas idiomáticas. |
| `architectural_interview` | `{ message, history, stack }` | Guía al usuario con preguntas y opciones interactivas para definir requisitos antes de construir. |
| `check_sensor_health` | `{ device_id: string }` | Verifica si una fuente reporta en vivo o debe inicializarse en modo fallback. |

---

## 4. Contratos de Comunicación

### 4.1 Generación Asistida por Agente (`POST /v1/agent/scaffold`)
Recibe la intención del usuario y devuelve el esquema de widgets resuelto tras inspeccionar la disponibilidad en `api.solusol.net`.

```json
// Request
{
  "prompt": "Genera monitoreo de inversores con anomalías térmicas y gráfico de potencia",
  "stack": "typescript",
  "currentLayout": []
}

// Response (200 OK)
{
  "reasoningSteps": 3,
  "toolsUsed": ["get_telemetry_schema", "validate_widget_layout"],
  "layout": [
    {
      "id": "stat_power",
      "type": "stat",
      "gridPosition": { "colSpan": 4 },
      "props": {
        "title": "Potencia Activa Global",
        "data_source": "solusol.telemetry.power",
        "value": "142.8 kW"
      }
    },
    {
      "id": "table_inverters",
      "type": "table",
      "gridPosition": { "colSpan": 8 },
      "props": {
        "title": "Alertas Térmicas de Inversores",
        "data_source": "solusol.inverters.status"
      }
    }
  ]
}
```

---

### 4.2 Entrevista Arquitectónica (`POST /api/interview`)
Permite a Santiago preguntar interactivamente al usuario antes de ejecutar la síntesis:

```json
// Request
{
  "message": "Quiero una pagina web de una radio por internet",
  "stack": "html",
  "history": []
}

// Response (200 OK)
{
  "reply": "Entendido. Para afinar la arquitectura de la radio, define estos puntos:",
  "questions": [
    "¿Qué protocolo de audio usarás?",
    "¿Qué módulos visuales necesitas?"
  ],
  "options": [
    {
      "question": "Protocolo",
      "choices": ["Icecast / Shoutcast", "Audio HLS / M3U8", "Playlist Local"]
    }
  ],
  "isReadyToBuild": false,
  "refinedPrompt": "Sitio web de radio por internet en html con streaming continuo..."
}
```

---

## 5. Parámetros de Configuración (`.env`)

```env
SANTIAGO_AGENT_URL=https://santiago.solusol.net
SANTIAGO_API_KEY=stg_sec_xxxxxxxxxxxx
SOLUSOL_API_URL=https://api.solusol.net
SOLUSOL_API_KEY=solusol_sec_xxxxxxxxxxxx
```