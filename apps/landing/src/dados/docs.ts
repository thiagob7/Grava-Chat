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
        href: "/desenvolvedores/referencia/mensagem",
        titulo: "Mensagem",
        resumo: "O que o bot escreve, edita, fixa e reage. É o objeto mais movimentado da API.",
      },
      {
        href: "/desenvolvedores/referencia/canal",
        titulo: "Canal",
        resumo: "Onde a conversa acontece: texto, voz e fórum, com suas categorias e permissões.",
      },
      {
        href: "/desenvolvedores/referencia/servidor",
        titulo: "Servidor",
        resumo: "A comunidade inteira. O bot só enxerga os servidores em que foi adicionado.",
      },
      {
        href: "/desenvolvedores/referencia/membro",
        titulo: "Membro",
        resumo: "Uma pessoa dentro de um servidor: apelido, cargos e desde quando está lá.",
      },
      {
        href: "/desenvolvedores/referencia/cargo",
        titulo: "Cargo",
        resumo: "O que dá poder a um membro. Ordem importa: o de cima ganha na cor e na hierarquia.",
      },
      {
        href: "/desenvolvedores/referencia/moderacao",
        titulo: "Moderação",
        resumo: "Castigo e banimento. As duas ações que tiram alguém de circulação.",
      },
      {
        href: "/desenvolvedores/referencia/expressao",
        titulo: "Expressão",
        resumo: "Emojis, figurinhas e sons do servidor.",
      },
      {
        href: "/desenvolvedores/referencia/voz",
        titulo: "Voz",
        resumo: "Quem está na chamada e o que está fazendo lá. Só por evento — não há rota REST de voz.",
      },
      {
        href: "/desenvolvedores/referencia/aplicativo",
        titulo: "Aplicativo",
        resumo: "O próprio bot: quem ele é e quais comandos de barra ele oferece.",
      },
      {
        href: "/desenvolvedores/referencia/webhook",
        titulo: "Webhook",
        resumo: "Um endereço que escreve num canal sem precisar de bot conectado.",
      },
      {
        href: "/desenvolvedores/referencia/convite",
        titulo: "Convite",
        resumo: "O link que leva alguém para dentro do servidor.",
      },
      {
        href: "/desenvolvedores/referencia/auditoria",
        titulo: "Auditoria",
        resumo: "O registro do que a equipe fez no servidor, e de quem fez.",
      },
      {
        href: "/desenvolvedores/biblioteca",
        titulo: "Biblioteca",
        resumo: "O cliente oficial em JavaScript, com os tipos do próprio servidor.",
      },
      {
        href: "/desenvolvedores/comunidade",
        titulo: "Comunidade",
        resumo: "Exemplos que rodam, e onde pedir ajuda quando algo não fecha.",
      },
      {
        href: "/desenvolvedores/servidores-e-canais",
        titulo: "Servidores e canais",
        resumo: "O que o bot pode mudar e qual permissão cada coisa exige.",
      },
      {
        href: "/desenvolvedores/webhooks",
        titulo: "Webhooks",
        resumo: "Um endereço que escreve num canal sem bot conectado.",
      },
      {
        href: "/desenvolvedores/mudancas",
        titulo: "Registro de mudanças",
        resumo: "O que mudou na API, com data, e o que isso quebra.",
      },
      {
        href: "/desenvolvedores/politicas",
        titulo: "Políticas",
        resumo: "O que é permitido fazer com dados de quem usa o seu bot.",
      },
      {
        href: "/desenvolvedores/erros",
        titulo: "Erros",
        resumo: "Os códigos, o formato da resposta e os motivos que vêm pelo socket.",
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
