# Resumen del Proyecto: AppCraft AI Builder

**AppCraft AI Builder** es un constructor visual SaaS de tableros de control de alta densidad diseñado para desarrolladores, operadores industriales y arquitectos de soluciones de software.

---

## 1. Visión y Propósito

Eliminar la fricción entre la conceptualización de paneles de control y su puesta en producción en código nativo. AppCraft combina:
* La velocidad del modelado visual mediante arrastrar y soltar (*drag-and-drop*).
* La asistencia generativa de modelos de lenguaje e inteligencia artificial autónoma (Santiago / SoluSol Cloud).
* La exportación instantánea a código fuente listo para producción en **25 tecnologías y lenguajes diferentes**.

---

## 2. Pilares de la Plataforma

1. **UI-First & Manipulación Directa:** El lienzo no es una simple maqueta estática; es un editor interactivo con matriz responsiva de 12 columnas, historial de operaciones (Undo / Redo) e inspección en vivo de propiedades.
2. **Telemetría Verídica:** Conexión nativa a fuentes en vivo (`api.solusol.net` y métricas del runtime Node.js), eliminando mocks engañosos mediante badges de estado explícitos (`LIVE`, `DEMO`, `NO_DATA`, `ERROR`).
3. **Poli-glotismo Nativo (25 Stacks):** Capacidad de traducir cualquier diseño visual en código idiomático real (Go, Rust, Python Streamlit, C# WinUI, Flutter, TypeScript Next.js, etc.).
4. **Política 'Zero AI Design':** Prohibición terminante de código alucinado, comentarios de relleno (`// TODO: pon código aquí`) y dependencias inexistentes en la síntesis generativa.

---

## 3. Matriz Tecnológica

* **Capa Cliente:** React 19, TypeScript, Vite, Tailwind CSS v4, `@dnd-kit/core`, `@dnd-kit/sortable`.
* **Capa Servidor:** Node.js (>=20), Express, Vite SSR Middleware integrado en modo desarrollo.
* **Capa de Agente y Datos:**
  * `santiago.solusol.net`: Agente orquestador y bucle de razonamiento.
  * `api.solusol.net`: API Gateway y telemetría de activos fotovoltaicos e industriales.
  * `Ollama` (`http://localhost:11434`): Motor de inferencia local para entornos aislados o desconectados.

---

## 4. Estructura de Directorios Clave

```
CREADORDEAPPS/
├── src/
│   ├── main.tsx          # Punto de entrada de UI, lienzo interactivo y estado
│   └── index.css         # Directivas globales y configuración Tailwind CSS v4
├── server.ts             # Servidor Express, proxies hacia SoluSol y Ollama
├── AGENTE.md             # Especificación y protocolo del Agente Santiago
├── CONTRACTS.md          # Esquemas de datos, APIs y contratos canónicos
├── UI.md                 # Arquitectura de interfaz, grid y componentes
├── PROJECT.md            # Visión general y gobernanza del proyecto
├── AI.md                 # Estrategia de prompts, pipelines de IA y Zero AI Design
├── ARCHITECTURE.md       # Diagrama de arquitectura de sistemas y flujos
└── package.json          # Dependencias y scripts de ejecución
```

---

## 5. Indicadores Clave de Éxito (KPIs)

* **Latencia de Síntesis de Layout:** < 1.5 segundos en la nube SoluSol.
* **Exactitud Estructural JSON:** 100% de cumplimiento con el esquema de widget canónico.
* **Cobertura de Tecnologías:** 25 tecnologías validadas sintácticamente.
* **Tolerancia a Desconexión:** Backoff adaptativo entre 3 s y 30 s sin bloqueos en la interfaz.