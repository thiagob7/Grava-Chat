import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/*
  O carimbo da versão do front, no formato da referência: ano.mêsdia.horaminuto
  segundo — "2026.903.130934". Não é semver e não quer ser: o que o rodapé
  precisa responder é "qual build está rodando aqui?", e a resposta útil para
  isso é QUANDO ele foi feito, não que número alguém escreveu no `package.json`.

  Vale a data da máquina que buildou, que na Vercel é UTC.
*/
const agora = new Date();
const doisDigitos = (n: number) => String(n).padStart(2, "0");

const VERSAO_WEB = [
  agora.getUTCFullYear(),
  `${agora.getUTCMonth() + 1}${doisDigitos(agora.getUTCDate())}`,
  `${doisDigitos(agora.getUTCHours())}${doisDigitos(agora.getUTCMinutes())}${doisDigitos(agora.getUTCSeconds())}`,
].join(".");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __VERSAO_WEB__: JSON.stringify(VERSAO_WEB) },
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
