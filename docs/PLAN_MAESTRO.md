# Plan Maestro — The Sonic Vault

Fuente de verdad de las tareas de estabilización. Marca cada casilla al terminar y registra el detalle en [HANDOFF.md](./HANDOFF.md).

**Modelos:** Flash = Gemini 3.8 Flash (IDE Antigravity actual) · Argon = Gemini 4 Argon (Antigravity 2.0)
**Dificultad:** 1–2 fácil · 3 media · 4–5 alta

## Reglas de trabajo
1. Un solo agente por tarea y por archivo. Nunca en paralelo sobre los mismos archivos.
2. Una rama por tarea (`fix/T09-contadores-inicio`), fusionada a `fix/stabilization` solo con lint y build limpios.
3. `git status` limpio antes de empezar.
4. Antes de entregar: `npm run lint` y `npm run build` sin errores.
5. Commits: `T09: descripción corta`.
6. Alcance cerrado: solo los archivos de la tarea. Si hace falta otro, anotarlo en HANDOFF.md y preguntar.
7. Nunca leer, imprimir ni escribir secretos. Claves nuevas solo en `.env.example` (sin valor).

## Fase A — Victorias rápidas
- [x] **T01** (1, Flash) Crear rama `fix/stabilization` y confirmar línea base: lint y build pasan.
- [x] **T02** (1, Flash) `Perfil.jsx`: orden de beats con `b.timestamp?.toMillis?.() ?? 0`; reportes con `createdAt` (L63 y L113).
- [x] **T03** (1, Flash) Quitar el `<AuthProvider>` duplicado (`main.jsx` / `App.jsx`). Dejar uno solo.
- [x] **T04** (1, Flash) `ArbolEcos.jsx`: `for…await` → `Promise.all`.
- [x] **T05** (2, Flash) `api/verify-captcha.js` y `Login.jsx`: en producción, fallar si falta el secreto o la site key; clave de prueba solo en desarrollo.

## Fase B — Rendimiento y limpieza
- [x] **T06** (3, Flash) `React.lazy` + `Suspense` en `App.jsx` para BeatIt, EchoSafe, Perfil, Artistas, ArtistaDetalle. Meta: bundle inicial < 400 kB.
- [x] **T07** (3, Flash) `Perfil.jsx` y `BeatIt.jsx`: usar `useAuth()` en lugar de `onAuthStateChanged` propio. `AuthProvider` solo renderiza hijos con `loading === false`.
- [x] **T08** (3, Flash) Decidir PWA. Recomendado: quitar la afirmación del README ahora; configurar `vite-plugin-pwa` más tarde.

## Fase C — Seguridad de datos (T09 y T10 se diseñan juntas)
- [x] **T09** (4, Argon) Contadores de `Inicio.jsx` sin descargar colecciones. Propuesta: documento público `stats/global` con `increment(1)` al registrarse, guardar beat y enviar reporte. Alternativa: `getCountFromServer` (exige lectura abierta de colecciones).
- [x] **T10** (4, Argon) `firestore.rules` + `firebase.json` versionados. Colecciones: `users`, `beats`, `echo_reports`, `artistas`, `2fa_codes`, `stats`. Validar con el emulador.

## Fase D — Rediseño del 2FA
- [x] **T11** (5, Argon) Mover 2FA y captcha al servidor: verificar ID token con `firebase-admin`, OTP con `crypto.randomInt`, guardar solo el hash, máximo 5 intentos, envío de correo desde servidor, sesión 2FA verificable (claim o cookie firmada), captcha exigido en el envío. Debe funcionar en Vercel y en Docker (`Dockerfile.api` hoy no instala dependencias).
- [x] **T12** (3, Flash) Pruebas manuales: registro, login con correo, Google, Microsoft, 5 códigos incorrectos, código expirado, reenviar, cancelar registro pendiente.

## Fase E — Deuda estructural
- [x] **T13a** (4, Argon) Diseño de la división de `BeatIt.jsx` (límites de módulos, hooks `useBeatItScheduler` y `useBeatItPersistence`).
- [x] **T13b** (3, Flash) Extraer `BeatItGrid`, `BeatItMixer`, `BeatItFXRack`, `BeatItTransport`. Sin cambios de comportamiento; verificar audio antes y después.
- [x] **T14** (4, Argon, opcional) Tokens de Spotify en `localStorage`: aceptar y documentar el riesgo, añadir CSP en `nginx.conf`.
- [x] **T15** (1, Flash) Actualizar README con el estado real.

## Fase F — Blindaje avanzado ("What If?") y cierre de producción
- [x] **T16** (4, Argon) Falla cerrada de secretos en producción y cooldown anti-bombardeo de 60s en `/api/2fa` (`api/2fa.js`, `api/verify-captcha.js`).
- [x] **T17** (4, Argon) Blindaje contra Rollback de intentos en `2fa_codes` e inmutabilidad de propietario en `beats` (`firestore.rules`, `api/2fa.js`).
- [x] **T18** (2, Flash) Purga de tokens Spotify al cerrar sesión y validación estricta de avatares SVG/URL (`src/context/AuthContext.jsx`, `src/pages/Perfil.jsx`).
- [ ] **T19** (2, Flash) Protección anti-CSRF en Spotify OAuth con parámetro `state` (`src/services/spotifyService.js`, `src/pages/SpotifyCallback.jsx`).
- [ ] **T20** (2, Flash) Herencia de cabeceras de seguridad en `nginx.conf` (`/assets/`) y control de payload `413` en `server/captcha-server.js`.
- [ ] **T21** (1, Flash) Consolidación y versionado de activos de identidad visual, iconos y logos.

## Decisiones resueltas en la estabilización (Fases A a E completadas)
- Reglas de Firestore: diseñadas desde cero y versionadas en `firestore.rules` + `firebase.json` (T10).
- Plan gratuito de Firebase Spark: documentado y soportado sin Cloud Functions; contadores atómicos con `stats/global` (T09).
- EmailJS: mantenido e integrado mediante API REST desde el backend (`/api/2fa`) con fallback de prueba en desarrollo (T11).
- Despliegue: paridad completa garantizada para Vercel Serverless Functions y Docker Compose (Nginx + API) (T11, T14, T15).
