# Niveles de Autonomía y Madurez: CreadorDeApps (AppCraft Engine)

Este documento define la escala evolutiva de madurez técnica y autonomía operativa del sistema, gobernada por las directivas **ZERO TRUST**, **ZERO PATCHES** y **EVIDENCE FIRST**.

---

## 1. Escala Evolutiva de Autonomía

```
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL 5: AGENTE AUTÓNOMO DE SOFTWARE INTEGRAL (OBJETIVO SUPREMO)       │
│ Compilación en sandbox, auto-reparación, hot-reload y despliegue vivo  │
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 4: PROYECTOS MULTI-ARCHIVO & ENTREVISTA ASISTIDA (ESTADO ACTUAL) │
│ Scaffolding completo, runCommand, árbol de archivos, copiloto Santiago │
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 3: SÍNTESIS POLÍGLOTA MONO-ARCHIVO                               │
│ Exportación a 38 stacks de archivos planos sin dependencias complejas  │
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 2: DASHBOARDS REACTIVOS CON TELEMETRÍA EN VIVO                   │
│ Polling adaptativo, badges LIVE/DEMO/ERROR y fuentes de api.solusol.net│
├────────────────────────────────────────────────────────────────────────┤
│ NIVEL 1: MAQUETACIÓN VISUAL DE TARJETAS Y WIREFRAMES                   │
│ Canvas drag-and-drop con datos simulados o fijos                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Definición Detallada por Nivel

### Nivel 1: Maquetador Visual de Componentes (Superado)
* **Alcance:** Grid de 12 columnas con `@dnd-kit`, paleta de widgets básicos (`stat`, `bar_chart`, `table`).
* **Limitación:** Todo el contenido es estático o mock; no hay conocimiento de procesos reales ni archivos.

### Nivel 2: Lienzo Industrial Reactivo (Superado)
* **Alcance:** Conexión con procesos Node.js (`system.*`) y telemetría fotovoltaica (`api.solusol.net`).
* **Criterio Evidence First:** Badges explícitos (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`) y backoff exponencial (3s a 30s).

### Nivel 3: Compilador Políglota de Código (Superado)
* **Alcance:** Generación de un archivo de código idiomático en cualquiera de los 38 stacks configurados.
* **Criterio Zero AI Design:** Prohibición de comentarios sintéticos (`// TODO`) y uso de sintaxis válida por lenguaje.

### Nivel 4: Scaffolding de Proyectos Multi-Archivo & Entrevista (Estado Consolidado)
* **Alcance:**
  * Endpoint `POST /api/generate-project` que entrega `appName`, `description`, `runCommand`, `files[]` y `readme`.
  * Copiloto en modo diálogo (`POST /api/interview`) con preguntas técnicas estructuradas y opciones con un clic.
  * IDE ligero en frontend con explorador de archivos, visor de código y exportación de manifiesto.

---

## 3. Hoja de Ruta hacia el NIVEL 5: Autonomía Operativa Plena

El **Nivel 5** representa la capacidad del motor y del Agente Santiago (`santiago.solusol.net`) de cerrar el bucle completo de desarrollo de software **sin intervención manual**:

### Pilares Obligatorios de Nivel 5:

1. **Sandbox de Ejecución en Aislamiento (Execution Runtime):**
   * El sistema no solo escribe el código: levanta un contenedor efímero o worker local para ejecutar `runCommand`.
   * Soporte de verificación de compilación (`cargo build`, `dotnet build`, `go build`, `tsc --noEmit`).

2. **Bucle de Auto-Diagnóstico y Reparación (Self-Healing Loop):**
   * Si la compilación o ejecución en el sandbox arroja error (código de salida != 0 o trazas de excepción en `stderr`), Santiago captura la salida de error, analiza el stacktrace y genera automáticamente el diff de corrección sin intervención humana.
   * Criterio Zero Patches: La corrección ataca el error semántico de tipos o dependencias, no silencia el error con `try/catch` vacíos.

3. **Empaquetado y Distribución Automatizada:**
   * Generación física de archivos binarios o comprimidos `.zip` descargables directamente en el cliente.
   * Despliegue en 1-clic a contenedores remotos o subdominios activos en la infraestructura de SoluSol.

4. **Zero Trust en la Verificación:**
   * Toda app generada debe superar una prueba sintáctica y de arranque antes de ser marcada como `VERIFIED_BUILD`.

---

## 4. Matriz de Criterios de Aceptación para Nivel 5

| Dimensión | Requisito de Nivel 4 (Actual) | Requisito de Nivel 5 (Objetivo) |
|---|---|---|
| **Generación** | Árbol de archivos en memoria JSON | Árbol de archivos instanciado y verificado |
| **Compilación** | Comando `runCommand` provisto como texto | Ejecución real en sandbox con captura de stdout/stderr |
| **Manejo de Errores** | El usuario copia el código y prueba en su PC | Santiago intercepta el fallo de build y se auto-corrige |
| **Distribución** | Copia de archivo por archivo o manifiesto | Descarga de ZIP o URL de preview en vivo |