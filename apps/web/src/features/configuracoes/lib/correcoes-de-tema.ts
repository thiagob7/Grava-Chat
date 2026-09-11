export const THEME_FIXES = `
.trilho-de-servidores {
  width: var(--layout-guild-list-width) !important;
}

.trilho-de-servidores,
.lista-de-canais,
.lista-de-conversas,
.lista-de-comunidades {
  height: 100% !important;
}

.area-do-usuario {
  width: 100% !important;
}

`;

const SIGNALS = ["data-flx", ".module__", "--Theme", "referencia"];

export function outsideLooksTheme(css: string) {
  return SIGNALS.some((signal) => css.includes(signal));
}
