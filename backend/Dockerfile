# Utilise une image Node officielle
FROM node:18

# Crée un dossier de travail
WORKDIR /app

# Copie les fichiers package.json et installe les dépendances
COPY package*.json ./

RUN npm install

# Copie le reste des fichiers
COPY . .

# Expose le port utilisé par le backend
EXPOSE 80

# Lance le serveur
CMD ["node", "server.js"]
