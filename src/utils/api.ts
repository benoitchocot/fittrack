// utils/api.ts
import { getToken, clearToken } from "./auth";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    window.location.assign('/auth/login');
    throw new Error('Session expirée. Redirection sur la page de connexion.');
  }

  return response;
};
