/**
 * Os tokens do tema, agrupados como o estúdio mostra.
 *
 * É a mesma lista que o `@theme` do `index.css` declara — a diferença é que
 * aqui cada um tem nome em português e um grupo, porque `--color-ink-faint`
 * não diz nada pra quem está escolhendo cor. Token novo no CSS: acrescente
 * aqui também, senão ele existe e ninguém acha.
 */
export interface TokenDoTema {
  nome: string;
  rotulo: string;
  dica?: string;
}

export interface GrupoDeTokens {
  titulo: string;
  tokens: TokenDoTema[];
}

export const GRUPOS_DE_TOKENS: GrupoDeTokens[] = [
  {
    titulo: "Superfícies",
    tokens: [
      { nome: "--color-surface-0", rotulo: "Fundo mais profundo", dica: "trilho de servidores, balões" },
      { nome: "--color-surface-1", rotulo: "Barra lateral", dica: "lista de canais, painéis" },
      { nome: "--color-surface-2", rotulo: "Área da conversa" },
      { nome: "--color-surface-3", rotulo: "Elevação leve", dica: "hover, pastilhas" },
      { nome: "--color-surface-4", rotulo: "Elevação forte" },
      { nome: "--color-line", rotulo: "Borda" },
      { nome: "--color-divisor", rotulo: "Divisória", dica: "aceita transparência" },
      { nome: "--color-hover", rotulo: "Realce do mouse", dica: "aceita transparência" },
    ],
  },
  {
    titulo: "Texto",
    tokens: [
      { nome: "--color-ink", rotulo: "Texto principal" },
      { nome: "--color-ink-muted", rotulo: "Texto secundário" },
      { nome: "--color-ink-faint", rotulo: "Texto apagado", dica: "horários, dicas" },
    ],
  },
  {
    titulo: "Marca e acentos",
    tokens: [
      { nome: "--color-brand", rotulo: "Marca" },
      { nome: "--color-brand-hover", rotulo: "Marca no hover" },
      { nome: "--color-pilula", rotulo: "Barrinha do servidor ativo" },
      { nome: "--color-online", rotulo: "Online" },
      { nome: "--color-idle", rotulo: "Ausente" },
      { nome: "--color-dnd", rotulo: "Não perturbe" },
      { nome: "--color-danger", rotulo: "Perigo", dica: "excluir, sair, erro" },
      { nome: "--color-aviso", rotulo: "Aviso" },
    ],
  },
  {
    titulo: "Conversa",
    tokens: [
      { nome: "--color-link", rotulo: "Link" },
      { nome: "--color-mencao", rotulo: "Menção" },
      { nome: "--color-mencao-fundo", rotulo: "Fundo da menção", dica: "aceita transparência" },
      { nome: "--color-resposta", rotulo: "Resposta", dica: "o fio da citação" },
      { nome: "--color-codigo", rotulo: "Código na linha" },
      { nome: "--color-codigo-bloco", rotulo: "Bloco de código" },
    ],
  },
  {
    titulo: "Formulários",
    tokens: [
      { nome: "--color-campo", rotulo: "Campo" },
      { nome: "--color-campo-foco", rotulo: "Campo em foco" },
    ],
  },
];

export const TODOS_OS_TOKENS = GRUPOS_DE_TOKENS.flatMap((grupo) => grupo.tokens);

/**
 * O valor que o token tem AGORA, já com o tema aplicado.
 *
 * Lê do elemento raiz sem as substituições em linha, senão o estúdio mostraria
 * o valor que ele mesmo acabou de escrever como se fosse o do tema — e o
 * "voltar ao padrão" não teria pra onde voltar.
 */
export function valorDoTema(nome: string): string {
  const raiz = document.documentElement;
  const emLinha = raiz.style.getPropertyValue(nome);

  if (!emLinha) return getComputedStyle(raiz).getPropertyValue(nome).trim();

  raiz.style.removeProperty(nome);
  const doTema = getComputedStyle(raiz).getPropertyValue(nome).trim();
  raiz.style.setProperty(nome, emLinha);

  return doTema;
}

/// `<input type="color">` só entende `#rrggbb`. O resto (rgb, oklab, nome de
/// cor) continua editável no campo de texto ao lado.
export function comoHex(valor: string): string | null {
  const limpo = valor.trim();
  if (/^#[0-9a-f]{6}$/i.test(limpo)) return limpo;
  if (/^#[0-9a-f]{3}$/i.test(limpo)) {
    const [r, g, b] = [limpo[1], limpo[2], limpo[3]];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return null;
}
