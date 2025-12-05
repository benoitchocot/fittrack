// API base URL
// For local dev (npm run dev): VITE_BASE_URL=http://localhost:3001/
// For production (nginx proxy): VITE_BASE_URL=https://apimuscu.chocot.be/
// In docker-compose, nginx proxies /api to backend, so use /api
const BASE_URL = 'https://apimuscu.chocot.be/';
export default BASE_URL;
