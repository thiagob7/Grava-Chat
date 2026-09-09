export const CORRECOES_DE_TEMA = `
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

const SINAIS = ["data-flx", ".module__", "--Theme", "referencia"];

export function pareceTemaDeFora(css: string) {
  return SINAIS.some((sinal) => css.includes(sinal));
}
