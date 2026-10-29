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
