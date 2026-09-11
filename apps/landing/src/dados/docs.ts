export const API = "https://gravaechat-api.duckdns.org/api";
export const APP = "https://gravae-chat.vercel.app";
export const REPO = "https://github.com/thiagob7/Grava-Chat";

export type Page = {
  href: string;
  title: string;
  summary: string;
};

export type Group = {
  title: string;
  pages: Page[];
};

export const GROUPS: Group[] = [
  {
    title: "Bem-vindo",
    pages: [
      {
        href: "/desenvolvedores",
        title: "Introdução",
        summary: "O que dá pra construir no Gravaê e por onde começar.",
      },
    ],
  },
  {
    title: "Fundamentos",
    pages: [
      {
        href: "/desenvolvedores/aplicativos",
        title: "Aplicativos e bots",
        summary: "Como nasce um aplicativo, e como ele entra num servidor.",
      },
      {
        href: "/desenvolvedores/autenticacao",
        title: "Autenticação",
        summary: "O token, onde ele vai e como não deixar vazar.",
      },
      {
        href: "/desenvolvedores/permissoes",
        title: "Permissões",
        summary: "As 33 permissões, o que cada uma libera e quais já vêm de fábrica.",
      },
    ],
  },
  {
    title: "Guias",
    pages: [
      {
        href: "/desenvolvedores/primeiro-bot",
        title: "Seu primeiro bot",
        summary: "Do token à primeira mensagem em três comandos.",
      },
      {
        href: "/desenvolvedores/tempo-real",
        title: "Tempo real",
        summary: "A conexão que faz o bot reagir sozinho ao que acontece.",
      },
      {
        href: "/desenvolvedores/comandos",
        title: "Comandos de barra",
        summary: "Registrar comandos e responder quando alguém chama.",
      },
      {
        href: "/desenvolvedores/moderacao",
        title: "Bot de moderação",
        summary: "Expulsar, banir, castigar e mexer em cargos — e o que o servidor não deixa.",
      },
    ],
  },
  {
    title: "Referência",
    pages: [
      {
        href: "/desenvolvedores/referencia",
        title: "REST",
        summary: "Todas as rotas que um bot pode chamar.",
      },
      {
        href: "/desenvolvedores/eventos",
        title: "Eventos",
        summary: "O que o bot manda e o que ele recebe pela conexão.",
      },
      {
        href: "/desenvolvedores/referencia/mensagem",
        title: "Mensagem",
        summary: "O que o bot escreve, edita, fixa e reage. É o objeto mais movimentado da API.",
      },
      {
        href: "/desenvolvedores/referencia/canal",
        title: "Canal",
        summary: "Onde a conversa acontece: texto, voz e fórum, com suas categorias e permissões.",
      },
      {
        href: "/desenvolvedores/referencia/servidor",
        title: "Servidor",
        summary: "A comunidade inteira. O bot só enxerga os servidores em que foi adicionado.",
      },
      {
        href: "/desenvolvedores/referencia/membro",
        title: "Membro",
        summary: "Uma pessoa dentro de um servidor: apelido, cargos e desde quando está lá.",
      },
      {
        href: "/desenvolvedores/referencia/cargo",
        title: "Cargo",
        summary: "O que dá poder a um membro. Ordem importa: o de cima ganha na cor e na hierarquia.",
      },
      {
        href: "/desenvolvedores/referencia/moderacao",
        title: "Moderação",
        summary: "Castigo e banimento. As duas ações que tiram alguém de circulação.",
      },
      {
        href: "/desenvolvedores/referencia/expressao",
        title: "Expressão",
        summary: "Emojis, figurinhas e sons do servidor.",
      },
      {
        href: "/desenvolvedores/referencia/voz",
        title: "Voz",
        summary: "Quem está na chamada e o que está fazendo lá. Só por evento — não há rota REST de voz.",
      },
      {
        href: "/desenvolvedores/referencia/aplicativo",
        title: "Aplicativo",
        summary: "O próprio bot: quem ele é e quais comandos de barra ele oferece.",
      },
      {
        href: "/desenvolvedores/referencia/webhook",
        title: "Webhook",
        summary: "Um endereço que escreve num canal sem precisar de bot conectado.",
      },
      {
        href: "/desenvolvedores/referencia/convite",
        title: "Convite",
        summary: "O link que leva alguém para dentro do servidor.",
      },
      {
        href: "/desenvolvedores/referencia/auditoria",
        title: "Auditoria",
        summary: "O registro do que a equipe fez no servidor, e de quem fez.",
      },
      {
        href: "/desenvolvedores/biblioteca",
        title: "Biblioteca",
        summary: "O cliente oficial em JavaScript, com os tipos do próprio servidor.",
      },
      {
        href: "/desenvolvedores/comunidade",
        title: "Comunidade",
        summary: "Exemplos que rodam, e onde pedir ajuda quando algo não fecha.",
      },
      {
        href: "/desenvolvedores/servidores-e-canais",
        title: "Servidores e canais",
        summary: "O que o bot pode mudar e qual permissão cada coisa exige.",
      },
      {
        href: "/desenvolvedores/webhooks",
        title: "Webhooks",
        summary: "Um endereço que escreve num canal sem bot conectado.",
      },
      {
        href: "/desenvolvedores/mudancas",
        title: "Registro de mudanças",
        summary: "O que mudou na API, com data, e o que isso quebra.",
      },
      {
        href: "/desenvolvedores/politicas",
        title: "Políticas",
        summary: "O que é permitido fazer com dados de quem usa o seu bot.",
      },
      {
        href: "/desenvolvedores/erros",
        title: "Erros",
        summary: "Os códigos, o formato da resposta e os motivos que vêm pelo socket.",
      },
      {
        href: "/desenvolvedores/limites",
        title: "Limites",
        summary: "Vazão, tamanhos e tetos que o servidor aplica.",
      },
      {
        href: "/desenvolvedores/temas",
        title: "Temas",
        summary: "Escrever um tema: as cores, os ganchos em cada elemento e a forma da tela.",
      },
    ],
  },
];

export const PAGES = GROUPS.flatMap((group) => group.pages);

export const neighbors = (href: string) => {
  const index = PAGES.findIndex((page) => page.href === href);

  return { anterior: PAGES[index - 1], next: PAGES[index + 1] };
};
