import axios from "axios";
import { storage } from "../utils/storage";

export const AUTH_EXPIRED_EVENT = "bolobuddy:auth-expired";

// "/api" goes through the Vite dev proxy to http://localhost:3000/api
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach "Authorization: Bearer <token>". The backend's authMiddleware
// splits the header on a space and reads the second part, so the
// "Bearer " prefix is required.
axiosClient.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The backend only answers 401 from authMiddleware ("Authorization token
// required" / "Invalid or expired token"). When that happens we clear the
// session and let AuthContext send the user back to the login page.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && storage.getToken()) {
      storage.clear();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
