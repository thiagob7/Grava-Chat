/*
  Os rótulos do estúdio — e só isso.

  Quem manda na LISTA é `tokens-vivos.json`, extraído do CSS construído por
  `scripts/tokens-vivos.mjs`. Este arquivo diz como cada token se chama em
  português e o que ele pinta; não decide quem existe.

  A divisão importa porque a lista à mão apodreceu: chegou a oferecer 521
  campos, dos quais 450 não pintavam nada, e escondia os que pintavam. Uma lista
  escrita por gente sempre atrasa em relação ao CSS; um rótulo escrito por gente
  é justamente o que o CSS não sabe dizer.

  Mexeu no CSS e apareceu token novo? `yarn tokens` atualiza o JSON e o teste
  cobra o rótulo aqui.
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
    titulo: "Tipografia",
    tokens: [
      {
        nome: "--text-10",
        rotulo: "Tamanho 10px",
        dica: "selo de contagem, o menor da escala",
      },
      { nome: "--text-11", rotulo: "Tamanho 11px", dica: "rótulos e legendas" },
      {
        nome: "--text-13",
        rotulo: "Tamanho 13px",
        dica: "o degrau que faltava — na referência é o terceiro mais usado",
      },
      {
        nome: "--text-xs",
        rotulo: "Apelido: minúsculo",
        dica: "aponta para 12px",
      },
      {
        nome: "--text-sm",
        rotulo: "Apelido: pequeno",
        dica: "aponta para 14px",
      },
      {
        nome: "--text-base",
        rotulo: "Apelido: normal",
        dica: "aponta para 16px",
      },
      {
        nome: "--text-lg",
        rotulo: "Apelido: grande",
        dica: "aponta para 18px",
      },
      {
        nome: "--text-xl",
        rotulo: "Apelido: extra grande",
        dica: "aponta para 20px",
      },
      {
        nome: "--text-2xl",
        rotulo: "Apelido: enorme",
        dica: "aponta para 24px",
      },
      {
        nome: "--text-3xl",
        rotulo: "Apelido: gigante",
        dica: "aponta para 30px; vem da escala do Tailwind, a nossa para no 24",
      },
      { nome: "--font-weight-normal", rotulo: "Peso normal (400)" },
      { nome: "--font-weight-medium", rotulo: "Peso médio (500)" },
      {
        nome: "--font-weight-semibold",
        rotulo: "Peso forte (600)",
        dica: "o dominante, aqui e na referência",
      },
      { nome: "--font-weight-bold", rotulo: "Peso grosso (700)" },
      {
        nome: "--font-sans",
        rotulo: "Fonte da interface",
        dica: "IBM Plex Sans — a mesma da referência, com o nome de verdade",
      },
      { nome: "--font-mono", rotulo: "Fonte do código", dica: "IBM Plex Mono" },
      {
        nome: "--font-size",
        rotulo: "Tamanho da fonte da conversa",
        dica: "acompanha a régua de escala do chat",
      },
    ],
  },
  {
    titulo: "Superfícies",
    tokens: [
      {
        nome: "--color-veu",
        rotulo: "Véu atrás das janelas",
        dica: "o escurecido que separa o modal do app",
      },
      {
        nome: "--color-brilho",
        rotulo: "Brilho de vidro",
        dica: "o realce claro dos enfeites de vidro e verniz",
      },
      {
        nome: "--color-sombra",
        rotulo: "Cor da sombra",
        dica: "o tingimento das sombras dos cartões e balões",
      },
      {
        nome: "--color-sobre-midia",
        rotulo: "Escurecido sobre mídia",
        dica: "os selos e botões que ficam por cima de gif, vídeo e banner",
      },
      {
        nome: "--color-palco",
        rotulo: "Fundo do palco de voz",
        dica: "a área de vídeo e transmissão, que era preta cravada",
      },
      {
        nome: "--color-surface-0",
        rotulo: "Fundo mais profundo",
        dica: "ícones do trilho, faixa de título, campos e poços",
      },
      {
        nome: "--color-surface-1",
        rotulo: "Barra lateral",
        dica: "trilho de servidores, lista de canais e de conversas",
      },
      { nome: "--color-surface-2", rotulo: "Área da conversa" },
      {
        nome: "--color-surface-3",
        rotulo: "Elevação leve",
        dica: "cartões, pastilhas",
      },
      {
        nome: "--color-surface-4",
        rotulo: "Elevação forte",
        dica: "menus, balões e dicas",
      },
      {
        nome: "--color-cabecalho",
        rotulo: "Barra do canal",
        dica: "a faixa com o nome do canal",
      },
      { nome: "--color-composer", rotulo: "Caixa de escrever" },
      { nome: "--color-painel", rotulo: "Cartão da chamada" },
      {
        nome: "--color-hover",
        rotulo: "Realce do mouse",
        dica: "aceita transparência",
      },
      {
        nome: "--color-selecionado",
        rotulo: "Item escolhido",
        dica: "canal aberto; aceita transparência",
      },
    ],
  },
  {
    titulo: "Texto",
    tokens: [
      {
        nome: "--color-sobre-marca",
        rotulo: "Texto sobre cor forte",
        dica: "o que fica em cima de botão colorido, de pílula, de selo",
      },
      { nome: "--color-palco-ink", rotulo: "Texto sobre o palco de voz" },
      { nome: "--color-ink", rotulo: "Texto principal" },
      { nome: "--color-ink-muted", rotulo: "Texto secundário" },
      {
        nome: "--color-ink-faint",
        rotulo: "Texto apagado",
        dica: "horários, rótulos, dicas",
      },
    ],
  },
  {
    titulo: "Marca e realces",
    tokens: [
      { nome: "--color-brand", rotulo: "Marca" },
      { nome: "--color-brand-hover", rotulo: "Marca no mouse" },
      { nome: "--color-pilula", rotulo: "Barrinha do servidor ativo" },
    ],
  },
  {
    titulo: "Status",
    tokens: [
      { nome: "--color-online", rotulo: "Online" },
      { nome: "--color-idle", rotulo: "Ausente" },
      { nome: "--color-dnd", rotulo: "Não perturbe" },
      { nome: "--color-danger", rotulo: "Perigo", dica: "excluir, sair, erro" },
      {
        nome: "--color-danger-fundo",
        rotulo: "Fundo de perigo",
        dica: "a tarja fraca atrás de um aviso de excluir",
      },
    ],
  },
  {
    titulo: "Bordas e foco",
    tokens: [
      {
        nome: "--color-line-sutil",
        rotulo: "Borda quase invisível",
        dica: "a divisão de dentro de cartão e de campo",
      },
      { nome: "--color-line", rotulo: "Borda", dica: "contorno de cartão" },
      {
        nome: "--color-divisor",
        rotulo: "Divisória",
        dica: "entre painéis; aceita transparência",
      },
      { nome: "--radius-sm", rotulo: "Pequeno (canto)" },
      { nome: "--radius-md", rotulo: "Médio (canto)" },
      { nome: "--radius-lg", rotulo: "Grande (canto)" },
      { nome: "--radius-xl", rotulo: "Extra grande (canto)" },
      { nome: "--radius-2xl", rotulo: "Enorme (canto)" },
      {
        nome: "--radius-3xl",
        rotulo: "Gigante (canto)",
        dica: "vem da escala do Tailwind, a nossa para no enorme",
      },
      { nome: "--radius-full", rotulo: "Total (canto)" },
      {
        nome: "--color-foco-anel",
        rotulo: "Anel de foco (cor)",
        dica: "o halo do botão e do campo em foco; aceita transparência",
      },
      {
        nome: "--focus-primary",
        rotulo: "Anel de foco",
        dica: "o contorno de quem navega por teclado",
      },
    ],
  },
  {
    titulo: "Avisos",
    tokens: [
      { nome: "--color-aviso", rotulo: "Atenção" },
    ],
  },
  {
    titulo: "Marcação e menções",
    tokens: [
      { nome: "--color-link", rotulo: "Link" },
      { nome: "--color-mencao", rotulo: "Menção a você" },
      { nome: "--color-everyone", rotulo: "Menção a @everyone" },
      { nome: "--color-here", rotulo: "Menção a @here" },
    ],
  },
  {
    titulo: "Código e terminal",
    tokens: [
      { nome: "--color-codigo", rotulo: "Código na linha" },
      { nome: "--color-codigo-bloco", rotulo: "Bloco de código" },
    ],
  },
  {
    titulo: "Mensagens",
    tokens: [
      { nome: "--color-destaque", rotulo: "Fio de quem te menciona" },
      {
        nome: "--color-destaque-fundo",
        rotulo: "Fundo de quem te menciona",
        dica: "a faixa amarelada por trás da mensagem",
      },
    ],
  },
  {
    titulo: "Formulários",
    tokens: [
      { nome: "--color-campo", rotulo: "Campo" },
      { nome: "--color-campo-foco", rotulo: "Campo em foco" },
      {
        nome: "--color-trilho",
        rotulo: "Trilho da régua",
        dica: "o trecho ainda não preenchido",
      },
    ],
  },
  {
    titulo: "Layout",
    tokens: [
      {
        nome: "--layout-guild-list-width",
        rotulo: "Largura do trilho de servidores",
        dica: "a coluna dos ícones, à esquerda de tudo",
      },
      {
        nome: "--layout-header-height",
        rotulo: "Altura do cabeçalho",
        dica: "a faixa do topo do canal",
      },
      {
        nome: "--layout-member-list-width",
        rotulo: "Largura da lista de membros",
        dica: "a coluna da direita",
      },
      {
        nome: "--layout-sidebar-width",
        rotulo: "Largura da lateral",
        dica: "a coluna de canais, de conversas e do explorar",
      },
      { nome: "--guild-icon-size", rotulo: "Tamanho do ícone de servidor" },
      {
        nome: "--footer-box-height",
        rotulo: "Altura do rodapé e da caixa de escrever",
        dica: "os dois sobem e descem juntos, como na referência",
      },
      { nome: "--footer-box-radius", rotulo: "Canto do rodapé e da caixa de escrever" },
      {
        nome: "--message-gutter",
        rotulo: "Calha da mensagem",
        dica: "o espaço entre o avatar e o texto",
      },
      {
        nome: "--message-line-height",
        rotulo: "Altura de linha da mensagem",
        dica: "menor deixa a conversa mais densa",
      },
      { nome: "--textarea-line-height", rotulo: "Altura de linha da caixa de escrever" },
    ],
  },
  {
    titulo: "Rolagem",
    tokens: [
      { nome: "--scrollbar-thumb-bg", rotulo: "Punho da barra de rolagem" },
      { nome: "--scrollbar-thumb-bg-hover", rotulo: "Punho da barra no mouse" },
      { nome: "--scrollbar-track-bg", rotulo: "Trilho da barra de rolagem" },
    ],
  },
  {
    titulo: "Outros",
    tokens: [
      {
        nome: "--user-select",
        rotulo: "Seleção de texto com o mouse",
        dica: "auto seleciona; none faz o app parecer programa, não página",
      },
    ],
  },
];

export const TODOS_OS_TOKENS = GRUPOS_DE_TOKENS.flatMap(
  (grupo) => grupo.tokens,
);

/*
  O valor que o TEMA daria a este token, ignorando o que o estúdio escreveu em
  linha. Sem isso o campo mostraria o próprio rascunho como se fosse o padrão, e
  "voltar ao padrão" nunca teria para onde voltar.
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
