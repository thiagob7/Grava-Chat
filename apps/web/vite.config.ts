import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "~": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://localhost:3333", changeOrigin: true },
      "/socket.io": { target: "http://localhost:3333", ws: true, changeOrigin: true },
    },
    allowedHosts: [".ngrok-free.dev", ".ngrok.io", ".ngrok-free.app"],
  },
});
