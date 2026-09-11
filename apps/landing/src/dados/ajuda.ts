export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: "comecar" | "servidor" | "conversa" | "conta" | "socorro";
}

export interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  updatedAt: string;
}

export const CATEGORIES: HelpCategory[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros passos",
    description: "O que o Gravaê é, quanto custa e como entrar.",
    icon: "comecar",
  },
  {
    id: "servidores",
    title: "Servidores e canais",
    description: "Criar o seu lugar, chamar gente e decidir quem faz o quê.",
    icon: "servidor",
  },
  {
    id: "conversas",
    title: "Conversas e chamadas",
    description: "O que dá para fazer numa mensagem, numa chamada e numa transmissão.",
    icon: "conversa",
  },
  {
    id: "conta",
    title: "Sua conta",
    description: "Sessões abertas, seus dados, aplicativos autorizados e exclusão.",
    icon: "conta",
  },
  {
    id: "problemas",
    title: "Limites e problemas",
    description: "O que o servidor aceita e o que fazer quando alguma coisa quebra.",
    icon: "socorro",
  },
];

const TODAY = "2026-09-10";

export const ARTICLES: HelpArticle[] = [
  {
    id: "preciso-instalar",
    categoryId: "primeiros-passos",
    title: "Preciso instalar alguma coisa?",
    summary:
      "O Gravaê abre no navegador e funciona inteiro por lá. O aplicativo existe para quem quer atalho, avisos do sistema e som na transmissão.",
    updatedAt: TODAY,
  },
  {
    id: "quanto-custa",
    categoryId: "primeiros-passos",
    title: "Quanto custa usar o Gravaê",
    summary: "Nada. Sem plano pago, sem anúncio e sem vender o que você fala.",
    updatedAt: TODAY,
  },
  {
    id: "entrar-num-servidor",
    categoryId: "primeiros-passos",
    title: "Como entrar num servidor",
    summary:
      "O convite é a única porta. Não existe busca pública de servidores: se ninguém te chamou, você não vê.",
    updatedAt: TODAY,
  },
  {
    id: "criar-um-servidor",
    categoryId: "servidores",
    title: "Como criar um servidor",
    summary:
      "O botão de mais no trilho da esquerda. Ele nasce com um canal de texto e um de voz, e quem cria é o dono.",
    updatedAt: TODAY,
  },
  {
    id: "convidar-pessoas",
    categoryId: "servidores",
    title: "Como convidar pessoas",
    summary:
      "O link pode durar de 30 minutos a para sempre, e pode ter limite de quantas pessoas aceita.",
    updatedAt: TODAY,
  },
  {
    id: "tipos-de-canal",
    categoryId: "servidores",
    title: "Os tipos de canal",
    summary: "Texto para conversa, voz para chamada e fórum para assunto que rende.",
    updatedAt: TODAY,
  },
  {
    id: "cargos-e-permissoes",
    categoryId: "servidores",
    title: "Cargos e permissões",
    summary:
      "Cada cargo carrega um conjunto de permissões, e cada canal pode passar por cima do que o cargo diz.",
    updatedAt: TODAY,
  },
  {
    id: "modo-lento",
    categoryId: "servidores",
    title: "Segurar a conversa com o modo lento",
    summary:
      "De 5 segundos a 6 horas entre uma mensagem e outra. Quem modera passa por cima dele.",
    updatedAt: TODAY,
  },
  {
    id: "editar-e-apagar",
    categoryId: "conversas",
    title: "Editar e apagar mensagens",
    summary:
      "Dá a qualquer momento, e a mensagem editada ganha uma marca do lado. Não dá para mudar o que você disse às escondidas.",
    updatedAt: TODAY,
  },
  {
    id: "criar-enquete",
    categoryId: "conversas",
    title: "Como criar uma enquete",
    summary: "Uma pergunta, até cinco opções, e a escolha entre voto único ou vários.",
    updatedAt: TODAY,
  },
  {
    id: "expressoes-do-servidor",
    categoryId: "conversas",
    title: "Emojis, figurinhas e sons do servidor",
    summary:
      "Emoji entra no meio da frase, figurinha é a mensagem inteira e som toca para quem está na chamada.",
    updatedAt: TODAY,
  },
  {
    id: "fixar-mensagem",
    categoryId: "conversas",
    title: "Como fixar uma mensagem",
    summary: "A mensagem fixada vira uma lista no topo do canal, aberta para todo mundo do canal.",
    updatedAt: TODAY,
  },
  {
    id: "entrar-numa-chamada",
    categoryId: "conversas",
    title: "Como entrar numa chamada",
    summary: "Um clique no canal de voz. Não toca para ninguém e não avisa antes.",
    updatedAt: TODAY,
  },
  {
    id: "transmitir-a-tela",
    categoryId: "conversas",
    title: "Como transmitir a sua tela",
    summary: "Uma janela inteira ou só um aplicativo, escolhido na hora de começar.",
    updatedAt: TODAY,
  },
  {
    id: "som-da-transmissao",
    categoryId: "conversas",
    title: "Ninguém ouve o som da minha transmissão",
    summary:
      "Levar o som do computador junto com a imagem é coisa do aplicativo. No navegador, depende do navegador.",
    updatedAt: TODAY,
  },
  {
    id: "microfone-nao-pega",
    categoryId: "conversas",
    title: "O microfone não pega",
    summary:
      "Primeiro a permissão do navegador, depois o aparelho escolhido nas configurações de voz.",
    updatedAt: TODAY,
  },
  {
    id: "sessoes-abertas",
    categoryId: "conta",
    title: "Onde a sua conta está conectada",
    summary:
      "A lista de sessões mostra cada aparelho que entrou, e derruba qualquer um deles num clique.",
    updatedAt: TODAY,
  },
  {
    id: "exportar-dados",
    categoryId: "conta",
    title: "Levar os seus dados embora",
    summary:
      "A exportação sai sem pedir para ninguém, com perfil, servidores, amizades e mensagens.",
    updatedAt: TODAY,
  },
  {
    id: "aplicativos-autorizados",
    categoryId: "conta",
    title: "Aplicativos que você autorizou",
    summary: "A lista fica nas configurações, e tirar a autorização corta o acesso na hora.",
    updatedAt: TODAY,
  },
  {
    id: "excluir-conta",
    categoryId: "conta",
    title: "Como apagar a sua conta",
    summary:
      "Ela fica 15 dias marcada para excluir, e voltar a entrar nesse prazo cancela tudo.",
    updatedAt: TODAY,
  },
  {
    id: "limites-do-app",
    categoryId: "problemas",
    title: "Os limites do Gravaê",
    summary:
      "Tamanho de arquivo, quantidade de canais, de cargos e o resto. Os números são lidos do próprio código.",
    updatedAt: TODAY,
  },
  {
    id: "nao-carrega",
    categoryId: "problemas",
    title: "O Gravaê não carrega",
    summary:
      "A página de status diz se o problema é nosso e há quanto tempo, medida por fora da plataforma.",
    updatedAt: TODAY,
  },
  {
    id: "reportar-bug",
    categoryId: "problemas",
    title: "Achei um bug, ou queria pedir alguma coisa",
    summary: "O que você fez, o que aconteceu e o que você esperava. Com isso dá para consertar.",
    updatedAt: TODAY,
  },
  {
    id: "escrever-um-bot",
    categoryId: "problemas",
    title: "Quero escrever um bot",
    summary: "A documentação para desenvolvedores tem a API pública e o pacote pronto.",
    updatedAt: TODAY,
  },
];

export const categoryArticles = (categoryId: string) =>
  ARTICLES.filter((article) => article.categoryId === categoryId);

export const findArticle = (id: string) => ARTICLES.find((article) => article.id === id);

export const writeData = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
