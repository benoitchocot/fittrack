// utils/api.ts
import { getToken } from "./auth";

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
  return response;
};
