import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// BE má `setGlobalPrefix('api')` v main.ts — všechny REST endpointy jsou pod `/api/*`.
export const apiClient = axios.create({
  baseURL: `${apiBase}/api`,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ikaros.jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
