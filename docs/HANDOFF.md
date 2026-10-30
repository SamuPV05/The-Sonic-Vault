# Bitácora de traspaso entre agentes

Lee este archivo **antes** de empezar cualquier tarea y actualízalo **al terminar**. Las tareas están en [PLAN_MAESTRO.md](./PLAN_MAESTRO.md). Las entradas más recientes van arriba.

## Plantilla de entrada

```
### [fecha hora] T__ — título — agente (Flash | Argon)
- Rama:
- Estado: completada | parcial | bloqueada
- Archivos tocados:
- Qué se hizo:
- Decisiones tomadas:
- Variables de entorno nuevas:
- Verificación: lint ✅/❌ · build ✅/❌ · pasos manuales:
- Riesgos / pendientes:
- Siguiente paso sugerido (y para qué modelo):
```

---

### [2026-10-30 13:10] T21 — Consolidación y versionado de activos de identidad visual y logos — Flash
- Rama: `fix/T21-branding-assets-consolidation`
- Estado: completada
- Archivos tocados: `public/sonic-vault-logo.png`, `public/icon.svg`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/sonic-vault-icon.svg`, `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `index.html`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se consolidaron y versionaron formalmente en el repositorio los nuevos activos de identidad visual de The Sonic Vault: (1) Inclusión de la insignia de marca oficial `public/sonic-vault-logo.png` con renderizado optimizado en `Navbar.jsx` y `Footer.jsx` con efecto neón glassmorphism; (2) Configuración en `index.html` del favicon principal (`/sonic-vault-logo.png`), favicon alternativo vectorial (`/sonic-vault-icon.svg`) y etiqueta OpenGraph `og:image`; (3) Actualización de los iconos PWA (`pwa-192x192.png` y `pwa-512x512.png`) y vectores SVG (`icon.svg` y `sonic-vault-icon.svg`).
- Decisiones tomadas: Mantener `flexShrink: 0`, `borderRadius: 8px` y `objectFit: contain` en los logos del Navbar y Footer para garantizar responsividad impecable en dispositivos móviles y de escritorio.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Inspección visual del Navbar, Footer y favicon en el navegador.
- Riesgos / pendientes: Ninguno. Todo el Plan Maestro (Fases A a F, T01 a T21) está 100% completado.
- Siguiente paso sugerido: El repositorio se encuentra en estado óptimo, libre de vulnerabilidades y completamente listo para fusionar `fix/stabilization` en `main` y sincronizar con el remoto.

### [2026-10-30 13:08] T20 — Herencia de cabeceras en nginx.conf y control de payload en Docker API — Flash
- Rama: `fix/T20-nginx-and-server-hardening`
- Estado: completada
- Archivos tocados: `nginx.conf`, `server/captcha-server.js`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: (1) Se añadió `server_tokens off;` en `nginx.conf` para evitar revelar la versión exacta de Nginx en cabeceras de respuesta, y se replicaron explícitamente `X-Content-Type-Options "nosniff"` y `Referrer-Policy "strict-origin-when-cross-origin"` dentro del bloque `location /assets/` (ya que en Nginx la presencia de `add_header` en un bloque location descarta la herencia del bloque server padre). (2) En `server/captcha-server.js`, se robusteció `leerBodyJson` para abortar limpiamente peticiones con cuerpos mayores a 100 KB devolviendo `HTTP 413 Payload Too Large` con mensaje JSON estructurado, y devolviendo `HTTP 400 Bad Request` ante cuerpos JSON malformados en lugar de colgar el socket o disparar excepciones no controladas `500`.
- Decisiones tomadas: Mantener el límite de payload en 100 KB (`1e5` bytes), suficiente para tokens de Captcha y 2FA sin permitir abuso de memoria.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Comprobar respuesta de `/api/2fa` y `/api/verify-captcha` con payloads válidos e inválidos.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T21 (Consolidación y versionado de activos de identidad visual, iconos y logos) con Flash.

### [2026-10-30 13:05] T19 — Protección anti-CSRF en Spotify OAuth con parámetro state — Flash
- Rama: `fix/T19-spotify-oauth-csrf`
- Estado: completada
- Archivos tocados: `src/services/spotifyService.js`, `src/pages/SpotifyCallback.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se blindó el flujo de autorización OAuth 2.0 PKCE de Spotify contra ataques de Login CSRF: (1) `loginWithSpotify()` ahora genera una cadena criptográficamente aleatoria de 32 caracteres para el parámetro `state`, la persiste temporalmente en el cliente (`tsv_spotify_oauth_state`) y la incluye en la URL de autorización; (2) `handleSpotifyCallback(code, state)` valida que el `state` devuelto coincida exactamente con el guardado, purgando inmediatamente la clave para evitar reusos; (3) se verifica la existencia obligatoria del verificador PKCE (`codeVerifier`) antes de solicitar el canje del token a Spotify, impidiendo peticiones vacías o manipuladas; (4) `logoutSpotify()` limpia cualquier estado residual del flujo OAuth.
- Decisiones tomadas: Guardar el `state` con fallback redundante en `localStorage` y `sessionStorage` para soportar navegadores con restricciones de almacenamiento entre redirecciones de ventana.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Probar conexión con Spotify verificando la inclusión del parámetro `state` en la URL y la correcta redirección a `/perfil?spotify=connected`.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T20 (Herencia de cabeceras de seguridad en `nginx.conf` y control de payload 413 en `server/captcha-server.js`) con Flash.

### [2026-10-30 13:00] T18 — Purga de tokens Spotify al cerrar sesión y validación estricta de avatares — Flash
- Rama: `fix/T18-session-cleanup-avatar-validation`
- Estado: completada
- Archivos tocados: `src/context/AuthContext.jsx`, `src/pages/Perfil.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: (1) Se conectó la purga automática de tokens de Spotify (`logoutSpotify()` desde `src/services/spotifyService.js`) en todos los flujos de terminación de sesión de `AuthContext.jsx` (`logout()`, `cancelarRegistroPendiente()` y en `onAuthStateChanged` cuando `!currentUser`), evitando fugas de tokens PKCE y controles de reproducción en navegadores o computadores compartidos. (2) Se blindó la actualización de la foto de perfil en `Perfil.jsx` (`handleGuardarFoto`): ahora solo se admiten URIs `data:image/svg+xml` si coinciden exactamente con la lista blanca de los 6 avatares predefinidos (`AVATARES_PREDEFINIDOS`), y para URLs externas se exige obligatoriamente protocolo seguro `https://` con longitud máxima de 512 caracteres sin caracteres de inyección (`[\s<>"'`]`), bloqueando cualquier payload malicioso de SVG o JavaScript.
- Decisiones tomadas: Mantener la experiencia de avatares predefinidos intacta y validar la URL antes de llamar a `updateUserPhoto`, mostrando un mensaje claro al usuario si el enlace no cumple los criterios de seguridad.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Probar cambio de avatar en `/perfil` con avatares predefinidos y URL https://, y cerrar sesión verificando la limpieza de claves `tsv_spotify_*` en localStorage.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T19 (Protección anti-CSRF en Spotify OAuth con parámetro `state` en `src/services/spotifyService.js` y `src/pages/SpotifyCallback.jsx`) con Flash.

### [2026-10-30 12:53] T17 — Blindaje contra Rollback de intentos en 2fa_codes e inmutabilidad de propietario en beats — Argon
- Rama: `fix/T17-rules-rollback-guard`
- Estado: completada
- Archivos tocados: `firestore.rules`, `api/2fa.js`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se reforzaron las reglas de seguridad de Firestore (`firestore.rules`) en dos colecciones críticas: (1) en `beats/{beatId}`, la regla `allow update` ahora exige inmutabilidad del propietario (`request.resource.data.userId == resource.data.userId`) y valida el tamaño del nombre (`1..120` caracteres), impidiendo transferir cintas a la bóveda de otro usuario; (2) en `2fa_codes/{userId}`, se separaron `create` (exigiendo `attempts == 0`) y `update` (exigiendo que para un mismo `codeHash` el contador `attempts` solo pueda incrementarse exactamente en `+1`, o que al rotar `codeHash` se reinicie `attempts == 0` con `updatedAt` monotónico). Además, en `api/2fa.js` se añadió el mapa en memoria `maxIntentosPorHash` que detecta y bloquea con `HTTP 429` (`locked: true, rollbackDetected: true`) cualquier intento de reinyección o reversión de un snapshot anterior en Firestore (incluso mediante `delete` + `create`).
- Decisiones tomadas: Al consumirse un código 2FA válido (`coincide === true`), `maxIntentosPorHash` marca inmediatamente ese `uid:codeHash` con `MAX_ATTEMPTS + 1` para inutilizar cualquier intento posterior de reinyectar el documento consumido.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · batería de 10 escenarios (T12 + T16 + T17) ✅.
- Riesgos / pendientes: Ninguno. Recuerda desplegar o pegar la versión final de `firestore.rules` en la consola de Firebase.
- Siguiente paso sugerido (y para qué modelo): T18 (Purga de tokens Spotify al cerrar sesión y validación estricta de avatares SVG/URL en `src/context/AuthContext.jsx` y `src/pages/Perfil.jsx`) con Flash.

### [2026-10-30 08:17] T16 — Falla cerrada de secretos en producción y cooldown anti-bombardeo en /api/2fa — Argon
- Rama: `fix/T16-2fa-secrets-cooldown`
- Estado: completada
- Archivos tocados: `api/2fa.js`, `api/verify-captcha.js`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se eliminó en `api/2fa.js` y `api/verify-captcha.js` cualquier fallback a claves estáticas de desarrollo (`sv-dev-2fa-hmac-secret-key-2026` y `TEST_SECRET`) cuando `NODE_ENV === 'production'` o `VERCEL_ENV === 'production'`, haciendo que el servidor falle cerrado (`HTTP 500` / rechazo de firma) si no existen secretos reales configurados. Además, se implementó en `/api/2fa` (`action === 'send'`) un enfriamiento (cooldown) obligatorio de 60 segundos por usuario (respaldado tanto en `updatedAt` de Firestore como en `ultimoEnvio2FA` en memoria del servidor) que bloquea con `HTTP 429` (`cooldown: true, retryAfterSeconds`) cualquier intento de bombardeo de correos o agotamiento de la cuota mensual de EmailJS.
- Decisiones tomadas: Al fallar un intento de verificación (`action === 'verify'`), se preserva el `updatedAt` original de emisión del código para que los intentos fallidos no reinicien artificialmente el reloj de enfriamiento de 60s para el usuario legítimo.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · batería de 9 escenarios (T12 + T16) ✅.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T17 (Blindaje contra Rollback de intentos en `2fa_codes` e inmutabilidad de propietario en `beats` en `firestore.rules` y `api/2fa.js`) con Argon.

### [2026-10-30 06:58] T15 — Actualizar README con el estado real del proyecto — Flash
- Rama: `fix/T15-actualizar-readme`
- Estado: completada
- Archivos tocados: `README.md`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se actualizó de manera exhaustiva el archivo `README.md` para reflejar la arquitectura y capacidades reales alcanzadas tras la ejecución completa del Plan Maestro de estabilización (T01 a T15). Se documentó la suite de autenticación multi-factor en servidor (`/api/2fa` con `firebase-admin`, códigos de un solo uso en Firestore hasheados con HMAC-SHA256, rate limiting a 5 intentos, pase firmado de reCAPTCHA y cookie `HttpOnly` firmada), la validación de Google reCAPTCHA v2 con token firmado, las reglas declarativas de Firestore versionadas (`firestore.rules` y `firebase.json`), la política Content-Security-Policy (CSP) en `nginx.conf`, la optimización de bundle con code splitting (`React.lazy` + `Suspense` < 400 kB inicial), los contadores atómicos globales en tiempo real con `stats/global`, la división modular de Beat It Pro (`useBeatItScheduler`, `useBeatItPersistence`, `beatItPresets.js`, `BeatItTransport`, `BeatItFXRack`, `BeatItMixer`, `BeatItGrid`), el despliegue dual paritario (Vercel Serverless y Docker Compose multi-stage) y la tabla completa de variables de entorno requeridas y opcionales.
- Decisiones tomadas: Se cerraron formalmente todas las decisiones abiertas en `docs/PLAN_MAESTRO.md` tras haber culminado exitosamente las Fases A, B, C, D y E.
- Variables de entorno nuevas: Documentadas en la tabla del README (`EMAILJS_PRIVATE_KEY`, `SESSION_2FA_SECRET`, `FIREBASE_SERVICE_ACCOUNT_KEY`).
- Verificación: lint ✅ · build ✅ · pasos manuales: Inspección visual del renderizado de `README.md`.
- Riesgos / pendientes: Ninguno. Plan Maestro 100% completado.
- Siguiente paso sugerido: El proyecto queda completamente estabilizado en `fix/stabilization`. Se puede proceder a fusionar `fix/stabilization` en la rama principal (`main`) o continuar con nuevas funcionalidades según lo decida el usuario.

### [2026-10-30 06:52] T14 — Documentar riesgo de tokens Spotify en localStorage y añadir CSP en nginx.conf — Argon
- Rama: `fix/T14-csp-spotify-docs`
- Estado: completada
- Archivos tocados: `src/services/spotifyService.js`, `nginx.conf`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se documentó formalmente en `src/services/spotifyService.js` el modelo de seguridad del flujo OAuth 2.0 con PKCE de Spotify (por qué el usuario almacena `tsv_spotify_user_token` y `tsv_spotify_refresh_token` en `localStorage` mientras que el flujo Client Credentials delega el secreto a `/api/spotify-token`, cuál es el riesgo ante XSS y qué mitigaciones se aplican). Además, se añadieron en `nginx.conf` las cabeceras de seguridad `Content-Security-Policy`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin` permitiendo únicamente los orígenes legítimos de la aplicación (Spotify API/Accounts/Embeds/CDN, Firebase Auth/Firestore, Google reCAPTCHA, Google Fonts, FontAwesome CDN y blobs de Web Audio API).
- Decisiones tomadas: Incluir en la CSP de `nginx.conf` soporte explícito para `blob:` en `media-src` y `worker-src` (necesarios para la exportación WAV de `BeatIt`) y los dominios de OAuth/reCAPTCHA (`apis.google.com`, `*.firebaseapp.com`, `accounts.google.com`, `login.microsoftonline.com`) para no interrumpir ningún flujo de inicio de sesión ni de reproducción.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Levantar contenedor web con `docker compose up --build` y verificar en DevTools → Network la presencia del header `Content-Security-Policy` sin bloqueos en consola.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T15 (Actualizar `README.md` con el estado real del proyecto) con Flash o Argon.

### [2026-10-30 06:40] T13b — Extraer BeatItTransport, BeatItFXRack, BeatItMixer y BeatItGrid — Flash
- Rama: `fix/T13b-beatit-components`
- Estado: completada
- Archivos tocados: `src/components/beatit/BeatItTransport.jsx`, `src/components/beatit/BeatItFXRack.jsx`, `src/components/beatit/BeatItMixer.jsx`, `src/components/beatit/BeatItGrid.jsx`, `src/pages/BeatIt.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se extrajeron los 4 subcomponentes visuales de `BeatIt.jsx` a la carpeta `src/components/beatit/`: `BeatItTransport` (visualizador reactivo, controles principales de BPM, Swing, Master Volume, selector de kit, presets y botones de modo), `BeatItFXRack` (filtro DJ bidireccional, tape drive y dub delay sincronizado), `BeatItMixer` (channel strip de audición, mute, solo y fader por pista) y `BeatItGrid` (barra de compases 16/32 pasos, duplicador y matriz de acentos de 8 pistas). `BeatIt.jsx` se redujo de ~1,100 líneas a menos de 460 líneas, actuando como orquestador limpio.
- Decisiones tomadas: Se mantuvieron exactamente los mismos estilos en línea y comportamientos interactivos para garantizar cero regresiones visuales o de audio.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Navegar a `/beat-it`, probar reproducción, audición de instrumentos, solos, mutes, selector de kit, cambio de tempo, rack FX y exportación WAV.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T14 (Tokens de Spotify en `localStorage`: documentar riesgo y añadir CSP en `nginx.conf`) con Argon o T15 con Flash.

### [2026-10-30 06:35] T13a — Diseño modular de BeatIt.jsx y extracción de hooks useBeatItScheduler y useBeatItPersistence — Argon
- Rama: `fix/T13a-beatit-hooks`
- Estado: completada
- Archivos tocados: `src/constants/beatItPresets.js`, `src/hooks/useBeatItScheduler.js`, `src/hooks/useBeatItPersistence.js`, `src/pages/BeatIt.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se extrajeron las constantes/presets a `src/constants/beatItPresets.js`, la gestión del motor Web Audio API (`BeatItScheduler`, estados de mezcla, Rack FX, Tap Tempo y exportación WAV) a `src/hooks/useBeatItScheduler.js`, y la persistencia en Firestore (`beats`, incremento en `stats/global` e hidratación desde `/perfil` o `?beatId=`) a `src/hooks/useBeatItPersistence.js`. `BeatIt.jsx` pasó de 1,710 a ~1,100 líneas y quedaron delimitados los contratos de props para los 4 subcomponentes visuales de T13b (`BeatItTransport`, `BeatItFXRack`, `BeatItMixer`, `BeatItGrid`).
- Decisiones tomadas: `useBeatItScheduler` expone `applyPresetToScheduler` y `applyLoadedBeatToScheduler` para que `useBeatItPersistence` coordine la carga de beats sin acoplar Firestore con Web Audio API.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Abrir `/beat-it`, probar Play/Stop, cambio de Kit, presets, Rack FX, exportación WAV y guardado/carga de beat.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T13b (Extraer `BeatItTransport`, `BeatItFXRack`, `BeatItMixer` y `BeatItGrid` en `src/components/beatit/`) con Flash o Argon.

### [2026-10-29 23:05] T12 — Verificación y pruebas de flujos 2FA y autenticación — Argon
- Rama: `fix/T12-pruebas-2fa`
- Estado: completada
- Archivos tocados: `api/2fa.js`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se parametrizó `procesarPeticion2FA` en `api/2fa.js` (`verifyTokenFn`, `nowFn`, `skipRest`) para permitir pruebas deterministas de reloj y autenticación, y se ejecutó la batería completa de pruebas de extremo a extremo cubriendo los 8 escenarios de T12: bloqueo de envío sin Captcha, emisión de OTP tras Captcha, 5 códigos incorrectos seguidos con bloqueo `HTTP 429` (`locked: true`), reenvío de código (`resend: true`), rechazo de código expirado (> 5 min), verificación exitosa con cookie `HttpOnly` firmada y consumo de OTP de un solo uso, inicio de sesión OAuth (Google y Microsoft) con rechazo de suplantación (`403`), y cancelación de registro pendiente / cierre de sesión (`Max-Age=0`).
- Decisiones tomadas: Mantener la inyección opcional de `verifyTokenFn` y `nowFn` en `procesarPeticion2FA` con valores por defecto de producción (`verificarIdTokenFirebase` y `Date.now`) para no alterar el comportamiento en producción y facilitar auditorías futuras.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · batería de 8 escenarios T12 ✅ · pasos manuales en navegador: `npm run dev` → `/login` para confirmar visualmente la interfaz en vivo con tu cuenta real.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): Fase E — T13a (Diseño de la división de `BeatIt.jsx`: límites de módulos y hooks `useBeatItScheduler` y `useBeatItPersistence`) con Argon.

### [2026-10-29 22:58] T11 — Mover 2FA y Captcha al servidor con firebase-admin y cookie firmada — Argon
- Rama: `fix/T11-2fa-servidor`
- Estado: completada
- Archivos tocados: `api/2fa.js`, `api/verify-captcha.js`, `server/captcha-server.js`, `Dockerfile.api`, `docker-compose.yml`, `vite.config.js`, `src/context/AuthContext.jsx`, `src/pages/Login.jsx`, `firestore.rules`, `.env.example`, `package.json`, `package-lock.json`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se creó el endpoint `/api/2fa` (`api/2fa.js`) compartido entre Vercel, Docker (`server/captcha-server.js`) y Vite (`vite.config.js`). Verifica los ID tokens de Firebase con `firebase-admin`, genera códigos OTP de 6 dígitos con `crypto.randomInt`, almacena únicamente el hash HMAC-SHA256 (`codeHash`) y una firma de integridad (`sig`) en `2fa_codes/{uid}` con máximo 5 intentos, exige un pase firmado de Captcha (`captchaPass` emitido por `/api/verify-captcha`) antes de emitir el OTP, envía el correo desde el servidor vía API REST de EmailJS y gestiona la sesión verificada mediante una cookie firmada `HttpOnly` (`sv_2fa_session`). En `Dockerfile.api` se añadió `ENV NODE_ENV=production` y la instalación de dependencias de producción (`npm ci --omit=dev`).
- Decisiones tomadas: `firebase-admin` verifica los ID tokens usando `VITE_FIREBASE_PROJECT_ID` sin exigir cuenta de servicio, y si se configura `FIREBASE_SERVICE_ACCOUNT_KEY` utiliza además `admin.firestore()` y `setCustomUserClaims`. Si en EmailJS aún no está activada la opción "Allow EmailJS API for non-browser applications", en desarrollo hace fallback al modo prueba en consola/pantalla para no bloquear las pruebas locales.
- Variables de entorno nuevas: Opcionales en `.env.example`: `EMAILJS_PRIVATE_KEY`, `SESSION_2FA_SECRET`, `FIREBASE_SERVICE_ACCOUNT_KEY`.
- Verificación: lint ✅ · build ✅ · pruebas unitarias de criptografía/flujo `/api/2fa` ✅ · pasos manuales: Ejecutar T12 (registro, login con correo, Google, Microsoft, 5 códigos incorrectos, código expirado, reenviar, cancelar registro pendiente).
- Riesgos / pendientes: Para el envío en producción con EmailJS desde el backend, asegurarse de activar la casilla "Allow EmailJS API for non-browser applications" (y opcionalmente copiar `EMAILJS_PRIVATE_KEY`) en EmailJS Dashboard -> Account -> Security.
- Siguiente paso sugerido (y para qué modelo): T12 (Pruebas manuales completas del flujo 2FA y autenticación) con Flash o Argon.

### [2026-10-29 22:48] T10 — Versionar firestore.rules y firebase.json — Argon
- Rama: `fix/T10-firestore-rules`
- Estado: completada
- Archivos tocados: `firestore.rules`, `firebase.json`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se crearon desde cero y versionaron `firestore.rules` y `firebase.json` cubriendo las 6 colecciones/documentos del proyecto: `stats/global` (lectura pública, creación y actualización autenticada restringida a deltas de `+1`/`-1` sobre `users`, `beats` y `echo_reports`), `users/{userId}` (lectura/escritura/borrado exclusivo del propietario), `beats/{beatId}` (`get` público para compartir enlaces `?beat=ID`, `list` y escritura restringidos al autor), `echo_reports/{reportId}` (lectura pública, creación autenticada validando rangos de `lat`, `lng` y `db`, inmutable tras crearse), `artistas/{artistaId}` (lectura pública, escritura cerrada) y `2fa_codes/{userId}` (acceso del propietario hasta que T11 lo migre a `firebase-admin`).
- Decisiones tomadas: Separar `allow get: if true;` y `allow list: if isSignedIn() && resource.data.userId == request.auth.uid;` en `beats/{beatId}` para permitir enlaces compartidos individuales sin exponer el listado completo de beats de todos los usuarios.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Copiar el contenido de `firestore.rules` en la pestaña "Reglas" de Firestore en Firebase Console y publicar (o ejecutar `firebase deploy --only firestore:rules` / `firebase emulators:start --only firestore` si se instala `firebase-tools`).
- Riesgos / pendientes: Las reglas deben publicarse en la consola de Firebase para que entren en vigor en el proyecto en la nube. En T11 se cerrará `2fa_codes/{userId}` a `allow read, write: if false;`.
- Siguiente paso sugerido (y para qué modelo): Fase D — T11 (Mover 2FA y captcha al servidor con paridad Vercel y Docker) con Argon.

### [2026-10-29 22:42] T09 — Contadores de Inicio.jsx con stats/global e increment(1) — Argon
- Rama: `fix/T09-contadores-inicio`
- Estado: completada
- Archivos tocados: `src/pages/Inicio.jsx`, `src/context/AuthContext.jsx`, `src/pages/BeatIt.jsx`, `src/pages/EchoSafe.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se reemplazaron las tres suscripciones `onSnapshot` a colecciones completas (`users`, `beats`, `echo_reports`) en `Inicio.jsx` por una única suscripción ligera al documento público `stats/global`. Se añadieron actualizaciones atómicas con `increment(1)` sobre `stats/global` al registrar usuario (email, Google, Microsoft) en `AuthContext.jsx`, al guardar un beat en `BeatIt.jsx` y al publicar un reporte en `EchoSafe.jsx`, así como `increment(-1)` al cancelar un registro pendiente sin verificar en `AuthContext.jsx`.
- Decisiones tomadas: Se envolvieron las escrituras de `stats/global` en bloques `try/catch` independientes para no interrumpir la operación principal si el contador falla temporalmente, y en `cancelarRegistroPendiente` se ejecuta `increment(-1)` antes de `deleteUser(currentUser)` mientras la sesión sigue autenticada.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Abrir `/` sin sesión y comprobar que escucha `stats/global` sin descargar las colecciones completas; crear un beat o reporte y comprobar que el contador en `/` sube en tiempo real.
- Riesgos / pendientes: Si la base de datos ya tiene documentos previos y `stats/global` aún no existe, empezará desde 0 hasta que se inicialice en la consola de Firebase con el conteo actual de `users`, `beats` y `echo_reports`.
- Siguiente paso sugerido (y para qué modelo): T10 (`firestore.rules` + `firebase.json` versionados) con Argon.

### [2026-10-28 19:22] T08 — Limpiar menciones de PWA en README y eliminar dev-dist — Argon
- Rama: `fix/T08-pwa-limpieza`
- Estado: completada
- Archivos tocados: `README.md`, `dev-dist/` (eliminado), `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se corrigieron las referencias en `README.md` que afirmaban que la app incluye PWA / `vite-plugin-pwa` y Service Worker, y se eliminó la carpeta huérfana `dev-dist/`.
- Decisiones tomadas: Alinear la documentación con el estado real actual (SPA con Vite 8 sin `vite-plugin-pwa`).
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Verificar que `dev-dist/` ya no existe en el directorio raíz y revisar `README.md`.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): Fase C — T09 y T10 (diseño conjunto de contadores de `Inicio.jsx` y reglas `firestore.rules`) con Argon tras visto bueno del usuario y resolución de decisiones abiertas.

### [2026-10-28 19:21] T07 — Unificar estado de sesión con useAuth() en Perfil y BeatIt — Argon
- Rama: `fix/T07-useauth-perfil-beatit`
- Estado: completada
- Archivos tocados: `src/pages/Perfil.jsx`, `src/pages/BeatIt.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se eliminaron los observadores `onAuthStateChanged` y estados `user` locales en `src/pages/Perfil.jsx` y `src/pages/BeatIt.jsx`, consumiendo directamente `user` desde `useAuth()` y sincronizando efectos por `user?.uid`.
- Decisiones tomadas: Se usó `user?.uid` como dependencia de los `useEffect` de carga y suscripción para evitar recargas innecesarias de Firestore cuando cambia la referencia del objeto `user` (p. ej., tras `updateUserPhoto`).
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Entrar a `/perfil` y `/beat-it` con y sin sesión iniciada, verificar carga de beats guardados y actualización de foto de perfil sin recargar las colecciones.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T08 (Corregir afirmación de PWA en `README.md` y eliminar carpeta huérfana `dev-dist/`) con Argon.

### [2026-10-28 19:19] T06 — Code-splitting con React.lazy y Suspense en App.jsx — Argon
- Rama: `fix/T06-lazy-routes`
- Estado: completada
- Archivos tocados: `src/App.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se aplicó carga diferida (`React.lazy`) a las páginas `Perfil`, `Artistas`, `ArtistaDetalle`, `EchoSafe` y `BeatIt` en `src/App.jsx`, envolviendo `<Routes>` en un `<Suspense>` con fallback visual consistente.
- Decisiones tomadas: Se mantuvieron en el bundle de entrada las rutas ligeras (`Inicio`, `Login`, `SpotifyCallback`, `NotFound`). El chunk de entrada `index-*.js` bajó de 1,060.63 kB a 261.83 kB (gzip: 77.42 kB), cumpliendo la meta (< 400 kB) y eliminando la advertencia de chunks > 500 kB de Vite.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ (entry chunk: 261.83 kB) · pasos manuales: Navegar entre `/`, `/artistas`, `/artistas/:id`, `/echo-safe`, `/beat-it` y `/perfil` verificando la carga perezosa de cada módulo sin errores.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T07 (`Perfil.jsx` y `BeatIt.jsx`: usar `useAuth()` en lugar de `onAuthStateChanged` propio) con Argon.

### [2026-10-28 18:24] T05 — Exigir claves reales de reCAPTCHA en producción — Argon
- Rama: `fix/T05-captcha-produccion`
- Estado: completada
- Archivos tocados: `api/verify-captcha.js`, `src/pages/Login.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: En `api/verify-captcha.js`, se restringió el fallback a `TEST_SECRET` únicamente cuando no es producción (`NODE_ENV !== 'production'` y `VERCEL_ENV !== 'production'`), devolviendo error si falta `RECAPTCHA_SECRET_KEY` en producción. En `src/pages/Login.jsx`, se restringió la site key de prueba de Google a `import.meta.env.DEV`, mostrando un aviso explícito y manteniendo bloqueado el acceso si falta `VITE_RECAPTCHA_SITE_KEY` en un build de producción.
- Decisiones tomadas: Si falta `VITE_RECAPTCHA_SITE_KEY` en producción, no se monta `<ReCAPTCHA>` con cadena vacía para evitar errores del widget, y los botones de inicio de sesión permanecen deshabilitados (`!captchaValido`).
- Variables de entorno nuevas: Ninguna (usa las existentes `RECAPTCHA_SECRET_KEY` y `VITE_RECAPTCHA_SITE_KEY`).
- Verificación: lint ✅ · build ✅ · pasos manuales: En `npm run dev` sin variables de reCAPTCHA se usa la clave de prueba; en build de producción (`npm run build && npm run preview`) sin `VITE_RECAPTCHA_SITE_KEY` en `.env` se muestra el aviso de falta de configuración y en el backend con `NODE_ENV=production` sin `RECAPTCHA_SECRET_KEY` responde HTTP 400.
- Riesgos / pendientes: En `Dockerfile.api` conviene definir `ENV NODE_ENV=production` cuando se toque ese archivo en la Fase D (T11) para que el contenedor Docker también fuerce el modo producción por defecto.
- Siguiente paso sugerido (y para qué modelo): Fase B — T06 (`React.lazy` + `Suspense` en `App.jsx`) con Argon tras visto bueno del usuario.

### [2026-10-28 18:22] T04 — Paralelizar lecturas con Promise.all en ArbolEcos.jsx — Argon
- Rama: `fix/T04-arbol-ecos-promise-all`
- Estado: completada
- Archivos tocados: `src/components/ArbolEcos.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se reemplazó el bucle `for…await` secuencial en `fetchEcos` por `Promise.all(ecos.map(...))`, manteniendo el bloque `try/catch` individual por cada artista relacionado.
- Decisiones tomadas: Mantener el `try/catch` dentro del `map` para que el fallo de un documento puntual no invalide la carga del resto de artistas relacionados.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Abrir `/artistas/:id` y verificar que la sección "Árbol de Ecos" renderiza los nodos de artistas relacionados en paralelo.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T05 (`api/verify-captcha.js` y `Login.jsx`: endurecer claves de reCAPTCHA en producción) con Argon.

### [2026-10-28 18:21] T03 — Eliminar AuthProvider duplicado en main.jsx — Argon
- Rama: `fix/T03-authprovider-unico`
- Estado: completada
- Archivos tocados: `src/main.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se eliminó el envoltorio `<AuthProvider>` duplicado en `src/main.jsx`, conservando una única instancia en `src/App.jsx` para evitar registrar dos observadores `onAuthStateChanged` globales.
- Decisiones tomadas: Se mantuvo `<AuthProvider>` en `src/App.jsx` junto al resto de proveedores (`<SpotifyPlayerProvider>`, `<BrowserRouter>`).
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Iniciar y cerrar sesión verificando que el estado de autenticación y la redirección de `RutaProtegida` funcionan normalmente.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T04 (`ArbolEcos.jsx`: reemplazar `for…await` por `Promise.all`) con Argon.

### [2026-10-28 18:20] T02 — Corregir ordenación de beats y reportes en Perfil — Argon
- Rama: `fix/T02-perfil-orden`
- Estado: completada
- Archivos tocados: `src/pages/Perfil.jsx`, `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Se corrigió la ordenación de `beatsDescargados` usando `timestamp?.toMillis?.() ?? 0` (L63) y de `reportesData` usando `createdAt?.toMillis?.() ?? 0` (L113) para evitar resultados `NaN` con objetos `Timestamp` de Firestore.
- Decisiones tomadas: Se mantuvo el fallback `?? 0` en ambos comparadores para tolerar documentos sin marca temporal.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ · pasos manuales: Abrir `/perfil` con sesión iniciada y comprobar que tanto "Mis Cintas" como los reportes de "Echo-Safe" aparecen ordenados del más reciente al más antiguo.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T03 (Quitar `<AuthProvider>` duplicado entre `main.jsx` y `App.jsx`) con Argon.

### [2026-10-28 17:21] T01 — Crear rama fix/stabilization y confirmar línea base — Flash
- Rama: `fix/stabilization`
- Estado: completada
- Archivos tocados: `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md`
- Qué se hizo: Creación de la rama `fix/stabilization` a partir de `main` y verificación de la línea base de lint y build.
- Decisiones tomadas: Ninguna.
- Variables de entorno nuevas: Ninguna.
- Verificación: lint ✅ · build ✅ (bundle ~1.06 MB) · pasos manuales: `git checkout -b fix/stabilization` ejecutado con éxito.
- Riesgos / pendientes: Ninguno.
- Siguiente paso sugerido (y para qué modelo): T02 (`Perfil.jsx`: orden de beats y reportes) con Flash en rama propia `fix/T02-perfil-orden-beats`.

### [2026-10-28 16:55] Inicio — preparación — Claude Sonnet 5.5
- Estado: completada
- Archivos tocados: `docs/PLAN_MAESTRO.md`, `docs/HANDOFF.md` (nuevos). Ningún archivo de código.
- Qué se hizo: auditoría del proyecto y plan aprobado por el usuario.
- Línea base verificada: `npm run lint` ✅ · `npm run build` ✅ (bundle único de ~1.06 MB).
- Decisiones abiertas: reglas actuales de Firestore, plan de Firebase, proveedor de correo y destino de despliegue (ver PLAN_MAESTRO.md).
- Siguiente paso sugerido: T01 → T05 con Flash. T09 y T10 con Argon, tras resolver las decisiones abiertas.
