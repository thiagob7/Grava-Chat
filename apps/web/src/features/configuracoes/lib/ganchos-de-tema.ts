/*
  Os nomes de classe que um tema pode mirar com segurança.

  São nossos e estáveis: não saem de um build, saem daqui. Um tema que fale
  só por eles continua valendo quando a árvore mudar de forma — o contrário
  do que acontece com quem mira nome de módulo gerado.

  A lista aparece no estúdio, para quem escreve tema, e é a mesma que o teste
  dos temas da casa usa para recusar CSS mirando qualquer outra coisa.
*/
export const GANCHOS_DE_TEMA: { classe: string; oQueE: string }[] = [
  { classe: "trilho-de-servidores", oQueE: "a coluna estreita dos ícones" },
  { classe: "lista-de-canais", oQueE: "a barra dos canais do servidor" },
  { classe: "lista-de-conversas", oQueE: "a barra das mensagens diretas" },
  { classe: "lista-de-comunidades", oQueE: "a barra do Explorar" },
  { classe: "lista-de-membros", oQueE: "a coluna da direita" },
  { classe: "topo-do-canal", oQueE: "a faixa com o nome do canal" },
  { classe: "area-de-conversa", oQueE: "o miolo, onde as mensagens rolam" },
  { classe: "lista-de-mensagens", oQueE: "só a parte que rola" },
  { classe: "barra-da-mensagem", oQueE: "os botões que aparecem no hover" },
  { classe: "caixa-de-escrever", oQueE: "a caixa de escrever" },
  { classe: "area-do-usuario", oQueE: "a faixa inteira embaixo, sob o trilho" },
  { classe: "painel-do-usuario", oQueE: "o seu cartão, dentro dela" },
  { classe: "avatar", oQueE: "toda foto de pessoa" },
  { classe: "janela", oQueE: "qualquer modal" },
  { classe: "menu", oQueE: "os menus de clique" },
  { classe: "balao", oQueE: "os popovers" },
  { classe: "dica", oQueE: "as dicas de passar o mouse" },
];

export const CLASSES_DE_TEMA = GANCHOS_DE_TEMA.map((g) => g.classe);
