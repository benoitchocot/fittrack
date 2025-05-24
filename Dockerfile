# Étape 1 : build avec Node
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

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
