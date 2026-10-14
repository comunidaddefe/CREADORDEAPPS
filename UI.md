# Arquitectura de Interfaz de Usuario y Guía de Componentes: CreadorDeApps (AppCraft Engine)

Este documento describe la jerarquía visual, los modos operativos (Proyecto Multi-Archivo vs. Canvas Visual), los componentes interactivos y las reglas de experiencia de usuario del frontend.

---

## 0. Principios de UI (Zero Trust, Zero Patches, Evidence First)

1. **Zero Trust en Estados Visuales:** La interfaz nunca asume que una fuente está sana. Los estados de conexión son explícitos (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`) y no se inventan métricas ni valores sin declarar.
2. **Zero Patches en Vistas:** Las vistas de la aplicación corresponden exactamente a los contratos canónicos: `ApplicationProject` se visualiza en un IDE de archivos y comandos; `DashboardWidget` se manipula en el canvas matricial.
3. **Evidence First en Feedback:** Cada acción del usuario (generación, compilación, copia de código, entrevista) ofrece respuesta visual determinista con trazabilidad de errores sin alertas invasivas.

---

## 1. Distribución Espacial de la Interfaz

La interfaz se organiza en una cabecera de control global, barra de scaffolding y espacio de trabajo adaptable según el modo activo:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Marca | Controles (Engine, Stack, Presets, Undo/Redo, Lang) | Acciones │
├──────────────────────────────────────────────────────────────────────────────┤
│ BARRA DE SCAFFOLDING: Prompt en Lenguaje Natural + Botón Generar            │
├────────────────┬────────────────────────────────────────────┬────────────────┤
│                │                                            │                │
│ PALETA DE      │ CANVAS PRINCIPAL (Grid de 12 Columnas)     │ PANEL DE       │
│ COMPONENTES    │        ó VISOR DE CÓDIGO FUENTE            │ PROPIEDADES    │
│                │                                            │                │
│ • Stat         │ [Card: 4 cols]  [Card: 8 cols]             │ Modificación   │
│ • Bar Chart    │                                            │ en vivo de     │
│ • Line Chart   │ [Table: 12 cols]                           │ widget activo  │
│ • Table        │                                            │                │
│ • List Feed    │                                            │                │
│                │                                            │                │
└────────────────┴────────────────────────────────────────────┴────────────────┘
```

---

## 2. Sistema de Cuadrícula Matricial de 12 Columnas

Cada widget en el lienzo utiliza clases calculadas de Tailwind CSS para definir su amplitud en pantallas medianas y grandes (`md:col-span-*`):

| Selector Rápido | `colSpan` | Proporción en Pantalla | Caso de Uso Típico |
|---|---|---|---|
| **1/4** | 3 columnas | 25% del ancho | Indicadores clave (KPIs, Stat cards) |
| **1/3** | 4 columnas | 33% del ancho | Métricas secundarias o medidores |
| **1/2** | 6 columnas | 50% del ancho | Gráficos comparativos y feeds de eventos |
| **2/3** | 8 columnas | 66% del ancho | Gráficos de tendencias detallados |
| **Full** | 12 columnas | 100% del ancho | Tablas de datos y telemetría de activos |

---

## 3. Comportamiento de Arrastrar y Soltar (`@dnd-kit`)

* **Sensores Activos:**
  * `PointerSensor` configurado con restricción de activación de `distance: 5px` para evitar arrastres accidentales al hacer clic en botones internos.
  * `KeyboardSensor` con coordenadas ordenables para máxima accesibilidad y soporte de teclado.
* **Manejador de Arrastre (`Drag Handle`):**
  * Cada tarjeta expone un asa visual con el glifo `⠿` (`aria-label="Drag Handle"`).
  * El evento de clic sobre el asa detiene la propagación para evitar deseleccionar la tarjeta.

---

## 4. Estados Visuales de Telemetría (Badges de Estado)

Cada tarjeta de componente refleja con precisión el estado devuelto por el polling:

* `LIVE (origin)`: Texto verde esmeralda (`text-emerald-600 font-mono font-medium`). Datos reales en vivo.
* `FETCHING`: Texto ámbar (`text-amber-500 font-mono`). Petición en vuelo o sincronización pendiente.
* `DEMO MODE`: Etiqueta ámbar con borde (`bg-amber-50 text-amber-700 border-amber-200`). Fuente desconectada, datos demostrativos declarados.
* `NO_DATA`: Etiqueta neutra gris (`bg-slate-100 text-slate-500`). Flujo sin registros o tabla vacía.
* `UNREACHABLE` / `ERROR`: Etiqueta roja (`bg-red-50 text-red-700 border-red-200`). Fallo de conexión con el upstream.

---

## 5. Atajos de Teclado y Productividad

| Atajo | Acción | Ámbito |
|---|---|---|
| `Ctrl + Z` / `Cmd + Z` | Deshacer (Undo) último cambio de layout | Global |
| `Ctrl + Y` / `Cmd + Shift + Z` | Rehacer (Redo) cambio descartado | Global |
| `Enter` (en campo prompt) | Disparar generación asistida de estructura | Barra de scaffolding |

---

## 6. Modos Especiales de Visualización

1. **Modo Kiosco / Previsualización (`Preview`):**
   * Oculta la barra de scaffolding, la paleta de componentes izquierda y el panel de propiedades derecho.
   * Maximiza el canvas para su visualización en pantallas de supervisión o salas de control.
2. **Modo Exportación / Código Fuente (`Target Code`):**
   * Cambia el lienzo por un visor oscuro con sintaxis formateada.
   * Incluye botón de copiado al portapapeles con confirmación visual interactiva.