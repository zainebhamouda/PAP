# ════════════════════════════════════════════════════════════════
# Étape 1 — Build React (Vite)
# ════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json en premier pour profiter du cache npm
COPY package*.json ./
RUN npm ci

# Copier le code source et builder
COPY . .
RUN npm run build

# ════════════════════════════════════════════════════════════════
# Étape 2 — Serveur Nginx (production)
# ════════════════════════════════════════════════════════════════
FROM nginx:alpine

# Copier les fichiers buildés dans Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
