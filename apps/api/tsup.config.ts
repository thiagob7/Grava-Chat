import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  noExternal: ["@gravae/shared"],
  /// Os temas da casa viajam com o dist: a API os lê do disco ao publicar.
  onSuccess: "mkdir -p dist/temas && cp temas/*.css dist/temas/",
});
