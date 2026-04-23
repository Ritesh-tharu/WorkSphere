export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const SERVER_URL = API_BASE_URL.replace("/api", "");
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
