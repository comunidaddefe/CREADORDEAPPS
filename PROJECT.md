# Resumen del Proyecto: CreadorDeApps (AppCraft Engine)

**CreadorDeApps** es un entorno y motor generativo de aplicaciones de software completas, diseñado para traducir intenciones en lenguaje natural y entrevistas guiadas en **proyectos de código fuente ejecutables**, complementado con un diseñador visual de pantallas y telemetría industrial.

---

## 1. Visión y Propósito

Eliminar la barrera entre la idea conceptual de un software y su estructura ejecutable en disco. El sistema opera en dos niveles coordinados:
* **Nivel 1 (Generador de Proyectos Multi-Archivo):** Scaffolding completo de código fuente nativo, dependencias, scripts de arranque y arquitectura de backend/desktop.
* **Nivel 2 (Diseñador Visual de Vistas y Widgets):** Modelado interactivo de componentes de alta densidad, cuadrículas de 12 columnas e inspección de telemetría viva.
* **Copiloto en Modo Entrevista (Santiago):** Acotamiento interactivo de requisitos mediante diálogo asistido antes de generar la solución.

---

## 2. Doctrina de Ingeniería y Reconstrucción

Todo desarrollo y refactorización en el repositorio se rige por tres directivas inviolables:
1. **ZERO TRUST:** Ningún componente confía ciegamente en otro. Las respuestas de LLMs, parámetros de red y datos de upstream se validan contra esquemas estrictos antes de su procesamiento.
2. **ZERO PATCHES:** Prohibición absoluta de soluciones provisionales, parches cosméticos, `// TODO` o fallbacks silenciosos que oculten fallos. Todo cambio resuelve la causa raíz.
3. **EVIDENCE FIRST:** Cada afirmación sobre compatibilidad de stacks, rendimiento o estado de integración debe estar respaldada por código ejecutable, pruebas verificables y `typecheck` limpio.

---

## 3. Pilares de la Plataforma

1. **Proyectos Ejecutables Primero:** El resultado principal no es una tarjeta visual huérfana, sino un árbol de archivos con manifiestos de compilación y comandos de ejecución.
2. **Agnosticismo de Infraestructura:** Compatible tanto con agentes locales vía Ollama como con orquestación en la nube (Santiago / SoluSol).
3. **Poli-glotismo Estricto (38 Stacks):** Soporte de estándares idiomáticos en tecnologías web, backend, mobile y desktop.
4. **Política 'Zero AI Design':** Prohibición terminante de comentarios falsos (`// TODO: implement logic`), mocks engañosos y assets rotos.

---

## 4. Matriz Tecnológica

* **Capa Cliente:** React 19, TypeScript, Vite, Tailwind CSS v4, `@dnd-kit/core`, `@dnd-kit/sortable`.
* **Capa Servidor:** Node.js (>=20), Express, Vite SSR Middleware integrado en modo desarrollo.
* **Capa de Agente y Datos:**
  * `santiago.solusol.net`: Agente orquestador y bucle de razonamiento.
  * `api.solusol.net`: API Gateway y telemetría de activos fotovoltaicos e industriales.
  * `Ollama` (`http://localhost:11434`): Motor de inferencia local para entornos aislados o desconectados.

---

## 5. Estructura de Directorios Clave

```
CREADORDEAPPS/
├── src/
│   ├── main.tsx          # Punto de entrada de UI, lienzo interactivo y estado
│   └── index.css         # Directivas globales y configuración Tailwind CSS v4
├── test/
│   ├── auth.test.ts      # Pruebas unitarias de autorización fail-closed y proxies
│   └── path-validation.test.ts # Validación exhaustiva contra path traversal y nombres reservados
├── electron.cjs          # Contenedor de escritorio Windows (Electron runtime)
├── build.bat             # Pipeline de compilación y empaquetado nativo
├── installer.iss         # Definición de instalador Windows con Inno Setup
├── server.ts             # Servidor Express, proxies hacia SoluSol y Ollama
├── CALIFICADOR_MODULOS.ps1 # Auditor numérico y forense NASA/MIL-STD Zero Tolerance
├── AGENTE.md             # Especificación y protocolo del Agente Santiago
├── CONTRACTS.md          # Esquemas de datos, APIs y contratos canónicos
├── UI.md                 # Arquitectura de interfaz, grid y componentes
├── PROJECT.md            # Visión general y gobernanza del proyecto
├── LEVELS.md             # Escala de madurez técnica y hoja de ruta a Nivel 5
├── AI DJ.md              # Especificación técnica de streaming y radio web IA
├── LOGS.md               # Estándar de auditoría, trazabilidad y logs estructurados
├── AUTONOMA.md           # Motor de ejecución autónoma, sandbox y auto-reparación
├── ENCORE.md             # Infraestructura de microservicios type-safe y Pub/Sub
├── STREAMING.md          # Protocolos de streaming en vivo, ducking y Web Audio API
├── LOG_ERROR.md          # Catálogo de errores, códigos y guías de mitigación
├── CONNECTION.md         # Matriz de conectividad, proxies, circuit breakers y TLS
├── SUPPORT.md            # Matriz de soporte técnico, SLAs y runbooks de triage
├── TREE.md               # Mapeo exhaustivo del árbol de directorios y módulos
├── HISTORIALDEACTIVIDADES.md # Bitácora de evolución técnica del proyecto
└── package.json          # Dependencias y scripts de ejecución
```

---

## 6. Indicadores Clave de Éxito (KPIs)

* **Latencia de Síntesis de Layout:** < 1.5 segundos en la nube SoluSol.
* **Exactitud Estructural JSON:** 100% de cumplimiento con el esquema de widget canónico.
* **Cobertura de Tecnologías:** 38 tecnologías y formatos validados sintácticamente.
* **Tolerancia a Desconexión:** Backoff adaptativo entre 3 s y 30 s sin bloqueos en la interfaz.