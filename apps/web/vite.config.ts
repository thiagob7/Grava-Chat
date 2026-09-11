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
const now = new Date();
const twoDigits = (n: number) => String(n).padStart(2, "0");

const VERSION_WEB = [
  now.getUTCFullYear(),
  `${now.getUTCMonth() + 1}${twoDigits(now.getUTCDate())}`,
  `${twoDigits(now.getUTCHours())}${twoDigits(now.getUTCMinutes())}${twoDigits(now.getUTCSeconds())}`,
].join(".");

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    /*
      Os cursores ficam como ARQUIVO, nunca embutidos.

      São 181 desenhos de uns 4 KB, abaixo do limite em que o Vite embute a
      imagem no JavaScript como texto. Embutidos, virariam quase 1 MB que todo
      mundo baixa de uma vez para ver uma grade onde só uma dúzia aparece na
      tela. Soltos, o navegador busca os que entram no campo de visão e guarda
      cada um em cache com o nome versionado.
    */
    assetsInlineLimit: (file: string) =>
      file.includes("/assets/cursores/") ? false : undefined,
  },

  define: { __VERSION_WEB__: JSON.stringify(VERSION_WEB) },
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
