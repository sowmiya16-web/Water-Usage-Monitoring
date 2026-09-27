// API Configuration for Spring Boot Backend Integration
//
// Relative by design ("/api", not "http://localhost:8080/api"): a hardcoded
// "localhost" only ever means the device the browser itself is running on, so it
// silently breaks the moment this site is opened from a phone (or any other
// machine) instead of the dev PC. Using a relative path means every request goes
// to whatever host the page was actually loaded from — in dev, Vite's proxy
// (see vite.config.js) forwards it to the Spring Boot backend on this machine;
// in a production build behind a reverse proxy / same-origin deployment it keeps
// working unchanged. Set VITE_API_URL at build time only if the API is ever
// deployed on a different origin than the frontend.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // Attach stored authentication token if present
  const token = localStorage.getItem("authToken");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const err = new Error((data && data.message) || `HTTP error! Status: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}
