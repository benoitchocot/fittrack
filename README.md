# 🏋️ FitTrack

FitTrack est une application de suivi d'entraînement développée avec un frontend moderne (Vite + TypeScript + Tailwind) et un backend Node.js.  
Ce dépôt contient tout le nécessaire pour exécuter l'application en local sans Docker.

---

## 🚀 Fonctionnalités

- Suivi des exercices de musculation
- Interface frontend responsive et moderne
- API Node.js simple à déployer
- Node.js ≥ v18 pour exécuter localement sans Docker

---


## 📦 Lancement avec Docker (recommandé)

Pour exécuter l'application **via Docker**, assurez-vous d'avoir Docker installé, puis exécutez :

```bash
docker compose up -d --build
```
Cela lancera automatiquement le frontend sur http://localhost:9999 et le backend sur http://localhost:3001.

> ⚠️ Assurez-vous que **Docker** est bien installé sur votre machine.

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

> Remarque : Vous devrez peut-être modifier les variables d’environnement dans le frontend pour pointer vers votre backend local (localhost:3001).

---


## 🙏 Remerciements

Projet open-source initié par [@benoitchocot](https://github.com/benoitchocot). Contributions et améliorations bienvenues !
