# 💽 The Sonic Vault & Radar Echo-Safe

**The Sonic Vault** es una plataforma web progresiva de vanguardia diseñada para coleccionistas musicales, audiófilos, productores y exploradores sónicos. Integra catálogo de culto, desensamblado de pistas (*stems*), síntesis e interactividad en tiempo real (Estudio Pro "Beat It"), geolocalización de niveles sonoros ("Radar Echo-Safe"), un ecosistema completo de 5 fases con la **API de Spotify** y un sistema robusto de autenticación y seguridad de nivel empresarial.

---

## 🛡️ Seguridad, Autenticación y Control de Acceso

La plataforma incorpora una suite completa de seguridad moderna conforme a los estándares de desarrollo seguro:

1. **Autenticación Multi-Factor (MFA / 2FA con Token):**
   - Generación de código de verificación numérico de 6 dígitos de un solo uso.
   - Envío automático y seguro a la bandeja de correo del usuario mediante servicio transaccional.
   - Ventana de expiración estricta de 5 minutos, sincronizada y auditada en Firestore.
   - Bloqueo de rutas protegidas (`/perfil`) hasta la verificación exitosa del token.

2. **Google reCAPTCHA v2 con Validación en Backend:**
   - Desafío *"No soy un robot"* integrado con el tema Cyberpunk oscuro de la interfaz.
   - Verificación del token del lado del servidor (`/api/verify-captcha`) utilizando la clave secreta oficial contra la API de Google reCAPTCHA.
   - Prevención de ataques de fuerza bruta y reinicio automático de desafíos ante intentos fallidos.

3. **Single Sign-On (SSO):**
   - **Google Identity:** Autenticación fluida con cuentas de Google.
   - **Microsoft Entra ID / OAuth:** Autenticación empresarial y personal con cuentas Microsoft (Hotmail, Outlook, Office 365, cuentas educativas).

---

## 🎹 Estudio "Beat It" Pro (Motor de Audio Web Audio API)

Estudio de producción de ritmos de alta fidelidad con arquitectura de 7 fases y sincronía estricta:

* **Motor Web Audio API Sin Jitter:** Programación anticipada (*lookahead scheduling*) para una reproducción rítmica con cero latencia y sincronización milimétrica.
* **8 Canales de Audio:** Kick, Snare, Clap, HiHat Cerrado, OpenHat, Sub 808, Tom y Crash con kits analógicos y futuristas (`Analog 808`, `Cyberpunk`, `Trap Bóveda`, `Lo-Fi Chill`, `Acoustic Studio`).
* **Consola de Mezcla de Estudio:** Faders de ganancia individuales por canal, conmutadores de `Mute` y `Solo` independientes y control de volumen maestro.
* **Acentos de Velocidad Dinámicos:** Secuenciador por pasos con 3 niveles de energía (`Off` / `Normal` / `Punch con Acento`).
* **Groove & Swing Micro-temporal:** Desplazamiento rítmico configurable del 50% (Straight) al 75% (Heavy Funk/Shuffle).
* **Secuenciador de 32 Pasos (2 Compases):** Visualización y alternancia fluida entre Compás 1 y Compás 2 con duplicador de patrones en un solo clic.
* **Rack de Efectos Maestros en Vivo (Modo DJ):**
  - **Filtro Bi-direccional:** Pasabajos para subgraves profundos y pasaaltos para transiciones y caídas (*drops*).
  - **Tape Drive:** Saturación analógica a cinta para calidez armónica y compresión suave.
  - **Dub Delay:** Eco estéreo con feedback resonante y sincronía de tiempo de retardo al tempo musical (1/16, 1/8, 1/8d, 1/4).
* **Presets de Fábrica & Tap Tempo:** Carga instantánea de géneros clásicos (Trap, Boom Bap 90s, Synthwave 80s, Dembow, House, Lo-Fi) y detección de BPM al toque rítmico (*Tap Tempo*).
* **Exportador de Audio WAV 16-bit:** Renderizado offline de alta calidad en formato WAV PCM a 44.1 kHz sin compresión con opción de exportar el Master estéreo o los 8 Stems por separado.

---

## 🟢 Ecosistema Spotify API (5 Fases Completas)

Integración profunda con Spotify Web API (Flujo público seguro y OAuth PKCE de usuario):

1. **Fase 1: Radar de Nuevos Lanzamientos Mundiales (`Inicio.jsx`)**
   - Carrusel en tiempo real con los últimos álbumes y sencillos del catálogo global.
   - Filtros dinámicos por categorías (Todo, Álbumes, Singles/EPs) y reproductor Spotify Embed interactivo.
   - Consulta paginada con protección contra límites estrictos de Spotify Developer Mode.

2. **Fase 2: Protocolo de Recuperación Auditiva & Descompresión (`EchoSafe.jsx`)**
   - Módulo de Sound Healing activado cuando el nivel de ruido ambiental supera los límites recomendados por la OMS ($\ge 76$ dB).
   - 4 canales de terapia sonora: Ruido Marrón (Brown Noise), Frecuencia Curativa 432 Hz, Lluvia y Drones Ambientales.
   - Temporizador guiado (5, 10 y 15 min) con pulsos de respiración y recomendaciones ergonómicas.

3. **Fase 3: Mini-Player "Now Playing" Persistente (`Navbar.jsx`)**
   - Widget flotante global montado en la barra de navegación superior.
   - Vinilo neón giratorio sincronizado a la reproducción en vivo del usuario en cualquier dispositivo.
   - Barra de progreso en tiempo real de 1 segundo con controles remotos de transporte (Play, Pause, Next, Previous para usuarios Spotify Premium).

4. **Fase 4: Pasaporte Holográfico 3D & Spotify Wrapped Permanente (`Perfil.jsx`)**
   - **Motor de Arquetipos Sonoros:** Clasificador algorítmico que analiza géneros y artistas top para asignar una de 8 identidades sónicas (Guardián del Synthwave, Alquimista del Hip-Hop, Centinela del Rock, Chamán Urbano, Viajero Cósmico, etc.).
   - **Tarjeta Holográfica con Inclinación 3D:** Giroscopio por cursor de mouse, lámina tornasol iridiscente, chip biométrico simulado y espectro de frecuencias.
   - **Exportador a PNG en Alta Definición:** Renderizado nativo en Canvas HTML5 (1200 × 680 px) para descarga inmediata sin dependencias pesadas.
   - **Cápsula del Tiempo:** Selector de 3 épocas (Último mes, 6 meses e Histórico) con medidor de estabilidad de gustos y detección de *Pilares Inmutables* vs *Nuevas Obsesiones*.

5. **Fase 5: Radar BPM & Generador de Playlists Beat It (`BeatIt.jsx`)**
   - Radar rítmico circular animado en tiempo real con frecuencia sincronizada al BPM del secuenciador.
   - Detección de compatibilidad de tempo y armónicos rítmicos (Half-time y Double-time).
   - Búsqueda de pistas de referencia de estudio calibradas según el Kit de batería y tempo.
   - **Generador de Playlists:** Creación y población automática de playlists en la cuenta real de Spotify del usuario (`POST /v1/users/{id}/playlists` y `/tracks`) con un solo clic.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19, JavaScript (ES6+), Vanilla CSS (Diseño Cyberpunk / Glassmorphism)
* **Build Tool:** Vite
* **Base de Datos & Auth:** Firebase Authentication (Google, Microsoft, Email/Password) & Cloud Firestore
* **Música & Streaming:** Spotify Web API (OAuth PKCE + Client Credentials)
* **Seguridad:** Google reCAPTCHA v2 (Front & Serverless Backend)
* **Email Service:** EmailJS Transactional API
* **Mapas & Audio:** Leaflet, React-Leaflet, Web Audio API, Canvas API
* **Contenedorización & DevOps:** Docker, Dockerfile Multi-Stage, Docker Compose, Nginx Alpine

---

## 🚀 Despliegue y Ejecución

### Opción 1: Ejecución con Docker Compose (Recomendado)

El proyecto incluye configuración de contenedorización lista para producción con build multi-stage y servidor Nginx:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/SamuPV05/The-Sonic-Vault.git
   cd The-Sonic-Vault
   ```
2. Configura las variables de entorno:
   ```bash
   # En Windows PowerShell:
   Copy-Item .env.example .env

   # En Linux / macOS:
   cp .env.example .env
   ```
   *(Rellena las credenciales correspondientes en tu archivo `.env`)*.

3. Construye y levanta los servicios:
   ```bash
   docker compose up --build
   ```
4. Abre tu navegador en **`http://localhost:3000`**.

---

### Opción 2: Ejecución Local en Desarrollo (Node.js)

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
3. Accede a **`http://localhost:5173`**.

---

## ⚙️ Variables de Entorno Requeridas

El archivo `.env` requiere las siguientes claves (ver [.env.example](.env.example)):

| Variable | Descripción | Ámbito |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Clave API de Firebase | Frontend |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase | Frontend |
| `VITE_FIREBASE_PROJECT_ID` | Identificador del proyecto Firebase | Frontend |
| `VITE_FIREBASE_STORAGE_BUCKET`| Bucket de almacenamiento de Firebase | Frontend |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Sender ID de mensajería | Frontend |
| `VITE_FIREBASE_APP_ID` | Identificador de aplicación de Firebase | Frontend |
| `VITE_RECAPTCHA_SITE_KEY` | Clave pública del sitio de Google reCAPTCHA v2 | Frontend |
| `RECAPTCHA_SECRET_KEY` | Clave secreta de Google reCAPTCHA v2 | Backend / Servidor |
| `VITE_SPOTIFY_CLIENT_ID` | Client ID de Spotify Developer Dashboard | Frontend |
| `VITE_SPOTIFY_CLIENT_SECRET` | Client Secret de Spotify API | Backend / Proxy seguro |
| `VITE_SPOTIFY_REDIRECT_URI` | URI de redirección OAuth (ej: `http://127.0.0.1:5173/callback`) | Frontend |

---

## 🎓 Información Académica

* **Autor:** Samuel Pérez Valencia
* **Programa Académico:** Desarrollo de Software
* **Institución:** Universidad Católica Luis Amigó
* **Ubicación:** Medellín, Antioquia, Colombia

---

*"La tecnología y la música, codificadas en un solo lugar."*
