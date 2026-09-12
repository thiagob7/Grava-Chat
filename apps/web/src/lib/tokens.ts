export interface ThemeToken {
  name: string;
  label: string;
  hint?: string;
}

export interface TokensGroup {
  title: string;
  tokens: ThemeToken[];
}

export const TOKENS_GROUPS: TokensGroup[] = [
  {
    title: "Tipografia",
    tokens: [
      {
        name: "--text-10",
        label: "Tamanho 10px",
        hint: "selo de contagem, o menor da escala",
      },
      { name: "--text-11", label: "Tamanho 11px", hint: "rótulos e legendas" },
      { name: "--text-12", label: "Tamanho 12px", hint: "os passos de um assistente, e o status do canal" },
      {
        name: "--text-13",
        label: "Tamanho 13px",
        hint: "o degrau que faltava — na referência é o terceiro mais usado",
      },
      {
        name: "--text-xs",
        label: "Apelido: minúsculo",
        hint: "aponta para 12px",
      },
      {
        name: "--text-sm",
        label: "Apelido: pequeno",
        hint: "aponta para 14px",
      },
      {
        name: "--text-base",
        label: "Apelido: normal",
        hint: "aponta para 16px",
      },
      {
        name: "--text-lg",
        label: "Apelido: grande",
        hint: "aponta para 18px",
      },
      {
        name: "--text-xl",
        label: "Apelido: extra grande",
        hint: "aponta para 20px",
      },
      {
        name: "--text-2xl",
        label: "Apelido: enorme",
        hint: "aponta para 24px",
      },
      {
        name: "--text-3xl",
        label: "Apelido: gigante",
        hint: "aponta para 30px; vem da escala do Tailwind, a nossa para no 24",
      },
      { name: "--font-weight-normal", label: "Peso normal (400)" },
      { name: "--font-weight-medium", label: "Peso médio (500)" },
      {
        name: "--font-weight-semibold",
        label: "Peso forte (600)",
        hint: "o dominante, aqui e na referência",
      },
      { name: "--font-weight-bold", label: "Peso grosso (700)" },
      {
        name: "--font-sans",
        label: "Fonte da interface",
        hint: "IBM Plex Sans — a mesma da referência, com o nome de verdade",
      },
      { name: "--font-mono", label: "Fonte do código", hint: "IBM Plex Mono" },
      {
        name: "--font-size",
        label: "Tamanho da fonte da conversa",
        hint: "acompanha a régua de escala do chat",
      },
    ],
  },
  {
    title: "Superfícies",
    tokens: [
      {
        name: "--color-veu",
        label: "Véu atrás das janelas",
        hint: "o escurecido que separa o modal do app",
      },
      {
        name: "--color-brilho",
        label: "Brilho de vidro",
        hint: "o realce claro dos enfeites de vidro e verniz",
      },
      {
        name: "--color-sombra",
        label: "Cor da sombra",
        hint: "o tingimento das sombras dos cartões e balões",
      },
      {
        name: "--color-sobre-midia",
        label: "Escurecido sobre mídia",
        hint: "os selos e botões que ficam por cima de gif, vídeo e banner",
      },
      {
        name: "--color-palco",
        label: "Fundo do palco de voz",
        hint: "a área de vídeo e transmissão, que era preta cravada",
      },
      {
        name: "--color-surface-0",
        label: "Fundo mais profundo",
        hint: "ícones do trilho, faixa de título, campos e poços",
      },
      {
        name: "--color-surface-1",
        label: "Barra lateral",
        hint: "trilho de servidores, lista de canais e de conversas",
      },
      { name: "--color-surface-2", label: "Área da conversa" },
      {
        name: "--color-surface-3",
        label: "Elevação leve",
        hint: "cartões, pastilhas",
      },
      {
        name: "--color-surface-4",
        label: "Elevação forte",
        hint: "menus, balões e dicas",
      },
      {
        name: "--color-cabecalho",
        label: "Barra do canal",
        hint: "a faixa com o nome do canal",
      },
      { name: "--color-composer", label: "Caixa de escrever" },
      { name: "--color-painel", label: "Cartão da chamada" },
      {
        name: "--color-hover",
        label: "Realce do mouse",
        hint: "aceita transparência",
      },
      {
        name: "--color-selecionado",
        label: "Item escolhido",
        hint: "canal aberto; aceita transparência",
      },
    ],
  },
  {
    title: "Texto",
    tokens: [
      {
        name: "--color-sobre-marca",
        label: "Texto sobre cor forte",
        hint: "o que fica em cima de botão colorido, de pílula, de selo",
      },
      { name: "--color-palco-ink", label: "Texto sobre o palco de voz" },
      { name: "--color-ink", label: "Texto principal" },
      { name: "--color-ink-muted", label: "Texto secundário" },
      {
        name: "--color-ink-faint",
        label: "Texto apagado",
        hint: "horários, rótulos, dicas",
      },
    ],
  },
  {
    title: "Marca e realces",
    tokens: [
      { name: "--color-brand", label: "Marca" },
      { name: "--color-brand-hover", label: "Marca no mouse" },
      { name: "--color-pilula", label: "Barrinha do servidor ativo" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { name: "--color-online", label: "Online" },
      { name: "--color-idle", label: "Ausente" },
      { name: "--color-dnd", label: "Não perturbe" },
      { name: "--color-danger", label: "Perigo", hint: "excluir, sair, erro" },
      {
        name: "--color-danger-fundo",
        label: "Fundo de perigo",
        hint: "a tarja fraca atrás de um aviso de excluir",
      },
    ],
  },
  {
    title: "Bordas e foco",
    tokens: [
      {
        name: "--color-line-sutil",
        label: "Borda quase invisível",
        hint: "a divisão de dentro de cartão e de campo",
      },
      { name: "--color-line", label: "Borda", hint: "contorno de cartão" },
      {
        name: "--color-divisor",
        label: "Divisória",
        hint: "entre painéis; aceita transparência",
      },
      { name: "--radius-sm", label: "Pequeno (canto)" },
      { name: "--radius-md", label: "Médio (canto)" },
      { name: "--radius-lg", label: "Grande (canto)" },
      { name: "--radius-xl", label: "Extra grande (canto)" },
      { name: "--radius-2xl", label: "Enorme (canto)" },
      {
        name: "--radius-3xl",
        label: "Gigante (canto)",
        hint: "vem da escala do Tailwind, a nossa para no enorme",
      },
      { name: "--radius-full", label: "Total (canto)" },
      {
        name: "--color-foco-anel",
        label: "Anel de foco (cor)",
        hint: "o halo do botão e do campo em foco; aceita transparência",
      },
      {
        name: "--focus-primary",
        label: "Anel de foco",
        hint: "o contorno de quem navega por teclado",
      },
    ],
  },
  {
    title: "Avisos",
    tokens: [
      { name: "--color-aviso", label: "Atenção" },
    ],
  },
  {
    title: "Marcação e menções",
    tokens: [
      { name: "--color-link", label: "Link" },
      { name: "--color-mencao", label: "Menção a você" },
      { name: "--color-everyone", label: "Menção a @everyone" },
      { name: "--color-here", label: "Menção a @here" },
    ],
  },
  {
    title: "Código e terminal",
    tokens: [
      { name: "--color-codigo", label: "Código na linha" },
      { name: "--color-codigo-bloco", label: "Bloco de código" },
    ],
  },
  {
    title: "Mensagens",
    tokens: [
      { name: "--color-destaque", label: "Fio de quem te menciona" },
      {
        name: "--color-destaque-fundo",
        label: "Fundo de quem te menciona",
        hint: "a faixa amarelada por trás da mensagem",
      },
    ],
  },
  {
    title: "Formulários",
    tokens: [
      { name: "--color-campo", label: "Campo" },
      { name: "--color-campo-foco", label: "Campo em foco" },
      {
        name: "--color-trilho",
        label: "Trilho da régua",
        hint: "o trecho ainda não preenchido",
      },
    ],
  },
  {
    title: "Layout",
    tokens: [
      {
        name: "--layout-guild-list-width",
        label: "Largura do trilho de servidores",
        hint: "a coluna dos ícones, à esquerda de tudo",
      },
      {
        name: "--layout-header-height",
        label: "Altura do cabeçalho",
        hint: "a faixa do topo do canal",
      },
      {
        name: "--layout-member-list-width",
        label: "Largura da lista de membros",
        hint: "a coluna da direita",
      },
      {
        name: "--layout-sidebar-width",
        label: "Largura da lateral",
        hint: "a coluna de canais, de conversas e do explorar",
      },
      { name: "--guild-icon-size", label: "Tamanho do ícone de servidor" },
      {
        name: "--user-card-min-height",
        label: "Altura do cartão do usuário",
        hint: "o mínimo; ele cresce sozinho quando você entra numa chamada",
      },
      {
        name: "--composer-box-height",
        label: "Altura da caixa de escrever",
        hint: "a caixa cresce com o texto; isto é a altura de uma linha",
      },
      { name: "--footer-box-radius", label: "Canto do rodapé e da caixa de escrever" },
      {
        name: "--message-gutter",
        label: "Calha da mensagem",
        hint: "o espaço entre o avatar e o texto",
      },
      {
        name: "--message-line-height",
        label: "Altura de linha da mensagem",
        hint: "menor deixa a conversa mais densa",
      },
      { name: "--textarea-line-height", label: "Altura de linha da caixa de escrever" },
      {
        name: "--textarea-button-height",
        label: "Tamanho dos botões da caixa de escrever",
        hint: "mais, fonte, GIF, imagem, figurinha, emoji e enviar, todos juntos",
      },
      { name: "--textarea-button-icon-size", label: "Ícone dos botões da caixa de escrever" },
      { name: "--composer-action-gap", label: "Espaço entre os botões da caixa de escrever" },
    ],
  },
  {
    title: "Rolagem",
    tokens: [
      { name: "--scrollbar-thumb-bg", label: "Punho da barra de rolagem" },
      { name: "--scrollbar-thumb-bg-hover", label: "Punho da barra no mouse" },
      { name: "--scrollbar-track-bg", label: "Trilho da barra de rolagem" },
    ],
  },
  {
    title: "Outros",
    tokens: [
      {
        name: "--user-select",
        label: "Seleção de texto com o mouse",
        hint: "auto seleciona; none faz o app parecer programa, não página",
      },
      { name: "--text-selection", label: "Realce do texto selecionado" },
    ],
  },
];

export const ALL_TOKENS = TOKENS_GROUPS.flatMap(
  (group) => group.tokens,
);

export function themeValue(name: string): string {
  const root = document.documentElement;
  const inLine = root.style.getPropertyValue(name);

  if (!inLine) return getComputedStyle(root).getPropertyValue(name).trim();

  root.style.removeProperty(name);
  const fromTheme = getComputedStyle(root).getPropertyValue(name).trim();
  root.style.setProperty(name, inLine);

  return fromTheme;
}
