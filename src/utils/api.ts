// utils/api.ts
import { getToken, clearToken } from "./auth";
import BASE_URL from "@/config"; // Using @/config path alias

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let fullUrl = endpoint;
  // Check if endpoint is already an absolute URL (e.g., starts with http:// or https://)
  if (!/^https?:\/\//i.test(endpoint)) {
    // Ensure BASE_URL ends with a slash and endpoint doesn't start with one, or vice-versa
    const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    fullUrl = baseUrl + cleanEndpoint;
  }
  
  console.log('DEBUG: Making API call to:', fullUrl); // Ensure this line is active

  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    // Redirect to login, ensuring it's a path relative to the frontend host
    window.location.assign('/auth/login'); 
    throw new Error('Session expirée. Redirection sur la page de connexion.');
  }

  return response;
};
