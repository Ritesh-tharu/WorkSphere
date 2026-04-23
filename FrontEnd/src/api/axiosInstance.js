import axios from "axios";
import { API_BASE_URL } from "../config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("API request without token:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call! Redirecting to login...", error.config.url);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login/signup/verify-otp
      const publicPaths = ["/login", "/signup", "/verify-otp", "/"];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
