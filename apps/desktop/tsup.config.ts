import { defineConfig } from "tsup";

/**
 * Dois alvos, os dois em CommonJS: o processo principal do Electron e o
 * preload. O preload PRECISA ser CJS — com `contextIsolation` ligado ele roda
 * antes de qualquer sistema de módulos do renderer existir.
 *
 * `electron` fica de fora do bundle (é o próprio runtime), e o `uiohook-napi`
 * também, porque é binário nativo: empacotar um `.node` não funciona.
 */
export default defineConfig({
  entry: { main: "src/main/index.ts", preload: "src/preload/index.ts" },
  format: ["cjs"],
  target: "node22",
  platform: "node",
  outExtension: () => ({ js: ".cjs" }),
  external: ["electron", "uiohook-napi"],
  // @gravae/shared é TypeScript cru, sem build próprio: entra no bundle
  noExternal: ["@gravae/shared"],
  clean: true,
  sourcemap: true,
});
