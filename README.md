# 🏋️ FitTrack

FitTrack est une application de suivi d'entraînement développée avec un frontend moderne (Vite + TypeScript + Tailwind) et un backend Node.js.  
Ce dépôt contient tout le nécessaire pour exécuter l'application en local, avec ou sans Docker.

---

## 🚀 Fonctionnalités

- Suivi des exercices de musculation
- Interface frontend responsive et moderne
- API Node.js simple à déployer
- Docker-ready avec support Traefik (reverse proxy)

---

## 📦 Prérequis

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- (Optionnel) Node.js ≥ v18 pour exécuter localement sans Docker

---

## 🐳 Déploiement avec Docker Compose

### 🔁 1. Cloner le dépôt

```bash
git clone https://github.com/benoitchocot/fittrack.git
cd fittrack
```

### 🛠️ 2. Configuration des services Docker

#### Backend (`backend/Dockerfile`)

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

CMD ["node", "server.js"]
```

#### Frontend (`Dockerfile` à la racine)

```dockerfile
# Étape 1 : build du frontend
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Étape 2 : servir avec Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Fichier `nginx.conf` (à la racine du projet)

```nginx
server {
  listen 80;
  server_name localhost;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

### 📋 3. Fichier `docker-compose.yml`

```yaml
version: '3'

services:
  muscu-app:
    build: ./backend
    container_name: muscu-app
    ports:
      - "9998:80"
    volumes:
      - muscu-data:/app/data
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.muscu.rule=Host(`muscu.chocot.be`)"
      - "traefik.http.routers.muscu.entrypoints=http"
      - "traefik.http.services.muscu.loadbalancer.server.port=80"
      - "traefik.http.routers.muscu.service=muscu"
    restart: always

  muscu-front:
    build: .
    container_name: muscu-front
    ports:
      - "9999:80"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.muscu-front.rule=Host(`front.chocot.be`)"
      - "traefik.http.routers.muscu-front.entrypoints=http"
      - "traefik.http.services.muscu-front.loadbalancer.server.port=80"
    restart: always

volumes:
  muscu-data:
```

---

### ▶️ 4. Lancer l'application

```bash
docker compose up --build
```

### 🔎 5. Accès à l'application

- **Frontend** : http://localhost:9999 ou http://front.chocot.be (via Traefik)
- **Backend API** : http://localhost:9998 ou http://muscu.chocot.be (via Traefik)

---

## 🧪 Lancement en mode développement (sans Docker)

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash
npm install
npm run dev
```

> Remarque : Vous devrez peut-être modifier les variables d’environnement dans le frontend pour pointer vers votre backend local (localhost:9998).

---

## 🧰 Notes complémentaires

- Le backend expose ses données sur le port 80 à l'intérieur du conteneur.
- Le frontend est servi via Nginx après un build (`npm run build`).
- Les noms de domaine `*.chocot.be` doivent pointer vers votre serveur pour être utilisables avec Traefik.
- Le volume `muscu-data` est utilisé pour stocker les données persistantes du backend.

---

## 🙏 Remerciements

Projet open-source initié par [@benoitchocot](https://github.com/benoitchocot). Contributions et améliorations bienvenues !