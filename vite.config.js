import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// During development every request to /api/* is forwarded to the Express backend.
// This avoids CORS problems, because the browser only ever talks to the Vite server.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
