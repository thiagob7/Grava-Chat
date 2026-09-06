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
/*
  A ORDEM aqui é regra, não arrumação.

  Vários papéis deles caem num token só nosso: eles têm `--brand-primary` para a
  marca e `--button-primary-fill` para o preenchimento do botão, que são cores
  independentes; nós temos `--color-brand` para as duas coisas. Quem escreve
  depois vence, então o nome CANÔNICO de cada papel fica por último, e os
  apelidos e os casos específicos vêm antes. Um tema que só mexe no botão pinta
  a nossa marca; um que mexe nos dois deixa a marca mandar.
*/
export const PONTE_DE_TEMA: Record<string, string[]> = {
  /*
    A segunda leva, medida no gerador de cores deles.

    Das 136 variáveis de cor que o `GenerateColorSystem.ts` produz, a ponte
    traduzia 40. As que entram agora explicam o sintoma de "importei e quase
    nada mudou": boa parte é APELIDO do que já estava aqui — `--bg-primary` é
    `var(--background-primary)` lá dentro — e um tema que escreveu o apelido
    passava batido inteiro.

    E uma não é apelido de nada: `--button-primary-fill` é cor própria, verde
    no padrão deles, sem relação com `--brand-primary`. Era ela que deixava o
    nosso botão índigo num tema vermelho.
  */
  "--bg-primary": ["--color-surface-0"],
  "--bg-secondary": ["--color-surface-1"],
  "--bg-tertiary": ["--color-surface-3"],
  "--bg-hover": ["--color-hover"],
  "--bg-active": ["--color-selecionado"],
  "--bg-code": ["--color-codigo"],
  "--bg-code-block": ["--color-codigo-bloco"],
  "--bg-table-header": ["--color-surface-3"],
  "--background-header-primary-hover": ["--color-hover"],

  "--panel-control-bg": ["--color-surface-3"],
  "--panel-control-border": ["--color-line"],
  "--panel-control-divider": ["--color-divisor"],

  /// Os botõezinhos do painel de voz — mudo, fone, tela, engrenagem.
  "--control-button-normal-text": ["--color-ink-muted"],
  "--control-button-hover-text": ["--color-ink"],
  "--control-button-active-text": ["--color-ink"],
  "--control-button-hover-bg": ["--color-hover"],
  "--control-button-active-bg": ["--color-selecionado"],
  "--control-button-danger-text": ["--color-danger"],
  "--control-button-danger-hover-bg": ["--color-danger-fundo"],

  "--interactive-muted": ["--color-ink-faint"],
  "--interactive-active": ["--color-ink"],

  "--accent-info": ["--color-link"],
  "--accent-purple": ["--color-everyone"],
  "--status-warning": ["--color-idle"],

  "--alert-note-color": ["--color-link"],
  "--alert-tip-color": ["--color-online"],
  "--alert-important-color": ["--color-everyone"],
  "--alert-warning-color": ["--color-aviso"],
  "--alert-caution-color": ["--color-danger"],

  /*
    Preenchimento e texto de botão. Ficam ANTES dos nomes canônicos de marca e
    de perigo, logo abaixo, para que um tema que mexe nos dois deixe a marca
    mandar — e um que só mexe no botão ainda pinte alguma coisa.
  */
  "--button-ghost-text": ["--color-ink-muted"],
  "--button-secondary-text": ["--color-ink"],
  "--button-primary-active-fill": ["--color-brand-hover"],
  "--button-primary-fill": ["--color-brand"],
  "--button-primary-text": ["--color-sobre-marca"],
  "--button-danger-active-fill": ["--color-danger"],
  "--button-danger-fill": ["--color-danger", "--color-dnd"],
  "--button-danger-text": ["--color-sobre-marca"],
  "--text-on-brand-primary": ["--color-sobre-marca"],

  /// Trilho de servidores, barras laterais e faixa de título.
  "--background-secondary": ["--color-surface-1"],
  /// O miolo: conversa, caixa de escrever, coluna da direita.
  "--background-secondary-lighter": ["--color-surface-2", "--color-composer"],
  /// Cartão de chamada e de usuário.
  "--background-secondary-alt": ["--color-painel"],
  /// O fundo mais fundo, atrás de tudo.
  "--background-primary": ["--color-surface-0"],
  "--background-tertiary": ["--color-surface-3"],
  "--background-channel-header": ["--color-cabecalho"],
  "--background-header-primary": ["--color-cabecalho"],
  /// Menus, balões e dicas.
  "--form-surface-background": ["--color-surface-4"],
  "--background-textarea": ["--color-campo"],
  "--background-modifier-selected": ["--color-selecionado"],
  "--background-modifier-hover": ["--color-hover"],
  "--background-modifier-accent": ["--color-divisor"],
  "--background-header-secondary": ["--color-line"],
  "--border-color": ["--color-line"],
  "--border-color-focus": ["--color-campo-foco"],

  "--text-primary": ["--color-ink"],
  "--text-chat": ["--color-ink"],
  "--text-secondary": ["--color-ink-muted"],
  "--text-primary-muted": ["--color-ink-muted"],
  "--text-tertiary": ["--color-ink-faint"],
  "--text-link": ["--color-link", "--color-mencao"],
  "--text-warning": ["--color-aviso"],

  "--brand-primary": ["--color-brand"],
  "--brand-primary-fill": ["--color-brand"],
  "--brand-secondary": ["--color-brand-hover"],
  "--accent-primary": ["--color-brand"],
  "--accent-danger": ["--color-danger"],
  "--accent-success": ["--color-online"],
  "--accent-warning": ["--color-idle", "--color-aviso"],
  "--status-danger": ["--color-danger"],
  "--status-online": ["--color-online"],
  "--status-idle": ["--color-idle"],
  "--status-dnd": ["--color-dnd"],

  /*
    Estes saíram de uma contagem no código deles: são as variáveis que os
    componentes mais consomem e que a ponte não traduzia. Um tema que mexe
    nelas mexia em tudo lá e em nada aqui — juntas, dão conta de umas 330
    aparições na interface deles.
  */
  "--brand-primary-light": ["--color-brand-hover"],
  "--surface-interactive-hover-bg": ["--color-hover"],
  "--settings-hover-background": ["--color-hover"],
  "--surface-interactive-selected-bg": ["--color-selecionado"],
  "--surface-interactive-selected-color": ["--color-ink"],
  "--text-tertiary-muted": ["--color-ink-faint"],
  "--text-chat-muted": ["--color-ink-muted"],
  "--voice-text-strong": ["--color-ink"],
  "--user-area-divider-color": ["--color-divisor"],
  "--settings-border-color": ["--color-line"],
  "--settings-surface-background": ["--color-surface-2"],
  "--background-modifier-accent-focus": ["--color-campo-foco"],

  "--code-block-bg": ["--color-codigo-bloco"],
  "--code-inline-bg": ["--color-codigo"],
  "--scrollbar-thumb-bg": ["--color-trilho"],
  "--scrollbar-thumb-bg-hover": ["--color-trilho"],
  "--scrollbar-track-bg": ["--scrollbar-track-bg"],
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

/*
  Quais variáveis o próprio arquivo declara.

  Sem esta pergunta a ponte lia o computado da raiz e achava valor para TODO
  nome do vocabulário do Fluxer — porque a nossa camada de tokens já declara
  esse vocabulário inteiro. O tema não tinha dito nada sobre
  `--background-channel-header`, e mesmo assim o valor da nossa camada de
  referência era escrito por cima do `--color-cabecalho` real. Era por isso que
  o cabeçalho da conversa saía de outra cor.

  Agora a ponte só traduz o que o tema escreveu com as próprias mãos.
*/
export function nomesDeclaradosNoTema(css: string): Set<string> {
  const achados = new Set<string>();

  for (const declaracao of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
    if (declaracao[1]) achados.add(declaracao[1]);
  }

  return achados;
}
