import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  // @gravae/shared e TypeScript cru (sem build proprio), entao precisa entrar
  // no bundle em vez de ficar como import externo.
  noExternal: ["@gravae/shared"],
});
