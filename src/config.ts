// Lit l'URL de base à partir des variables d'environnement.
// REACT_APP_BASE_URL est une convention courante pour les projets Create React App.
// Si vous utilisez un autre framework/bundler (Vite, Next.js, etc.),
// le nom de la variable d'environnement pourrait être différent (par ex. VITE_BASE_URL).
const BASE_URL = 'https://apimuscu.chocot.be/' || 'http://localhost:3001/';

export default BASE_URL;
