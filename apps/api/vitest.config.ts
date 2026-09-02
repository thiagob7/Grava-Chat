import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "~": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /// Sem isto, todo teste que importa um módulo que importa o `env` morre no
    /// `process.exit(1)` — e o vitest só sabe dizer "falhou ao carregar".
    setupFiles: ["./vitest.setup.ts"],
  },
});
