/*
  Um tema de CSS é escrito contra a árvore e os nomes de variável de UM app.
  O Fluxer chama o fundo da lateral de `--background-secondary`; aqui ele é
  `--color-surface-1`. Por isso um tema deles, colado cru no nosso estúdio,
  quase não muda nada: ele pinta variáveis que ninguém lê.

  Esta ponte lê o que o tema declarou e escreve nos nossos nomes. Não é
  tradução perfeita — o que o tema faz por seletor de componente
  (`.MemberListContainer__…`) continua sem efeito, porque essas classes não
  existem na nossa árvore. Mas cor e tipografia, que é o grosso do que se vê,
  passam a valer.

  Os nomes do lado esquerdo saíram do CSS publicado do Fluxer e do próprio
  repositório deles.
*/
export const PONTE_DE_TEMA: Record<string, string[]> = {
  /// Trilho de servidores, barras laterais e faixa de título.
  "--background-secondary": ["--color-surface-1"],
  /// O miolo: barra do canal, conversa, caixa de escrever, coluna da direita.
  "--background-secondary-lighter": ["--color-surface-2", "--color-composer", "--color-cabecalho"],
  /// Cartão de chamada e de usuário.
  "--background-secondary-alt": ["--color-painel"],
  /// O fundo mais fundo, atrás de tudo.
  "--background-primary": ["--color-surface-0"],
  "--background-tertiary": ["--color-surface-3"],
  /// Menus, balões e dicas.
  "--form-surface-background": ["--color-surface-4"],
  "--background-textarea": ["--color-campo"],
  "--background-modifier-selected": ["--color-selecionado"],
  "--background-modifier-hover": ["--color-hover"],
  "--background-modifier-accent": ["--color-line", "--color-divisor"],
  "--background-header-secondary": ["--color-line"],

  "--text-primary": ["--color-ink"],
  "--text-primary-muted": ["--color-ink-muted"],
  "--text-tertiary": ["--color-ink-faint"],
  "--text-link": ["--color-link", "--color-mencao"],

  "--brand-primary": ["--color-brand"],
  "--focus-primary": ["--color-brand"],
  "--status-danger": ["--color-danger"],
  "--accent-danger": ["--color-danger"],
  "--status-warning": ["--color-aviso", "--color-idle"],
  "--status-online": ["--color-online"],
  "--status-idle": ["--color-idle"],
  "--status-dnd": ["--color-dnd"],

  "--font-primary": ["--font-sans"],
  "--font-display": ["--font-display"],
  "--font-mono": ["--font-mono"],
};

/// As variáveis que vale a pena ler da folha do tema.
export const NOMES_DE_ORIGEM = Object.keys(PONTE_DE_TEMA);

/*
  Recebe o que foi lido da raiz e devolve o que escrever nos nossos nomes.

  `intocaveis` são os tokens que a pessoa mexeu na mão no estúdio: escolha
  explícita ganha do que veio junto com o tema, senão importar apagaria o
  ajuste dela sem avisar.
*/
export function traduzirTema(
  lidos: Record<string, string>,
  intocaveis: ReadonlySet<string> = new Set(),
): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const [origem, destinos] of Object.entries(PONTE_DE_TEMA)) {
    const valor = lidos[origem]?.trim();
    if (!valor) continue;

    for (const destino of destinos) {
      if (!intocaveis.has(destino)) saida[destino] = valor;
    }
  }

  return saida;
}
