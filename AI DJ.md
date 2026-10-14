# Especificación Técnica: AI DJ & Plataforma de Radio Web Streaming

Este documento define la arquitectura, protocolos de audio, contratos de datos y módulos de interfaz para la generación de aplicaciones de radio por internet con locución, curaduría musical e interacción asistida por IA.

---

## 1. Topología del Sistema de Radio

```
┌────────────────────────────────────────────────────────┐
│                 Frontend Web Radio                     │
│  • Reproductor Sticky Persistente (Web Audio API)      │
│  • Visualizador de Espectro FFT (Canvas en Vivo)       │
│  • Chat de Oyentes & Solicitudes (WebSockets / SSE)    │
└───────────────┬────────────────────────▲───────────────┘
                │                        │
     Stream URL │ HTTP 200 Audio         │ Metadata / WebSocket
                ▼                        │
┌───────────────────────────────┐ ┌──────┴───────────────────────────────┐
│     Servidor de Streaming     │ │       Santiago AI DJ Engine          │
│  (Icecast2 / Shoutcast / HLS) │ │  (santiago.solusol.net / Voice Host) │
│  • Mountpoint: /live.mp3      │ │  • Síntesis de Voz (TTS) de Locución │
│  • Protocolo ICY Metadata     │ │  • Selección Musical & Crossfade     │
└───────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 2. Especificaciones de Audio y Streaming

### 2.1 Protocolos de Transmisión Soportados
* **Icecast / Shoutcast (Direct MP3 / AAC Stream):** Flujo de baja latencia vía HTTP chunked streaming con soporte de cabeceras `Icy-MetaData: 1`.
* **HLS (HTTP Live Streaming):** Lista de reproducción segmentada (`playlist.m3u8`) para alta resiliencia en conexiones móviles.
* **Web Audio API Local:** Fallback en cliente mediante buffer circular de pistas de audio para modo demostración o sin conexión.

### 2.2 Pipeline del AI DJ (Santiago Radio Engine)
1. **Curaduría Musical:** Selección de pistas basadas en franja horaria (Mañana dinámica, Tarde chill, Noche electrónica).
2. **Generación de Intervenciones:** Creación de cápsulas de locución de 15 a 30 segundos (clima, hora local, presentación de la siguiente pista, lectura de mensajes del chat).
3. **Ducking & Crossfade:** Reducción automática de volumen de la música (ducking a -12dB) durante las intervenciones de voz del AI DJ.

---

## 3. Esquemas de Datos y Contratos de Radio

### 3.1 Metadata en Vivo (`GET /api/radio/now-playing`)
```json
{
  "station": "SoluSol Radio Web",
  "status": "ONLINE",
  "streamUrl": "https://santiago.solusol.net/radio/live.mp3",
  "listeners": 142,
  "currentTrack": {
    "title": "Solar Groove",
    "artist": "Santiago Synth Ensemble",
    "album": "Clean Energy Beats",
    "duration": 215,
    "elapsed": 78,
    "coverArt": "https://santiago.solusol.net/covers/solar-groove.jpg"
  },
  "nextTrack": {
    "title": "Midnight Inverter",
    "artist": "Photovoltaic Wave"
  },
  "djStatus": {
    "isSpeaking": false,
    "nextInterventionIn": 137
  }
}
```

### 3.2 Envío de Peticiones y Chat (`POST /api/radio/request`)
```json
{
  "listenerName": "Carlos M.",
  "message": "Un saludo para el equipo en la planta solar de Atacama",
  "requestedTrack": "Solar Groove"
}
```

---

## 4. Componentes UI Especializados para Radio

1. **Persistent Sticky Player:**
   * Posicionado en el pie de página (`fixed bottom-0`).
   * Control de Play/Pause, volumen con ganancia lineal, barra de buffering y estado del stream.
   * Persiste la reproducción sin cortes al navegar entre páginas.
2. **Analizador de Frecuencia (Audio Visualizer):**
   * Conexión a `AudioContext.createAnalyser()` con transformada rápida de Fourier (`fftSize = 128` o `256`).
   * Renderizado en `<canvas>` con barras de neón o gráfico de onda sinusoidal reactiva.
3. **Parrilla de Programación:**
   * Tabla horaria interactiva con indicación visual del programa en emisión activa.
4. **Muro de Mensajes de Oyentes:**
   * Feed en tiempo real con moderación automática donde el AI DJ puede seleccionar mensajes para leerlos al aire.

---

## 5. Directivas Zero Trust y Evidence First en Audio

* **Zero Trust en el Stream:** Todo reproductor debe implementar reconexión automática con retroceso exponencial si el socket Icecast se interrumpe, sin bloquear el hilo principal de la UI.
* **Buffer de Contingencia:** Si el stream remoto cae, el reproductor debe activar una pista local ambiental de reserva sin reproducir estática ni emitir ruidos de buffer vacío.