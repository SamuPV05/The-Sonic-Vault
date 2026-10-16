# 💽 The Sonic Vault & Radar Echo-Safe

**The Sonic Vault** es una plataforma web progresiva de vanguardia diseñada para coleccionistas musicales, audiófilos y exploradores sónicos. Integra catálogo de culto, desensamblado de pistas (*stems*), síntesis e interactividad en tiempo real (MPC "Beat It"), geolocalización de niveles sonoros ("Radar Echo-Safe") y un sistema robusto de autenticación y seguridad de nivel empresarial.

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

## ✨ Módulos Interactivos Principales

* **Catálogo Sónico & Bóvedas de Artistas:** Explorador por eras musicales (Eminem, Rihanna, The Weeknd, Lady Gaga, etc.) con estadísticas e historial.
* **Desensamblador Sónico:** Reproductores de canales de audio (*stems*) interactivos y condicionales por era.
* **Radar Echo-Safe (Mapa de la Tranquilidad):** Mapeo sonoro geolocalizado en tiempo real con `React-Leaflet`, midiendo decibelios ambientales con la Web Audio API.
* **Estudio "BEAT IT" (MPC Interactivo):** Caja de ritmos y sintetizador con envolventes ADSR, polifonía, looper y visualizador de osciloscopio en Canvas HTML5.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19, JavaScript (ES6+), Vanilla CSS (Diseño Cyberpunk / Glassmorphism)
* **Build Tool:** Vite
* **Base de Datos & Auth:** Firebase Authentication (Google, Microsoft, Email/Password) & Cloud Firestore
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

---

## 🎓 Información Académica

* **Autor:** Samuel Pérez Valencia
* **Programa Académico:** Desarrollo de Software
* **Institución:** Universidad Católica Luis Amigó
* **Ubicación:** Medellín, Antioquia, Colombia

---

*"La tecnología y la música, codificadas en un solo lugar."*
