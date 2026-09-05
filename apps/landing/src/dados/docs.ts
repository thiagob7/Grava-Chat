export const API = "https://gravaechat-api.duckdns.org/api";
export const APP = "https://gravae-chat.vercel.app";
export const REPO = "https://github.com/thiagob7/Grava-Chat";

export type Pagina = {
  href: string;
  titulo: string;
  resumo: string;
};

export type Grupo = {
  titulo: string;
  paginas: Pagina[];
};

export const GRUPOS: Grupo[] = [
  {
    titulo: "Bem-vindo",
    paginas: [
      {
        href: "/desenvolvedores",
        titulo: "Introdução",
        resumo: "O que dá pra construir no Gravaê e por onde começar.",
      },
    ],
  },
  {
    titulo: "Fundamentos",
    paginas: [
      {
        href: "/desenvolvedores/aplicativos",
        titulo: "Aplicativos e bots",
        resumo: "Como nasce um aplicativo, e como ele entra num servidor.",
      },
      {
        href: "/desenvolvedores/autenticacao",
        titulo: "Autenticação",
        resumo: "O token, onde ele vai e como não deixar vazar.",
      },
      {
        href: "/desenvolvedores/permissoes",
        titulo: "Permissões",
        resumo: "As 33 permissões, o que cada uma libera e quais já vêm de fábrica.",
      },
    ],
  },
  {
    titulo: "Guias",
    paginas: [
      {
        href: "/desenvolvedores/primeiro-bot",
        titulo: "Seu primeiro bot",
        resumo: "Do token à primeira mensagem em três comandos.",
      },
      {
        href: "/desenvolvedores/tempo-real",
        titulo: "Tempo real",
        resumo: "A conexão que faz o bot reagir sozinho ao que acontece.",
      },
      {
        href: "/desenvolvedores/comandos",
        titulo: "Comandos de barra",
        resumo: "Registrar comandos e responder quando alguém chama.",
      },
      {
        href: "/desenvolvedores/moderacao",
        titulo: "Bot de moderação",
        resumo: "Expulsar, banir, castigar e mexer em cargos — e o que o servidor não deixa.",
      },
    ],
  },
  {
    titulo: "Referência",
    paginas: [
      {
        href: "/desenvolvedores/referencia",
        titulo: "REST",
        resumo: "Todas as rotas que um bot pode chamar.",
      },
      {
        href: "/desenvolvedores/eventos",
        titulo: "Eventos",
        resumo: "O que o bot manda e o que ele recebe pela conexão.",
      },
      {
        href: "/desenvolvedores/limites",
        titulo: "Limites",
        resumo: "Vazão, tamanhos e tetos que o servidor aplica.",
      },
      {
        href: "/desenvolvedores/temas",
        titulo: "Temas",
        resumo: "Escrever um tema: as cores, os ganchos em cada elemento e a forma da tela.",
      },
    ],
  },
];

export const PAGINAS = GRUPOS.flatMap((grupo) => grupo.paginas);

export const vizinhas = (href: string) => {
  const indice = PAGINAS.findIndex((pagina) => pagina.href === href);

  return { anterior: PAGINAS[indice - 1], proxima: PAGINAS[indice + 1] };
};
