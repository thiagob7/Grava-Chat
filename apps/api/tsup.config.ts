import { execSync } from "node:child_process";
import { defineConfig } from "tsup";

const git = (command: string) => {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(git("git rev-parse --short HEAD")),
    __BRANCH__: JSON.stringify(git("git rev-parse --abbrev-ref HEAD")),
    __BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
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
