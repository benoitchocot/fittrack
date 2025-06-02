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
    window.location.href = '/auth/login';
    // It's important to return a response, even if it's an empty one,
    // to prevent further processing by the caller after redirection.
    // Alternatively, we could throw an error here, but redirection is the primary goal.
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }

  return response;
};
