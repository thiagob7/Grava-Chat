export const THEME_HOOKS: { cssClass: string; oQueE: string }[] = [
  { cssClass: "trilho-de-servidores", oQueE: "a coluna estreita dos ícones" },
  { cssClass: "lista-de-canais", oQueE: "a barra dos canais do servidor" },
  { cssClass: "lista-de-conversas", oQueE: "a barra das mensagens diretas" },
  { cssClass: "lista-de-comunidades", oQueE: "a barra do Explorar" },
  { cssClass: "lista-de-membros", oQueE: "a coluna da direita" },
  { cssClass: "topo-do-canal", oQueE: "a faixa com o nome do canal" },
  { cssClass: "area-de-conversa", oQueE: "o miolo, onde as mensagens rolam" },
  { cssClass: "lista-de-mensagens", oQueE: "só a parte que rola" },
  { cssClass: "barra-da-mensagem", oQueE: "os botões que aparecem no hover" },
  { cssClass: "caixa-de-escrever", oQueE: "a caixa de escrever" },
  { cssClass: "area-do-usuario", oQueE: "a faixa inteira embaixo, sob o trilho" },
  { cssClass: "painel-do-usuario", oQueE: "o seu cartão, dentro dela" },
  { cssClass: "avatar", oQueE: "toda foto de pessoa" },
  { cssClass: "janela", oQueE: "qualquer modal" },
  { cssClass: "menu", oQueE: "os menus de clique" },
  { cssClass: "balao", oQueE: "os popovers" },
  { cssClass: "dica", oQueE: "as dicas de passar o mouse" },
];

export const THEME_CLASSES = THEME_HOOKS.map((g) => g.cssClass);
