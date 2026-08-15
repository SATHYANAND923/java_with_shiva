import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxies /api and /uploads calls to the backend during local development
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
  },
});
