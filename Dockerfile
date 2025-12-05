# Étape 1 : build avec Node
FROM node:18 AS builder

WORKDIR /app

# Configure npm pour être plus résilient
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

COPY package*.json ./

# Nettoie le cache npm et installe les dépendances avec retry
RUN npm cache clean --force || true && \
    npm install --no-audit --prefer-offline || \
    (sleep 5 && npm install --no-audit) || \
    (sleep 10 && npm install --no-audit)

COPY . .
RUN npm run build

# Étape 2 : servir avec Nginx
FROM nginx:alpine

# Supprime le contenu par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copie le build dans le dossier public de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie une config nginx personnalisée (voir plus bas)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
