import { defineConfig } from "tsup";

export default defineConfig({
  entry: { main: "src/main/index.ts", preload: "src/preload/index.ts" },
  format: ["cjs"],
  target: "node22",
  platform: "node",
  outExtension: () => ({ js: ".cjs" }),
  external: ["electron", "uiohook-napi"],
  noExternal: ["@gravae/shared"],
  // O app empacotado nao tem .env: o `dotenv` do script `dev` so envolve o
  // electron, nao o build. Sem embutir a URL aqui, o .dmg instalado cai no
  // fallback de localhost e abre a tela de erro.
  env: { GRAVAE_APP_URL_EMBUTIDO: process.env.GRAVAE_APP_URL ?? "" },
  clean: true,
  sourcemap: true,
});
