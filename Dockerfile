# ============================================================
# The Sonic Vault - Frontend (React + Vite) servido con Nginx
# Build multi-stage: Node compila, Nginx sirve (imagen final ligera)
# ============================================================

# ---------- Etapa 1: compilación ----------
FROM node:20-alpine AS build
WORKDIR /app

# Se copian primero solo los package*.json para aprovechar la caché de capas:
# si no cambian las dependencias, Docker no vuelve a ejecutar npm ci
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las variables VITE_* en el JS durante el build, por eso entran como ARG.
# Son llaves públicas del cliente. La llave SECRETA del Captcha NO pasa por aquí.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_RECAPTCHA_SITE_KEY

RUN npm run build

# ---------- Etapa 2: servidor de producción ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
