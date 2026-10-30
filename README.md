# 💽 The Sonic Vault & Radar Echo-Safe

**The Sonic Vault** es una aplicación web de página única (SPA) de vanguardia diseñada para coleccionistas musicales, audiófilos, productores y exploradores sónicos. Integra catálogo de culto con líneas de tiempo históricas y genealogía musical (*Árbol de Ecos*), síntesis e interactividad en tiempo real (Estudio Pro "Beat It"), geolocalización de niveles sonoros ("Radar Echo-Safe"), un ecosistema completo de 5 fases con la **API de Spotify** y un sistema robusto de autenticación, seguridad y rendimiento de nivel empresarial.

---

## 🛡️ Seguridad, Autenticación y Control de Acceso

La plataforma incorpora una suite completa de seguridad moderna conforme a los estándares de desarrollo seguro:

1. **Autenticación Multi-Factor en Servidor (MFA / 2FA con Firebase Admin & OTP):**
   - **Generación criptográfica de OTP:** Códigos numéricos de 6 dígitos generados exclusivamente en el backend (`/api/2fa`) con `crypto.randomInt`.
   - **Almacenamiento seguro sin texto plano:** En Cloud Firestore (`2fa_codes/{userId}`) solo se almacena el hash HMAC-SHA256 (`codeHash`) y una firma de integridad (`sig`).
   - **Rate Limiting y ventana estricta:** Límite estricto de 5 intentos fallidos antes de bloquear la cuenta por fuerza bruta (`locked: true`, HTTP 429) y expiración automática tras 5 minutos.
   - **Pase anti-automatización:** Emisión de OTP condicionada a la presentación de un `captchaPass` válido y firmado criptográficamente por `/api/verify-captcha`.
   - **Cooldown anti-bombardeo:** Ventana obligatoria de enfriamiento de 60 segundos por usuario que previene el agotamiento abusivo de la cuota transaccional de EmailJS.
   - **Guardia anti-Rollback:** Control de versiones monotónico en Firestore y memoria que neutraliza cualquier intento de reinyectar estados previos con `attempts: 0`.
   - **Falla cerrada en producción:** Bloqueo automático de claves de respaldo estáticas si faltan secretos en entornos de producción (`HTTP 500`).
   - **Sesión verificada:** Cookie segura `HttpOnly` (`sv_2fa_session`) firmada con HMAC-SHA256 o token de sesión que desbloquea rutas protegidas (`/perfil`) y resiste intentos de suplantación.
   - **Despacho transaccional:** Envío del OTP mediante API REST de EmailJS desde el servidor, con modo de prueba en desarrollo.

2. **Google reCAPTCHA v2 con Validación en Backend y Token Firmado:**
   - Desafío *"No soy un robot"* integrado con el tema Cyberpunk oscuro de la interfaz.
   - Verificación del token del lado del servidor (`POST /api/verify-captcha`) utilizando la clave secreta oficial contra la API de Google reCAPTCHA.
   - Emisión de un pase efímero firmado (`captchaPass`) que previene el bypass de formularios y reinicio automático ante desafíos fallidos.

3. **Single Sign-On (SSO) y Protección OAuth:**
   - **Google Identity:** Autenticación fluida con cuentas de Google y verificación de ID tokens en backend con `firebase-admin`.
   - **Microsoft Entra ID / OAuth:** Autenticación empresarial y personal con cuentas Microsoft (Hotmail, Outlook, Office 365, cuentas educativas).
   - **Protección anti-CSRF en Spotify OAuth:** Generación y validación de parámetro criptográfico `state` (RFC 6749) y purga de tokens al cerrar sesión en The Sonic Vault.

4. **Reglas de Seguridad Declarativas en Firestore (`firestore.rules`):**
   - Control de acceso por colección versionado en el repositorio (`firestore.rules` y `firebase.json`).
   - Protección estricta: usuarios solo pueden leer y escribir su propio perfil; los beats tienen inmutabilidad de propietario (`userId`) y límites de nombre; reportes de ruido protegidos con validación de esquema; contadores globales de solo lectura pública y actualización atómica; colección `2fa_codes` con reglas anti-Rollback de intentos.

5. **Defensa en Profundidad y Cabeceras HTTP (`nginx.conf`):**
   - **Content-Security-Policy (CSP):** Restricción de orígenes permitidos para scripts, estilos, fuentes, conexiones de red, frames y multimedia (Spotify API/Embeds, Firebase Auth/Firestore, Google reCAPTCHA, Google Fonts, FontAwesome CDN y blobs de audio).
   - Cabeceras `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin` replicadas en estáticos (`/assets/`) con `server_tokens off;`.
   - Control de payload en microservicio API: límite estricto de 100 KB (`HTTP 413 Payload Too Large`) y rechazo de JSON malformado (`HTTP 400`).
   - Aislamiento estricto de secretos: `SPOTIFY_CLIENT_SECRET`, `RECAPTCHA_SECRET_KEY`, `EMAILJS_PRIVATE_KEY` y `SESSION_2FA_SECRET` jamás se exponen en el bundle del cliente.

---

## ⚡ Rendimiento, Escalabilidad y Arquitectura

* **Carga Diferida y Optimización de Bundle (Code Splitting):**
  - Implementación de `React.lazy` y `Suspense` para todas las rutas secundarias y módulos pesados (`BeatIt`, `EchoSafe`, `Perfil`, `Artistas`, `ArtistaDetalle`).
  - Bundle inicial reducido a menos de 400 kB para un tiempo de primera pintura (FCP) ultra-rápido.
* **Contadores Globales Atómicos en Tiempo Real:**
  - `Inicio.jsx` utiliza suscripción reactiva `onSnapshot` sobre el documento público `stats/global`.
  - Operaciones atómicas `increment(1)` e `increment(-1)` al registrarse usuarios, guardar/eliminar beats o enviar reportes de ruido, eliminando la descarga de colecciones enteras de Firestore.
* **Arquitectura Modular en Beat It Pro:**
  - Desacoplamiento total del motor de audio (`useBeatItScheduler`), persistencia en la nube (`useBeatItPersistence`), presets musicales (`beatItPresets.js`) y componentes de interfaz dedicados (`BeatItTransport`, `BeatItFXRack`, `BeatItMixer`, `BeatItGrid`).

---

## 🎹 Estudio "Beat It" Pro (Motor de Audio Web Audio API)

Estudio de producción de ritmos de alta fidelidad con arquitectura modular y sincronía estricta:

* **Motor Web Audio API Sin Jitter:** Programación anticipada (*lookahead scheduling*) en `useBeatItScheduler` para una reproducción rítmica con cero latencia y sincronización milimétrica.
* **8 Canales de Audio:** Kick, Snare, Clap, HiHat Cerrado, OpenHat, Sub 808, Tom y Crash con 5 kits analógicos y futuristas (`Analog 808`, `Cyberpunk`, `Trap Bóveda`, `Lo-Fi Chill`, `80s Funk`, con retrocompatibilidad automática para `Acoustic Studio`).
* **Síntesis Procedural de Vinilo Lo-Fi:** Generador nativo en Web Audio API de textura de vinilo (hiss cálido filtrado + micro-impulsos de aguja aleatorios) 100% autónomo y sin dependencias externas, integrado tanto en tiempo real como en la exportación offline a WAV.
* **Consola de Mezcla de Estudio (`BeatItMixer`):** Faders de ganancia individuales por canal, conmutadores de `Mute` y `Solo` independientes y control de volumen maestro.
* **Acentos de Velocidad Dinámicos (`BeatItGrid`):** Secuenciador por pasos con 3 niveles de energía (`Off` / `Normal` / `Punch con Acento`).
* **Groove & Swing Micro-temporal:** Desplazamiento rítmico configurable del 50% (Straight) al 75% (Heavy Funk/Shuffle).
* **Secuenciador de 32 Pasos (2 Compases):** Visualización y alternancia fluida entre Compás 1 y Compás 2 con duplicador de patrones en un solo clic.
* **Rack de Efectos Maestros en Vivo - Modo DJ (`BeatItFXRack`):**
  - **Filtro Bi-direccional:** Pasabajos para subgraves profundos y pasaaltos para transiciones y caídas (*drops*).
  - **Tape Drive:** Saturación analógica a cinta para calidez armónica y compresión suave.
  - **Dub Delay:** Eco estéreo con feedback resonante y sincronía de tiempo de retardo al tempo musical (1/16, 1/8, 1/8d, 1/4).
* **Conexión Directa con Bóveda de Perfil (`useBeatItPersistence`):** Hidratación automática de composiciones guardadas en Cloud Firestore al abrirlas desde `/perfil` hacia `/beat-it?beatId=...`.
* **Presets de Fábrica & Tap Tempo (`BeatItTransport`):** Carga instantánea de géneros clásicos (Trap, Boom Bap 90s, Synthwave 80s, Dembow, House, Lo-Fi) y detección de BPM al toque rítmico (*Tap Tempo*).
* **Exportador de Audio WAV 16-bit:** Renderizado offline de alta calidad en formato WAV PCM a 44.1 kHz sin compresión con opción de exportar el Master estéreo (incluyendo cadena FX y textura Lo-Fi) o los 8 canales individuales por separado.

---

## 🟢 Ecosistema Spotify API (5 Fases Completas)

Integración profunda con Spotify Web API (Flujo público seguro con proxy de backend y OAuth PKCE de usuario):

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

* **Frontend:** React 19, React Router v7, JavaScript (ES6+), Vanilla CSS (Diseño Cyberpunk / Glassmorphism responsivo)
* **Build Tool:** Vite 8
* **Base de Datos & Auth:** Firebase Authentication (Google, Microsoft, Email/Password), Cloud Firestore & Firebase Admin SDK
* **Música & Streaming:** Spotify Web API (OAuth PKCE en cliente + Client Credentials Proxy en backend)
* **Seguridad:** Google reCAPTCHA v2 (Front & Backend Node/Serverless), Content-Security-Policy (CSP)
* **Email Service:** EmailJS Transactional API (vía REST API en backend)
* **Mapas & Audio:** Leaflet, React-Leaflet, Web Audio API (Síntesis Procedural + OfflineAudioContext), Canvas API
* **Contenedorización & DevOps:** Docker, Dockerfile Multi-Stage, Docker Compose, Nginx Alpine (Reverse Proxy & CSP) + Microservicio API Node 20 Alpine

---

## 🚀 Despliegue y Ejecución

La arquitectura está diseñada con paridad para dos entornos de producción y uno de desarrollo local:

### Opción 1: Ejecución con Docker Compose (Recomendado para Producción en Servidor/VPS)

El proyecto orquesta dos contenedores aislados mediante `docker-compose.yml`:
- **`sonic-vault-web` (Nginx Alpine, puerto `3000`):** Sirve el bundle de producción compilado en multi-stage, aplica cabeceras CSP y actúa como *reverse proxy* hacia `/api/*`.
- **`sonic-vault-captcha-api` (Node 20 Alpine, puerto interno `3001`):** Microservicio backend (`server/captcha-server.js`) que procesa `POST /api/verify-captcha`, `POST /api/2fa` y `GET /api/spotify-token` manteniendo las llaves secretas fuera del cliente.

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

### Opción 2: Despliegue Serverless en Vercel

Los endpoints de backend en la carpeta `api/` (`api/verify-captcha.js`, `api/spotify-token.js`, `api/2fa.js`) funcionan de manera nativa como Serverless Functions de Node.js en Vercel sin necesidad de configuración adicional. Basta con enlazar el repositorio en Vercel y configurar las mismas variables de entorno en el panel de control.

---

### Opción 3: Ejecución Local en Desarrollo (Node.js)

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo Vite (incluye middlewares locales para `/api/spotify-token`, `/api/verify-captcha` y `/api/2fa`):
   ```bash
   npm run dev
   ```
3. Accede a **`http://localhost:5173`** (o **`http://127.0.0.1:5173`** para OAuth de Spotify).

---

## ⚙️ Variables de Entorno Requeridas

El archivo `.env` requiere las siguientes claves (ver [.env.example](.env.example)):

| Variable | Descripción | Ámbito |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Clave API de Firebase | Frontend |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase | Frontend |
| `VITE_FIREBASE_PROJECT_ID` | Identificador del proyecto Firebase | Frontend / Backend |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento de Firebase | Frontend |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de mensajería de Firebase | Frontend |
| `VITE_FIREBASE_APP_ID` | Identificador de aplicación de Firebase | Frontend |
| `VITE_RECAPTCHA_SITE_KEY` | Clave pública del sitio de Google reCAPTCHA v2 | Frontend |
| `RECAPTCHA_SECRET_KEY` | Clave secreta de Google reCAPTCHA v2 (sin prefijo `VITE_`) | Backend / Servidor |
| `VITE_SPOTIFY_CLIENT_ID` | Client ID de Spotify Developer Dashboard | Frontend / Backend |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de Spotify API (sin prefijo `VITE_`) | Backend / Proxy seguro |
| `VITE_SPOTIFY_REDIRECT_URI` | URI de redirección OAuth (ej: `http://127.0.0.1:5173/callback`) | Frontend |
| `VITE_EMAILJS_SERVICE_ID` | Service ID para el envío de tokens 2FA en EmailJS | Frontend / Backend |
| `VITE_EMAILJS_TEMPLATE_ID` | Template ID de la plantilla de correo 2FA en EmailJS | Frontend / Backend |
| `VITE_EMAILJS_PUBLIC_KEY` | Public Key de la cuenta EmailJS | Frontend / Backend |
| `EMAILJS_PRIVATE_KEY` | Private Key / Access Token de EmailJS (opcional para API REST de backend) | Backend / Servidor |
| `SESSION_2FA_SECRET` | Clave secreta HMAC para firmar tokens y cookies de sesión 2FA | Backend / Servidor |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON de cuenta de servicio de Firebase Admin (opcional para privilegios avanzados) | Backend / Servidor |

---

## 🧪 Scripts de Verificación y Calidad

* `npm run dev` — Levanta el entorno de desarrollo con HMR y middlewares locales `/api/*`.
* `npm run lint` — Ejecuta ESLint 9 sobre todo el repositorio (`0 errors`, `0 warnings`).
* `npm run build` — Genera el bundle optimizado de producción en `dist/`.
* `npm run preview` — Previsualiza localmente el build de producción.

---

## 🎓 Información Académica

* **Autor:** Samuel Pérez Valencia
* **Programa Académico:** Desarrollo de Software
* **Institución:** Universidad Católica Luis Amigó
* **Ubicación:** Medellín, Antioquia, Colombia

---

*"La tecnología y la música, codificadas en un solo lugar."*

---

## 🧪 Scripts de Verificación y Calidad

* `npm run dev` — Levanta el entorno de desarrollo con HMR y middlewares locales `/api/*`.
* `npm run lint` — Ejecuta ESLint 9 sobre todo el repositorio (`0 errors`, `0 warnings`).
* `npm run build` — Genera el bundle optimizado de producción en `dist/`.
* `npm run preview` — Previsualiza localmente el build de producción.

---

## 🎓 Información Académica

* **Autor:** Samuel Pérez Valencia
* **Programa Académico:** Desarrollo de Software
* **Institución:** Universidad Católica Luis Amigó
* **Ubicación:** Medellín, Antioquia, Colombia

---

*"La tecnología y la música, codificadas en un solo lugar."*
