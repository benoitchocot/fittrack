# Utilise une image Node officielle
FROM node:18

# Crée un dossier de travail
WORKDIR /app

# Configure npm pour être plus résilient
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Copie les fichiers package.json et installe les dépendances
COPY package*.json ./

# Nettoie le cache npm et installe les dépendances avec retry
RUN npm cache clean --force || true && \
    npm install --no-audit --prefer-offline || \
    (sleep 5 && npm install --no-audit) || \
    (sleep 10 && npm install --no-audit)

# Copie le reste des fichiers
COPY . .

# Expose le port utilisé par le backend
EXPOSE 3001

# Lance le serveur
CMD ["node", "server.js"]
