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
    /**
     * Um túnel do ngrok só alcança uma porta. Com o proxy, o túnel aponta pro
     * front e a API vai junto na MESMA origem — o que também simplifica cookie
     * e CORS, e faz o callback do Google funcionar pelo endereço público.
     */
    proxy: {
      "/api": { target: "http://localhost:3333", changeOrigin: true },
      "/socket.io": { target: "http://localhost:3333", ws: true, changeOrigin: true },
    },
    // o ngrok chega com um Host que o Vite bloquearia por padrão
    allowedHosts: [".ngrok-free.dev", ".ngrok.io", ".ngrok-free.app"],
  },
});
