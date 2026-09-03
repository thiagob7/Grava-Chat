/**
 * Os tokens do tema, agrupados como o estúdio mostra.
 *
 * São duas gerações no mesmo catálogo, e isso é de propósito:
 *
 * - os `--color-*`, em português, que o app inteiro já usa por classe do
 *   Tailwind (`bg-surface-2`, `text-ink`). Estão marcados `ligado: true`.
 * - os nomes da referência, declarados em `styles/tokens.css` — a lista
 *   completa do que dá pra vestir num cliente deste tipo. Existem, têm valor
 *   nos quatro temas e ainda não são lidos por componente nenhum.
 *
 * A marca `ligado` não é enfeite: sem ela o estúdio viraria uma parede de
 * seletores de cor em que a maioria não pinta nada, que é pior do que não
 * oferecer. Com ela dá pra filtrar, e cada componente que passa a ler um token
 * novo vira uma linha a mais que funciona. O teste confere a marca contra o
 * código de verdade, então ela não pode mentir por muito tempo.
 */
export interface TokenDoTema {
  nome: string;
  rotulo: string;
  dica?: string;
  /// O app já lê este token. Sem isto, mexer nele não muda nada na tela.
  ligado?: boolean;
}

export interface GrupoDeTokens {
  titulo: string;
  tokens: TokenDoTema[];
}

export const GRUPOS_DE_TOKENS: GrupoDeTokens[] = [
  {
    titulo: "Tipografia",
    tokens: [
      { nome: "--font-keybind", rotulo: "Atalho (fonte)" },
      { nome: "--font-size-xs", rotulo: "Tamanho minúsculo (fonte)" },
    ],
  },
  {
    titulo: "Superfícies",
    tokens: [
      {
        nome: "--color-surface-0",
        rotulo: "Fundo mais profundo",
        dica: "trilho de servidores",
        ligado: true,
      },
      {
        nome: "--color-surface-1",
        rotulo: "Barra lateral",
        dica: "lista de canais, configurações",
        ligado: true,
      },
      { nome: "--color-surface-2", rotulo: "Área da conversa", ligado: true },
      {
        nome: "--color-surface-3",
        rotulo: "Elevação leve",
        dica: "cartões, pastilhas",
        ligado: true,
      },
      {
        nome: "--color-surface-4",
        rotulo: "Elevação forte",
        dica: "menus, balões e dicas",
        ligado: true,
      },
      {
        nome: "--color-cabecalho",
        rotulo: "Barra do canal",
        dica: "a faixa com o nome do canal",
        ligado: true,
      },
      { nome: "--color-composer", rotulo: "Caixa de escrever", ligado: true },
      { nome: "--color-painel", rotulo: "Cartão da chamada", ligado: true },
      {
        nome: "--color-hover",
        rotulo: "Realce do mouse",
        dica: "aceita transparência",
        ligado: true,
      },
      {
        nome: "--color-selecionado",
        rotulo: "Item escolhido",
        dica: "canal aberto; aceita transparência",
        ligado: true,
      },
      {
        nome: "--skeleton-opacity-strong",
        rotulo: "Opacidade (esqueleto de carregamento) — forte",
      },
      {
        nome: "--skeleton-opacity-default",
        rotulo: "Opacidade (esqueleto de carregamento) — padrão",
      },
      {
        nome: "--skeleton-opacity-muted",
        rotulo: "Opacidade (esqueleto de carregamento) — apagado",
      },
      {
        nome: "--guilds-layout-item-bg",
        rotulo: "Fundo do layout item (servidores)",
      },
      {
        nome: "--guild-badge-surface",
        rotulo: "Selo do servidor",
        dica: "o fundo da bolinha de contagem",
      },
      {
        nome: "--surface-interactive-hover-bg",
        rotulo: "Superfície clicável no mouse",
      },
      {
        nome: "--surface-interactive-selected-bg",
        rotulo: "Superfície clicável escolhida",
      },
      {
        nome: "--surface-interactive-selected-color",
        rotulo: "Texto da superfície escolhida",
      },
      {
        nome: "--background-primary",
        rotulo: "Fundo mais profundo",
        dica: "atrás de tudo",
      },
      {
        nome: "--background-secondary",
        rotulo: "Barra lateral",
        dica: "lista de canais e trilho",
      },
      { nome: "--background-secondary-lighter", rotulo: "Área da conversa" },
      {
        nome: "--background-secondary-alt",
        rotulo: "Elevação leve",
        dica: "cartões e pastilhas",
      },
      {
        nome: "--background-tertiary",
        rotulo: "Elevação forte",
        dica: "menus, balões e dicas",
      },
      {
        nome: "--background-channel-header",
        rotulo: "Barra do canal",
        dica: "a faixa com o nome do canal",
      },
      { nome: "--background-header-secondary", rotulo: "Cabeçalho secundário" },
      { nome: "--background-header-primary", rotulo: "Cabeçalho" },
      { nome: "--background-textarea", rotulo: "Caixa de escrever" },
      {
        nome: "--background-header-primary-hover",
        rotulo: "Cabeçalho no mouse",
      },
      { nome: "--panel-control-bg", rotulo: "Cartão da chamada" },
      {
        nome: "--panel-control-divider",
        rotulo: "Divisória do cartão da chamada",
      },
      {
        nome: "--panel-control-highlight",
        rotulo: "Brilho do cartão da chamada",
      },
      {
        nome: "--background-modifier-hover",
        rotulo: "Realce do mouse",
        dica: "aceita transparência",
      },
      {
        nome: "--background-modifier-selected",
        rotulo: "Item escolhido",
        dica: "canal aberto; aceita transparência",
      },
      {
        nome: "--background-modifier-accent",
        rotulo: "Borda",
        dica: "contorno de cartão",
      },
      { nome: "--background-modifier-accent-focus", rotulo: "Borda em foco" },
      { nome: "--bg-primary", rotulo: "Principal (fundo)" },
      { nome: "--bg-secondary", rotulo: "Secundário (fundo)" },
      { nome: "--bg-tertiary", rotulo: "Terciário (fundo)" },
      { nome: "--bg-hover", rotulo: "Fundo — no mouse" },
      { nome: "--bg-active", rotulo: "Fundo — ativo" },
      { nome: "--bg-blockquote", rotulo: "Fundo da citação" },
    ],
  },
  {
    titulo: "Texto",
    tokens: [
      { nome: "--color-ink", rotulo: "Texto principal", ligado: true },
      { nome: "--color-ink-muted", rotulo: "Texto secundário", ligado: true },
      {
        nome: "--color-ink-faint",
        rotulo: "Texto apagado",
        dica: "horários, rótulos, dicas",
        ligado: true,
      },
      { nome: "--text-primary", rotulo: "Texto principal" },
      { nome: "--text-secondary", rotulo: "Texto secundário" },
      {
        nome: "--text-tertiary",
        rotulo: "Texto apagado",
        dica: "horários, rótulos, dicas",
      },
      { nome: "--text-link", rotulo: "Link" },
      { nome: "--text-tertiary-secondary", rotulo: "Texto apagado — variação" },
      { nome: "--text-tertiary-muted", rotulo: "Texto mais apagado ainda" },
      { nome: "--text-primary-muted", rotulo: "Texto principal apagado" },
      { nome: "--text-chat-muted", rotulo: "Texto apagado da conversa" },
      { nome: "--text-chat", rotulo: "Texto da conversa" },
    ],
  },
  {
    titulo: "Marca e realces",
    tokens: [
      { nome: "--color-brand", rotulo: "Marca", ligado: true },
      { nome: "--color-brand-hover", rotulo: "Marca no mouse", ligado: true },
      {
        nome: "--color-pilula",
        rotulo: "Barrinha do servidor ativo",
        ligado: true,
      },
      { nome: "--brand-primary", rotulo: "Marca" },
      { nome: "--brand-secondary", rotulo: "Marca no mouse" },
      { nome: "--brand-primary-light", rotulo: "Marca clara" },
      { nome: "--brand-primary-fill", rotulo: "Preenchimento sobre a marca" },
      {
        nome: "--plutonium",
        rotulo: "Assinatura",
        dica: "o equivalente ao Nitro",
      },
      { nome: "--plutonium-hover", rotulo: "Assinatura no mouse" },
      { nome: "--plutonium-text", rotulo: "Texto da assinatura" },
      { nome: "--plutonium-icon", rotulo: "Ícone da assinatura" },
      {
        nome: "--invite-verified-icon-color",
        rotulo: "Selo de convite verificado",
      },
      { nome: "--text-on-brand-primary", rotulo: "Texto sobre a marca" },
      { nome: "--accent-primary", rotulo: "Realce principal" },
      { nome: "--accent-success", rotulo: "Realce de sucesso" },
      { nome: "--accent-warning", rotulo: "Realce de atenção" },
      { nome: "--accent-danger", rotulo: "Realce de perigo" },
      { nome: "--accent-info", rotulo: "Realce de informação" },
      { nome: "--accent-purple", rotulo: "Realce roxo" },
    ],
  },
  {
    titulo: "Status",
    tokens: [
      { nome: "--color-online", rotulo: "Online", ligado: true },
      { nome: "--color-idle", rotulo: "Ausente", ligado: true },
      { nome: "--color-dnd", rotulo: "Não perturbe", ligado: true },
      {
        nome: "--color-danger",
        rotulo: "Perigo",
        dica: "excluir, sair, erro",
        ligado: true,
      },
      { nome: "--status-online", rotulo: "Online" },
      { nome: "--status-idle", rotulo: "Ausente" },
      { nome: "--status-dnd", rotulo: "Não perturbe" },
      { nome: "--status-offline", rotulo: "Offline" },
      {
        nome: "--status-danger",
        rotulo: "Perigo",
        dica: "excluir, sair, erro",
      },
      { nome: "--status-warning", rotulo: "Atenção" },
    ],
  },
  {
    titulo: "Botões",
    tokens: [
      {
        nome: "--control-button-normal-bg",
        rotulo: "Fundo do normal (botão de controle)",
      },
      {
        nome: "--control-button-normal-text",
        rotulo: "Cor do texto do normal (botão de controle)",
      },
      {
        nome: "--control-button-hover-bg",
        rotulo: "Fundo (botão de controle) — no mouse",
      },
      {
        nome: "--control-button-hover-text",
        rotulo: "Cor do texto (botão de controle) — no mouse",
      },
      {
        nome: "--control-button-active-bg",
        rotulo: "Fundo (botão de controle) — ativo",
      },
      {
        nome: "--control-button-active-text",
        rotulo: "Cor do texto (botão de controle) — ativo",
      },
      {
        nome: "--control-button-danger-text",
        rotulo: "Cor do texto do perigo (botão de controle)",
      },
      {
        nome: "--control-button-danger-hover-bg",
        rotulo: "Fundo do perigo (botão de controle) — no mouse",
      },
      { nome: "--interactive-muted", rotulo: "Ícone apagado" },
      { nome: "--interactive-active", rotulo: "Ícone aceso" },
      { nome: "--button-primary-fill", rotulo: "Botão principal" },
      {
        nome: "--button-primary-active-fill",
        rotulo: "Botão principal pressionado",
      },
      { nome: "--button-primary-text", rotulo: "Texto do botão principal" },
      { nome: "--button-secondary-fill", rotulo: "Botão secundário" },
      {
        nome: "--button-secondary-active-fill",
        rotulo: "Botão secundário pressionado",
      },
      { nome: "--button-secondary-text", rotulo: "Texto do botão secundário" },
      {
        nome: "--button-secondary-active-text",
        rotulo: "Texto do botão secundário pressionado",
      },
      { nome: "--button-danger-fill", rotulo: "Botão de perigo" },
      {
        nome: "--button-danger-active-fill",
        rotulo: "Botão de perigo pressionado",
      },
      { nome: "--button-danger-text", rotulo: "Texto do botão de perigo" },
      {
        nome: "--button-danger-outline-border",
        rotulo: "Contorno do botão de perigo vazado",
      },
      {
        nome: "--button-danger-outline-text",
        rotulo: "Texto do botão de perigo vazado",
      },
      {
        nome: "--button-danger-outline-active-fill",
        rotulo: "Botão de perigo vazado pressionado",
      },
      {
        nome: "--button-danger-outline-active-border",
        rotulo: "Contorno do perigo vazado pressionado",
      },
      { nome: "--button-ghost-text", rotulo: "Texto do botão sem fundo" },
      { nome: "--button-inverted-fill", rotulo: "Botão invertido" },
      { nome: "--button-inverted-text", rotulo: "Texto do botão invertido" },
      { nome: "--button-outline-border", rotulo: "Contorno do botão vazado" },
      { nome: "--button-outline-text", rotulo: "Texto do botão vazado" },
      {
        nome: "--button-outline-active-fill",
        rotulo: "Botão vazado pressionado",
      },
      {
        nome: "--button-outline-active-border",
        rotulo: "Contorno do botão vazado pressionado",
      },
    ],
  },
  {
    titulo: "Bordas e foco",
    tokens: [
      {
        nome: "--color-line",
        rotulo: "Borda",
        dica: "contorno de cartão",
        ligado: true,
      },
      {
        nome: "--color-divisor",
        rotulo: "Divisória",
        dica: "entre painéis; aceita transparência",
        ligado: true,
      },
      { nome: "--radius-sm", rotulo: "Pequeno (canto)", ligado: true },
      { nome: "--radius-md", rotulo: "Médio (canto)", ligado: true },
      { nome: "--radius-lg", rotulo: "Grande (canto)", ligado: true },
      { nome: "--radius-xl", rotulo: "Extra grande (canto)", ligado: true },
      { nome: "--radius-2xl", rotulo: "Enorme (canto)", ligado: true },
      { nome: "--radius-full", rotulo: "Total (canto)", ligado: true },
      { nome: "--footer-box-radius", rotulo: "Canto (rodapé da conversa)" },
      {
        nome: "--outline-frame-border-width",
        rotulo: "Espessura da borda (moldura)",
      },
      { nome: "--folder-radius", rotulo: "Canto (pasta)" },
      {
        nome: "--outline-frame-radius-native",
        rotulo: "Canto native (moldura)",
      },
      {
        nome: "--floating-surface-ring-color",
        rotulo: "Cor do anel (superfície flutuante)",
      },
      {
        nome: "--floating-surface-ring-color-strong",
        rotulo: "Anel cor (superfície flutuante) — forte",
      },
      {
        nome: "--skeleton-chrome-border-color",
        rotulo: "Cor da borda da moldura (esqueleto de carregamento)",
      },
      {
        nome: "--skeleton-chrome-border",
        rotulo: "Borda da moldura (esqueleto de carregamento)",
      },
      {
        nome: "--friend-row-separator-radius",
        rotulo: "Canto do separador (linha de amigo)",
      },
      {
        nome: "--active-now-card-radius",
        rotulo: "Canto do cartão (ativos agora)",
      },
      {
        nome: "--active-now-action-radius",
        rotulo: "Canto da ação (ativos agora)",
      },
      {
        nome: "--message-preview-card-border",
        rotulo: "Borda da prévia cartão (mensagem)",
      },
      {
        nome: "--focus-primary",
        rotulo: "Anel de foco",
        dica: "o contorno de quem navega por teclado",
      },
      { nome: "--border-color", rotulo: "Cor da borda" },
      { nome: "--panel-control-border", rotulo: "Borda do cartão da chamada" },
      { nome: "--theme-border", rotulo: "Borda do tema" },
      { nome: "--theme-border-width", rotulo: "Espessura da borda do tema" },
      { nome: "--border-color-hover", rotulo: "Borda no mouse" },
      { nome: "--border-color-focus", rotulo: "Borda em foco" },
      {
        nome: "--message-reply-spine-radius",
        rotulo: "Canto do resposta fio (mensagem)",
      },
    ],
  },
  {
    titulo: "Avisos",
    tokens: [
      { nome: "--color-aviso", rotulo: "Atenção", ligado: true },
      { nome: "--text-warning", rotulo: "Texto de atenção" },
      { nome: "--alert-note-color", rotulo: "Aviso — nota" },
      { nome: "--alert-tip-color", rotulo: "Aviso — dica" },
      { nome: "--alert-important-color", rotulo: "Aviso — importante" },
      { nome: "--alert-warning-color", rotulo: "Aviso — atenção" },
      { nome: "--alert-caution-color", rotulo: "Aviso — cuidado" },
    ],
  },
  {
    titulo: "Marcação e menções",
    tokens: [
      { nome: "--color-link", rotulo: "Link", ligado: true },
      { nome: "--color-mencao", rotulo: "Menção a você", ligado: true },
      { nome: "--color-everyone", rotulo: "Menção a @everyone", ligado: true },
      { nome: "--color-here", rotulo: "Menção a @here", ligado: true },
      {
        nome: "--mention-badge-small-size",
        rotulo: "Tamanho do small (selo de menção)",
      },
      {
        nome: "--mention-badge-medium-size",
        rotulo: "Tamanho do medium (selo de menção)",
      },
      { nome: "--spoiler-border-radius", rotulo: "Canto do spoiler" },
      {
        nome: "--markup-restricted-inline-icon-baseline-shift",
        rotulo:
          "Deslocamento do restrito horizontal ícone linha de base (marcação)",
      },
      {
        nome: "--markup-restricted-inline-emoji-size",
        rotulo: "Tamanho do restrito horizontal emoji (marcação)",
      },
      {
        nome: "--markup-restricted-inline-emoji-baseline-shift",
        rotulo:
          "Deslocamento do restrito horizontal emoji linha de base (marcação)",
      },
      {
        nome: "--text-selection",
        rotulo: "Seleção de texto",
        dica: "o que fica marcado ao arrastar",
      },
      { nome: "--markup-mention-text", rotulo: "Menção a você" },
      { nome: "--markup-mention-fill", rotulo: "Fundo da menção" },
      { nome: "--markup-mention-border", rotulo: "Borda da menção" },
      {
        nome: "--markup-jump-link-text",
        rotulo: "Link de pular para a mensagem",
      },
      { nome: "--markup-jump-link-fill", rotulo: "Fundo do link de pular" },
      {
        nome: "--markup-jump-link-hover-fill",
        rotulo: "Fundo do link de pular no mouse",
      },
      { nome: "--markup-everyone-text", rotulo: "Menção a @everyone" },
      { nome: "--markup-everyone-fill", rotulo: "Fundo do @everyone" },
      { nome: "--markup-everyone-border", rotulo: "Borda do @everyone" },
      { nome: "--markup-here-text", rotulo: "Menção a @here" },
      { nome: "--markup-here-fill", rotulo: "Fundo do @here" },
      { nome: "--markup-here-border", rotulo: "Borda do @here" },
      {
        nome: "--markup-interactive-hover-text",
        rotulo: "Marcação clicável no mouse",
      },
      {
        nome: "--markup-interactive-hover-fill",
        rotulo: "Fundo da marcação clicável",
      },
      { nome: "--spoiler-overlay-color", rotulo: "Cobertura do spoiler" },
      {
        nome: "--spoiler-overlay-hover-color",
        rotulo: "Cobertura do spoiler no mouse",
      },
    ],
  },
  {
    titulo: "Código e terminal",
    tokens: [
      { nome: "--color-codigo", rotulo: "Código na linha", ligado: true },
      { nome: "--color-codigo-bloco", rotulo: "Bloco de código", ligado: true },
      { nome: "--code-text", rotulo: "Texto do código" },
      { nome: "--text-code", rotulo: "Texto do código" },
      { nome: "--code-muted", rotulo: "Comentário no código" },
      { nome: "--code-inline-bg", rotulo: "Código na linha" },
      { nome: "--bg-code", rotulo: "Fundo do código na linha" },
      { nome: "--code-block-bg", rotulo: "Bloco de código" },
      { nome: "--bg-code-block", rotulo: "Fundo do bloco de código" },
      { nome: "--code-block-border", rotulo: "Borda do bloco de código" },
      { nome: "--code-block-highlight", rotulo: "Linha destacada no bloco" },
      {
        nome: "--ansi-inverse-text",
        rotulo: "Cor do texto do invertido (ansi)",
      },
      { nome: "--ansi-inverse-bg", rotulo: "Fundo do invertido (ansi)" },
      { nome: "--ansi-fg-black", rotulo: "Preto (ansi)" },
      { nome: "--ansi-fg-red", rotulo: "Vermelho (ansi)" },
      { nome: "--ansi-fg-green", rotulo: "Verde (ansi)" },
      { nome: "--ansi-fg-yellow", rotulo: "Amarelo (ansi)" },
      { nome: "--ansi-fg-blue", rotulo: "Azul (ansi)" },
      { nome: "--ansi-fg-magenta", rotulo: "Magenta (ansi)" },
      { nome: "--ansi-fg-cyan", rotulo: "Ciano (ansi)" },
      { nome: "--ansi-fg-white", rotulo: "Branco (ansi)" },
      { nome: "--ansi-fg-bright-black", rotulo: "Preto (ansi vivo)" },
      { nome: "--ansi-fg-bright-red", rotulo: "Vermelho (ansi vivo)" },
      { nome: "--ansi-fg-bright-green", rotulo: "Verde (ansi vivo)" },
      { nome: "--ansi-fg-bright-yellow", rotulo: "Amarelo (ansi vivo)" },
      { nome: "--ansi-fg-bright-blue", rotulo: "Azul (ansi vivo)" },
      { nome: "--ansi-fg-bright-magenta", rotulo: "Magenta (ansi vivo)" },
      { nome: "--ansi-fg-bright-cyan", rotulo: "Ciano (ansi vivo)" },
      { nome: "--ansi-fg-bright-white", rotulo: "Branco (ansi vivo)" },
      { nome: "--ansi-bg-black", rotulo: "Preto (ansi fundo)" },
      { nome: "--ansi-bg-red", rotulo: "Vermelho (ansi fundo)" },
      { nome: "--ansi-bg-green", rotulo: "Verde (ansi fundo)" },
      { nome: "--ansi-bg-yellow", rotulo: "Amarelo (ansi fundo)" },
      { nome: "--ansi-bg-blue", rotulo: "Azul (ansi fundo)" },
      { nome: "--ansi-bg-magenta", rotulo: "Magenta (ansi fundo)" },
      { nome: "--ansi-bg-cyan", rotulo: "Ciano (ansi fundo)" },
      { nome: "--ansi-bg-white", rotulo: "Branco (ansi fundo)" },
      { nome: "--ansi-bg-bright-black", rotulo: "Preto (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-red", rotulo: "Vermelho (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-green", rotulo: "Verde (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-yellow", rotulo: "Amarelo (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-blue", rotulo: "Azul (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-magenta", rotulo: "Magenta (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-cyan", rotulo: "Ciano (ansi fundo vivo)" },
      { nome: "--ansi-bg-bright-white", rotulo: "Branco (ansi fundo vivo)" },
    ],
  },
  {
    titulo: "Tabelas",
    tokens: [
      {
        nome: "--guild-members-columns-selectable",
        rotulo: "Colunas selecionável (tabela de membros)",
      },
      {
        nome: "--guild-members-min-width-selectable",
        rotulo: "Mínimo largura selecionável (tabela de membros)",
      },
      {
        nome: "--guild-members-table-row-min-height",
        rotulo: "Altura mínima da tabela linha (tabela de membros)",
      },
      {
        nome: "--guild-members-table-row-border-width",
        rotulo: "Espessura da borda da tabela linha (tabela de membros)",
      },
      { nome: "--bg-table-header", rotulo: "Cabeçalho da tabela" },
      { nome: "--bg-table-row-odd", rotulo: "Linha ímpar da tabela" },
      { nome: "--bg-table-row-even", rotulo: "Linha par da tabela" },
      {
        nome: "--message-compact-table-max-inline-size",
        rotulo: "Tamanho da tabela máximo horizontal (mensagem compacta)",
      },
      {
        nome: "--message-compact-table-min-cell-width",
        rotulo: "Largura da tabela mínimo célula (mensagem compacta)",
      },
    ],
  },
  {
    titulo: "Mensagens",
    tokens: [
      {
        nome: "--color-destaque",
        rotulo: "Fio de quem te menciona",
        ligado: true,
      },
      {
        nome: "--color-destaque-fundo",
        rotulo: "Fundo de quem te menciona",
        dica: "aceita transparência",
        ligado: true,
      },
      {
        nome: "--color-resposta",
        rotulo: "Resposta",
        dica: "o fio da citação",
        ligado: true,
      },
      {
        nome: "--message-compact-horizontal-padding",
        rotulo: "Recuo do horizontal (mensagem compacta)",
      },
      { nome: "--messages-bottom-clearance", rotulo: "Messages da base folga" },
      {
        nome: "--typing-indicator-height",
        rotulo: "Altura do indicador (digitando)",
      },
      {
        nome: "--typing-pill-height",
        rotulo: "Altura da pastilha (digitando)",
      },
      {
        nome: "--slowmode-indicator-height",
        rotulo: "Altura do indicador (modo lento)",
      },
      {
        nome: "--message-filler-padding-bottom",
        rotulo: "Recuo na base do preenchedor (mensagem)",
      },
      { nome: "--typing-avatar-size", rotulo: "Tamanho do avatar (digitando)" },
      {
        nome: "--typing-indicator-animation-size",
        rotulo: "Tamanho do indicador animação (digitando)",
      },
      {
        nome: "--typing-indicator-gap",
        rotulo: "Espaço do indicador (digitando)",
      },
      {
        nome: "--message-compact-text-indent-from-username",
        rotulo: "Texto indent from nome (mensagem compacta)",
      },
      {
        nome: "--message-search-bar-width",
        rotulo: "Largura da busca barra (mensagem)",
      },
      {
        nome: "--message-search-bar-height",
        rotulo: "Altura da busca barra (mensagem)",
      },
      {
        nome: "--message-search-bar-icon-size",
        rotulo: "Tamanho do ícone da busca barra (mensagem)",
      },
      {
        nome: "--message-search-bar-icon-gap",
        rotulo: "Espaço da busca barra ícone (mensagem)",
      },
      {
        nome: "--message-preview-card-background",
        rotulo: "Fundo da prévia cartão (mensagem)",
      },
      {
        nome: "--message-preview-card-divider",
        rotulo: "Prévia cartão divisória (mensagem)",
      },
      { nome: "--message-avatar-size", rotulo: "Tamanho do avatar (mensagem)" },
      {
        nome: "--message-avatar-size-compact",
        rotulo: "Avatar tamanho (mensagem) — compacto",
      },
      { nome: "--message-gutter", rotulo: "Calha (mensagem)" },
      {
        nome: "--message-spacing-y",
        rotulo: "Espaçamento vertical (mensagem)",
      },
      { nome: "--message-line-height", rotulo: "Altura da linha (mensagem)" },
      {
        nome: "--message-timestamp-font-size",
        rotulo: "Tamanho da fonte do horário (mensagem)",
      },
      {
        nome: "--message-timestamp-compact-font-size",
        rotulo: "Tamanho da fonte do horário (mensagem) — compacto",
      },
      {
        nome: "--message-timestamp-compact-height",
        rotulo: "Altura do horário (mensagem) — compacto",
      },
      {
        nome: "--message-compact-timestamp-width",
        rotulo: "Largura do horário (mensagem compacta)",
      },
      { nome: "--message-compact-gap", rotulo: "Espaço (mensagem compacta)" },
      {
        nome: "--message-compact-indent",
        rotulo: "Indent (mensagem compacta)",
      },
      {
        nome: "--message-compact-username-gap",
        rotulo: "Espaço do nome (mensagem compacta)",
      },
      {
        nome: "--message-compact-container-margin",
        rotulo: "Margem da caixa (mensagem compacta)",
      },
      {
        nome: "--message-compact-markdown-block-gap",
        rotulo: "Espaço do markdown bloco (mensagem compacta)",
      },
      {
        nome: "--message-compact-markdown-blockquote-gap",
        rotulo: "Espaço do markdown citação (mensagem compacta)",
      },
      {
        nome: "--message-compact-markdown-blockquote-divider-margin-end",
        rotulo: "Markdown citação divisória margem no fim (mensagem compacta)",
      },
      {
        nome: "--message-compact-markdown-alert-padding-inline",
        rotulo: "Recuo horizontal do markdown alert (mensagem compacta)",
      },
      {
        nome: "--message-compact-markdown-alert-padding-block",
        rotulo: "Recuo vertical do markdown alert (mensagem compacta)",
      },
      {
        nome: "--system-message-icon-size",
        rotulo: "Tamanho do ícone (mensagem do sistema)",
      },
      {
        nome: "--message-reply-spacing",
        rotulo: "Espaçamento do resposta (mensagem)",
      },
      {
        nome: "--message-reply-height",
        rotulo: "Altura do resposta (mensagem)",
      },
      {
        nome: "--message-reply-font-size",
        rotulo: "Tamanho da fonte do resposta (mensagem)",
      },
      {
        nome: "--message-reply-spine-width",
        rotulo: "Largura do resposta fio (mensagem)",
      },
      { nome: "--message-container-gap", rotulo: "Espaço da caixa (mensagem)" },
      {
        nome: "--message-container-padding-y",
        rotulo: "Recuo vertical da caixa (mensagem)",
      },
      {
        nome: "--message-edited-font-size",
        rotulo: "Tamanho da fonte do editada (mensagem)",
      },
      {
        nome: "--message-edited-label-font-size",
        rotulo: "Tamanho da fonte do editada rótulo (mensagem)",
      },
      {
        nome: "--message-mobile-margin",
        rotulo: "Margem (mensagem) — no celular",
      },
      {
        nome: "--message-action-bar-offset",
        rotulo: "Deslocamento da ação barra (mensagem)",
      },
      {
        nome: "--message-icon-size-sm",
        rotulo: "Ícone tamanho pequeno (mensagem)",
      },
      {
        nome: "--message-icon-size-md",
        rotulo: "Ícone tamanho médio (mensagem)",
      },
      {
        nome: "--message-icon-size-lg",
        rotulo: "Ícone tamanho grande (mensagem)",
      },
      {
        nome: "--message-failed-indicator-gap",
        rotulo: "Espaço do que falhou indicador (mensagem)",
      },
      {
        nome: "--message-failed-indicator-font-size",
        rotulo: "Tamanho da fonte do que falhou indicador (mensagem)",
      },
      {
        nome: "--message-typing-gap",
        rotulo: "Espaço (digitando na mensagem)",
      },
      {
        nome: "--message-typing-pill-gap",
        rotulo: "Espaço da pastilha (digitando na mensagem)",
      },
      {
        nome: "--message-typing-pill-padding",
        rotulo: "Recuo da pastilha (digitando na mensagem)",
      },
      {
        nome: "--message-typing-avatar-margin",
        rotulo: "Margem do avatar (digitando na mensagem)",
      },
      {
        nome: "--message-typing-text-font-size",
        rotulo: "Tamanho da fonte do texto (digitando na mensagem)",
      },
      {
        nome: "--message-avatar-align-offset",
        rotulo: "Deslocamento do avatar align (mensagem)",
      },
      { nome: "--message-timestamp-color", rotulo: "Cor do horário" },
      {
        nome: "--system-message-icon-opacity",
        rotulo: "Opacidade do ícone (mensagem do sistema)",
      },
      {
        nome: "--message-highlight-bar-width",
        rotulo: "Largura do destaque barra (mensagem)",
      },
      { nome: "--message-mention-color", rotulo: "Fio de quem te menciona" },
      { nome: "--message-mention-bg", rotulo: "Fundo de quem te menciona" },
      {
        nome: "--message-mention-bg-hover",
        rotulo: "Fundo de quem te menciona, no mouse",
      },
      { nome: "--message-reply-color", rotulo: "Fio da resposta" },
      { nome: "--message-reply-bg", rotulo: "Fundo da resposta" },
      {
        nome: "--message-sending-opacity",
        rotulo: "Opacidade do enviando (mensagem)",
      },
      {
        nome: "--message-sending-link-opacity",
        rotulo: "Opacidade do enviando link (mensagem)",
      },
      {
        nome: "--message-failed-opacity",
        rotulo: "Opacidade do que falhou (mensagem)",
      },
      {
        nome: "--message-replied-username-opacity",
        rotulo: "Opacidade do respondida nome (mensagem)",
      },
      {
        nome: "--message-unknown-warning-color",
        rotulo: "Aviso de mensagem desconhecida",
      },
      {
        nome: "--message-transition-highlight",
        rotulo: "Transition destaque (mensagem)",
      },
    ],
  },
  {
    titulo: "Formulários",
    tokens: [
      { nome: "--color-campo", rotulo: "Campo", ligado: true },
      { nome: "--color-campo-foco", rotulo: "Campo em foco", ligado: true },
      {
        nome: "--color-trilho",
        rotulo: "Trilho da régua",
        dica: "o trecho ainda não preenchido",
        ligado: true,
      },
      { nome: "--input-container-padding", rotulo: "Recuo da caixa (campo)" },
      {
        nome: "--input-wrapper-padding-x",
        rotulo: "Recuo horizontal do envoltório (campo)",
      },
      {
        nome: "--input-wrapper-padding-bottom",
        rotulo: "Recuo na base do envoltório (campo)",
      },
      {
        nome: "--textarea-top-bar-height",
        rotulo: "Altura do do topo barra (caixa de texto)",
      },
      {
        nome: "--textarea-font-size",
        rotulo: "Tamanho da fonte (caixa de texto)",
      },
      {
        nome: "--textarea-button-height",
        rotulo: "Altura do button (caixa de texto)",
      },
      {
        nome: "--textarea-button-icon-size",
        rotulo: "Tamanho do ícone do button (caixa de texto)",
      },
      {
        nome: "--textarea-button-compact-height",
        rotulo: "Altura do button (caixa de texto) — compacto",
      },
      {
        nome: "--textarea-button-compact-icon-size",
        rotulo: "Tamanho do ícone do button (caixa de texto) — compacto",
      },
      {
        nome: "--textarea-container-padding-x",
        rotulo: "Recuo horizontal da caixa (caixa de texto)",
      },
      {
        nome: "--textarea-line-height",
        rotulo: "Altura da linha (caixa de texto)",
      },
      {
        nome: "--textarea-content-offset",
        rotulo: "Deslocamento do conteúdo (caixa de texto)",
      },
      {
        nome: "--textarea-upload-gap",
        rotulo: "Espaço do envio (caixa de texto)",
      },
      {
        nome: "--textarea-side-button-padding",
        rotulo: "Recuo do lateral button (caixa de texto)",
      },
      { nome: "--footer-box-height", rotulo: "Altura (rodapé da conversa)" },
      { nome: "--footer-box-inset", rotulo: "Recuo (rodapé da conversa)" },
      {
        nome: "--footer-box-inset-inline",
        rotulo: "Recuo horizontal (rodapé da conversa)",
      },
      {
        nome: "--footer-box-inner-inset",
        rotulo: "Recuo interno (rodapé da conversa)",
      },
      {
        nome: "--composer-mobile-box-height",
        rotulo: "Altura da caixa (caixa de escrever) — no celular",
      },
      {
        nome: "--composer-action-gap",
        rotulo: "Espaço da ação (caixa de escrever)",
      },
      {
        nome: "--composer-surface-color",
        rotulo: "Fundo da caixa de escrever",
      },
      {
        nome: "--composer-status-line-height",
        rotulo: "Altura da linha do status (caixa de escrever)",
      },
      {
        nome: "--composer-status-safe-gap",
        rotulo: "Espaço do status seguro (caixa de escrever)",
      },
      {
        nome: "--composer-status-safe-area",
        rotulo: "Status seguro área (caixa de escrever)",
      },
      {
        nome: "--footer-box-padding-y",
        rotulo: "Recuo vertical (rodapé da conversa)",
      },
      {
        nome: "--composer-mobile-padding-y",
        rotulo: "Recuo vertical (caixa de escrever) — no celular",
      },
      { nome: "--footer-row-height", rotulo: "Altura da linha (rodapé)" },
      {
        nome: "--input-container-min-height",
        rotulo: "Altura mínima da caixa (campo)",
      },
      {
        nome: "--textarea-min-height",
        rotulo: "Altura mínima (caixa de texto)",
      },
      {
        nome: "--textarea-padding-y",
        rotulo: "Recuo vertical (caixa de texto)",
      },
      {
        nome: "--composer-box-inset",
        rotulo: "Recuo da caixa (caixa de escrever)",
      },
      {
        nome: "--composer-box-inset-inline",
        rotulo: "Recuo horizontal da caixa (caixa de escrever)",
      },
      {
        nome: "--composer-box-padding-inline",
        rotulo: "Recuo horizontal da caixa (caixa de escrever)",
      },
      { nome: "--form-surface-background", rotulo: "Fundo do formulário" },
    ],
  },
  {
    titulo: "Layout",
    tokens: [
      {
        nome: "--native-titlebar-height",
        rotulo: "Altura do faixa de título (nativo)",
      },
      {
        nome: "--macos-traffic-light-inset",
        rotulo: "Recuo do semáforo do semáforo (macos)",
      },
      {
        nome: "--list-row-min-height",
        rotulo: "Altura mínima (linha da lista)",
      },
      {
        nome: "--chat-horizontal-padding-default",
        rotulo: "Horizontal recuo (conversa) — padrão",
      },
      {
        nome: "--guild-list-item-box-size",
        rotulo: "Tamanho do item caixa (trilho de servidores)",
      },
      {
        nome: "--guild-list-item-gap",
        rotulo: "Espaço do item (trilho de servidores)",
      },
      {
        nome: "--guild-list-item-target-size",
        rotulo: "Tamanho do item alvo (trilho de servidores)",
      },
      {
        nome: "--guild-list-item-target-half-extra",
        rotulo: "Item alvo metade extra (trilho de servidores)",
      },
      {
        nome: "--guild-folder-expanded-surface-size",
        rotulo: "Tamanho do aberta surface (pasta de servidores)",
      },
      {
        nome: "--guild-list-divider-line-size",
        rotulo: "Espessura da linha da divisória (trilho de servidores)",
      },
      {
        nome: "--guild-list-divider-base-gap",
        rotulo: "Espaço da divisória base (trilho de servidores)",
      },
      {
        nome: "--guild-members-columns",
        rotulo: "Colunas (tabela de membros)",
      },
      {
        nome: "--guild-members-min-width",
        rotulo: "Largura mínima (tabela de membros)",
      },
      {
        nome: "--guild-members-select-column-width",
        rotulo: "Largura da seleção coluna (tabela de membros)",
      },
      { nome: "--spacing-0", rotulo: "0 (espaçamento)" },
      { nome: "--spacing-1", rotulo: "1 (espaçamento)" },
      { nome: "--spacing-1-5", rotulo: "1 5 (espaçamento)" },
      { nome: "--spacing-2", rotulo: "2 (espaçamento)" },
      { nome: "--spacing-3", rotulo: "3 (espaçamento)" },
      { nome: "--spacing-4", rotulo: "4 (espaçamento)" },
      { nome: "--spacing-5", rotulo: "5 (espaçamento)" },
      { nome: "--spacing-6", rotulo: "6 (espaçamento)" },
      { nome: "--spacing-8", rotulo: "8 (espaçamento)" },
      { nome: "--spacing-10", rotulo: "10 (espaçamento)" },
      { nome: "--spacing-12", rotulo: "12 (espaçamento)" },
      { nome: "--spacing-16", rotulo: "16 (espaçamento)" },
      { nome: "--spacing-20", rotulo: "20 (espaçamento)" },
      { nome: "--spacing-24", rotulo: "24 (espaçamento)" },
      {
        nome: "--layout-guild-list-width",
        rotulo: "Largura do guild lista (layout)",
        ligado: true,
      },
      {
        nome: "--layout-sidebar-width",
        rotulo: "Largura da barra lateral (layout)",
      },
      {
        nome: "--layout-header-height",
        rotulo: "Altura do cabeçalho (layout)",
      },
      {
        nome: "--layout-user-area-height",
        rotulo: "Altura do user área (layout)",
      },
      {
        nome: "--layout-user-area-reserved-height",
        rotulo: "Altura do user área reservado (layout)",
      },
      {
        nome: "--layout-voice-connection-height",
        rotulo: "Altura do voz conexão (layout)",
      },
      {
        nome: "--layout-mobile-bottom-nav-reserved-height",
        rotulo: "Altura do da base navegação reservado (layout) — no celular",
      },
      {
        nome: "--user-area-box-inset-block-end",
        rotulo: "Caixa recuo bloco no fim (área do usuário)",
      },
      {
        nome: "--user-area-content-height",
        rotulo: "Altura do conteúdo (área do usuário)",
      },
      {
        nome: "--user-area-padding-y",
        rotulo: "Recuo vertical (área do usuário)",
      },
      {
        nome: "--user-area-padding-x",
        rotulo: "Recuo horizontal (área do usuário)",
      },
      {
        nome: "--user-area-avatar-lead",
        rotulo: "Avatar avanço (área do usuário)",
      },
      {
        nome: "--voice-connection-padding-y",
        rotulo: "Recuo vertical (barra de voz)",
      },
      {
        nome: "--voice-connection-padding-x",
        rotulo: "Recuo horizontal (barra de voz)",
      },
      {
        nome: "--layout-header-popout-width",
        rotulo: "Largura do cabeçalho balão (layout)",
      },
      { nome: "--layout-gap", rotulo: "Espaço (layout)" },
      { nome: "--layout-gap-sm", rotulo: "Espaço pequeno (layout)" },
      { nome: "--layout-gap-lg", rotulo: "Espaço grande (layout)" },
      { nome: "--content-padding", rotulo: "Recuo (conteúdo)" },
      { nome: "--content-padding-sm", rotulo: "Recuo pequeno (conteúdo)" },
      { nome: "--content-padding-lg", rotulo: "Recuo grande (conteúdo)" },
      { nome: "--guild-icon-size", rotulo: "Tamanho do ícone (servidor)" },
      { nome: "--guild-icon-gap", rotulo: "Espaço do ícone (servidor)" },
      {
        nome: "--mobile-bottom-nav-height",
        rotulo: "Altura do da base navegação (celular)",
      },
      {
        nome: "--layout-member-list-width",
        rotulo: "Largura do member lista (layout)",
      },
      {
        nome: "--layout-header-height-mobile",
        rotulo: "Cabeçalho altura (layout) — no celular",
      },
      { nome: "--channel-header-gap", rotulo: "Espaço (cabeçalho do canal)" },
      {
        nome: "--channel-header-padding-inline",
        rotulo: "Recuo horizontal (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-action-size",
        rotulo: "Tamanho da ação (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-action-size-mobile",
        rotulo: "Ação tamanho (cabeçalho do canal) — no celular",
      },
      {
        nome: "--channel-header-actions-gap",
        rotulo: "Espaço do actions (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-back-button-size",
        rotulo: "Tamanho do voltar button (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-back-button-gap",
        rotulo: "Espaço do voltar button (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-icon-size",
        rotulo: "Tamanho do ícone (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-back-icon-size",
        rotulo: "Tamanho do ícone do voltar (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-caret-size",
        rotulo: "Tamanho da seta (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-action-icon-size",
        rotulo: "Tamanho do ícone da ação (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-name-gap",
        rotulo: "Espaço do nome (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-name-gap-group-dm",
        rotulo: "Nome espaço grupo privado (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-caret-gap",
        rotulo: "Espaço da seta (cabeçalho do canal)",
      },
      {
        nome: "--channel-header-topic-divider-gap",
        rotulo: "Espaço do assunto divisória (cabeçalho do canal)",
      },
      {
        nome: "--chat-mobile-horizontal-padding",
        rotulo: "Recuo do horizontal (conversa) — no celular",
      },
      {
        nome: "--dm-sidebar-mobile-header-height",
        rotulo: "Altura do cabeçalho (barra do privado) — no celular",
      },
      {
        nome: "--member-list-item-content-height",
        rotulo: "Altura do item conteúdo (lista de membros)",
      },
      {
        nome: "--member-list-item-padding-block",
        rotulo: "Recuo vertical do item (lista de membros)",
      },
      {
        nome: "--member-list-item-padding-inline",
        rotulo: "Recuo horizontal do item (lista de membros)",
      },
      {
        nome: "--member-list-item-content-gap",
        rotulo: "Espaço do conteúdo do item (lista de membros)",
      },
      {
        nome: "--member-list-item-name-line-height",
        rotulo: "Altura da linha do item nome (lista de membros)",
      },
      {
        nome: "--member-list-item-status-line-height",
        rotulo: "Altura da linha do item status (lista de membros)",
      },
      {
        nome: "--member-list-row-gap",
        rotulo: "Espaço entre linhas (lista de membros)",
      },
      {
        nome: "--member-list-group-spacer-height",
        rotulo: "Altura do grupo espaçador (lista de membros)",
      },
      {
        nome: "--member-list-scroller-padding-block-start",
        rotulo: "Recuo no topo do scroller (lista de membros)",
      },
      {
        nome: "--member-list-scroller-padding-block-end",
        rotulo: "Recuo na base do scroller (lista de membros)",
      },
      {
        nome: "--member-list-scroller-padding-inline",
        rotulo: "Recuo horizontal do scroller (lista de membros)",
      },
      {
        nome: "--friend-row-padding-block",
        rotulo: "Recuo vertical (linha de amigo)",
      },
      {
        nome: "--friend-row-padding-inline",
        rotulo: "Recuo horizontal (linha de amigo)",
      },
      {
        nome: "--friend-row-separator-inset",
        rotulo: "Recuo do separador (linha de amigo)",
      },
      {
        nome: "--friend-row-content-gap",
        rotulo: "Espaço do conteúdo (linha de amigo)",
      },
      {
        nome: "--friend-row-name-line-height",
        rotulo: "Altura da linha do nome (linha de amigo)",
      },
      {
        nome: "--friend-row-subtext-line-height",
        rotulo: "Altura da linha do subtexto (linha de amigo)",
      },
      {
        nome: "--friend-row-subtext-offset",
        rotulo: "Deslocamento do subtexto (linha de amigo)",
      },
      {
        nome: "--friend-row-avatar-size",
        rotulo: "Tamanho do avatar (linha de amigo)",
      },
      {
        nome: "--friend-row-action-size",
        rotulo: "Tamanho da ação (linha de amigo)",
      },
      {
        nome: "--friend-row-action-gap",
        rotulo: "Espaço da ação (linha de amigo)",
      },
      {
        nome: "--avatar-stack-extra-height",
        rotulo: "Altura do extra (pilha de avatares)",
      },
      {
        nome: "--active-now-sidebar-width",
        rotulo: "Largura da barra lateral (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-header-padding-inline",
        rotulo: "Recuo horizontal da barra lateral cabeçalho (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-header-padding-block-start",
        rotulo: "Recuo no topo da barra lateral cabeçalho (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-header-padding-block-end",
        rotulo: "Recuo na base da barra lateral cabeçalho (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-content-gap",
        rotulo: "Espaço do conteúdo da barra lateral (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-content-padding-inline",
        rotulo: "Recuo horizontal da barra lateral conteúdo (ativos agora)",
      },
      {
        nome: "--active-now-sidebar-content-padding-block-end",
        rotulo: "Recuo na base da barra lateral conteúdo (ativos agora)",
      },
      {
        nome: "--active-now-card-gap",
        rotulo: "Espaço do cartão (ativos agora)",
      },
      {
        nome: "--active-now-card-padding-block",
        rotulo: "Recuo vertical do cartão (ativos agora)",
      },
      {
        nome: "--active-now-card-padding-inline",
        rotulo: "Recuo horizontal do cartão (ativos agora)",
      },
      {
        nome: "--active-now-card-shadow",
        rotulo: "Cartão shadow (ativos agora)",
      },
      {
        nome: "--active-now-context-gap",
        rotulo: "Espaço do contexto (ativos agora)",
      },
      {
        nome: "--active-now-action-height",
        rotulo: "Altura da ação (ativos agora)",
      },
      {
        nome: "--active-now-action-gap",
        rotulo: "Espaço da ação (ativos agora)",
      },
      {
        nome: "--active-now-action-padding-block",
        rotulo: "Recuo vertical da ação (ativos agora)",
      },
      {
        nome: "--active-now-action-padding-inline",
        rotulo: "Recuo horizontal da ação (ativos agora)",
      },
      {
        nome: "--discovery-card-description-min-height",
        rotulo: "Altura mínima do cartão descrição (descoberta)",
      },
      {
        nome: "--guild-list-indicator-inset",
        rotulo: "Recuo do indicador (trilho de servidores)",
      },
      {
        nome: "--guild-list-indicator-track-width",
        rotulo: "Largura do indicador trilho (trilho de servidores)",
      },
      {
        nome: "--guild-list-indicator-bar-width",
        rotulo: "Largura do indicador barra (trilho de servidores)",
      },
      {
        nome: "--count-indicator-gap",
        rotulo: "Espaço (indicador de contagem)",
      },
      { nome: "--guild-list-foreground", rotulo: "Trilho de servidores" },
      {
        nome: "--user-area-divider-color",
        rotulo: "Cor da divisória (área do usuário)",
      },
    ],
  },
  {
    titulo: "Rolagem",
    tokens: [
      {
        nome: "--scroller-spacer-height",
        rotulo: "Altura do espaçador (rolagem)",
      },
      {
        nome: "--scrollbar-thumb-bg",
        rotulo: "Punho da barra de rolagem",
        ligado: true,
      },
      {
        nome: "--scrollbar-thumb-bg-hover",
        rotulo: "Punho da barra no mouse",
        ligado: true,
      },
      {
        nome: "--scrollbar-track-bg",
        rotulo: "Trilho da barra de rolagem",
        ligado: true,
      },
    ],
  },
  {
    titulo: "Movimento",
    tokens: [
      { nome: "--transition-fast", rotulo: "Transição rápida" },
      { nome: "--transition-normal", rotulo: "Transição normal" },
      { nome: "--transition-slow", rotulo: "Transição lenta" },
    ],
  },
  {
    titulo: "Sombras",
    tokens: [
      { nome: "--shadow-sm", rotulo: "Sombra pequena", ligado: true },
      { nome: "--shadow-md", rotulo: "Sombra média", ligado: true },
      { nome: "--shadow-lg", rotulo: "Sombra grande", ligado: true },
      { nome: "--shadow-xl", rotulo: "Sombra enorme", ligado: true },
    ],
  },
  {
    titulo: "Camadas",
    tokens: [
      { nome: "--z-index-base", rotulo: "Base (camada)" },
      { nome: "--z-index-elevated-1", rotulo: "Elevado 1 (camada)" },
      { nome: "--z-index-elevated-2", rotulo: "Elevado 2 (camada)" },
      { nome: "--z-index-elevated-3", rotulo: "Elevado 3 (camada)" },
      { nome: "--z-index-modal", rotulo: "Modal (camada)" },
      { nome: "--z-index-popout", rotulo: "Balão (camada)" },
      { nome: "--z-index-modal-swap", rotulo: "Modal troca (camada)" },
      {
        nome: "--z-index-popout-above-swap",
        rotulo: "Balão above troca (camada)",
      },
      { nome: "--z-index-overlay", rotulo: "Cobertura (camada)" },
      { nome: "--z-index-contextmenu", rotulo: "Menu de contexto (camada)" },
      { nome: "--z-index-tooltip", rotulo: "Dica (camada)" },
      { nome: "--z-index-toast", rotulo: "Aviso (camada)" },
      { nome: "--z-index-titlebar", rotulo: "Faixa de título (camada)" },
    ],
  },
  {
    titulo: "Mídia",
    tokens: [
      {
        nome: "--media-border-radius",
        rotulo: "Canto da mídia",
        dica: "imagens e vídeos na conversa",
      },
    ],
  },
  {
    titulo: "Emoji",
    tokens: [
      { nome: "--emoji-size-emoji", rotulo: "Tamanho do emoji" },
      {
        nome: "--emoji-size-jumbo-emoji",
        rotulo: "Tamanho do emoji gigante",
        dica: "quando a mensagem só tem emoji",
      },
    ],
  },
  {
    titulo: "Outros",
    tokens: [
      {
        nome: "--keybind-hint-default-background",
        rotulo: "Fundo (dica de atalho) — padrão",
      },
      {
        nome: "--keybind-hint-default-color",
        rotulo: "Cor (dica de atalho) — padrão",
      },
    ],
  },
];

export const TODOS_OS_TOKENS = GRUPOS_DE_TOKENS.flatMap(
  (grupo) => grupo.tokens,
);

/// Os que já pintam alguma coisa. É o que o estúdio mostra por padrão.
export const TOKENS_LIGADOS = TODOS_OS_TOKENS.filter((t) => t.ligado);

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
