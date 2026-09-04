/*
  As configurações do SERVIDOR: cargos, membros, banimentos, convites,
  webhooks, emblemas, expressões e o resto do que quem administra vê.

  Quinta área a sair do português cravado, e a maior delas. Sai em levas — esta
  primeira cobre as seções que são listas com um título e um vazio; as que têm
  formulário grande (AutoMod, cargos, expressões) vêm depois.

  O que NÃO entra aqui: nome de cargo, de canal, de emoji ou de servidor. São
  dados de quem usa, não texto de tela — traduzir "everyone" quebraria a menção
  que a pessoa digita.
*/
export const servidor = {
  titulo: "Configurações do servidor",

  auditoria: {
    titulo: "Registro de auditoria",
    porUsuario: "Filtrar por usuário",
    porAcao: "Filtrar por ação",
    vazio: "Nada registrado ainda com esse filtro.",
    motivo: "Motivo:",
  },

  banimentos: {
    titulo: "Lista de banimentos do servidor",
    descricao:
      "Quem está aqui não entra nem com convite novo. Desbanir devolve o acesso na hora.",
    procurar: "Procurar banimentos por nome de usuário",
    vazioTitulo: "Sem banimentos",
    vazio: "Você ainda não baniu ninguém… mas se e quando precisar, não hesite.",
    desbanir: "Desbanir",
  },

  excluir: {
    titulo: "Excluir servidor",
    aviso: "Isso não pode ser desfeito.",
  },

  emblemas: {
    titulo: "Emblemas",
    vazio: "Nenhum emblema ainda.",
    novo: "Novo emblema",
  },

  convites: {
    titulo: "Convites",
    descricao: "Todos os links de convite ativos deste servidor.",
    vazio: "Nenhum convite criado ainda.",
    revogar: "Revogar convite",
  },

  integracoes: {
    titulo: "Integrações",
    descricao:
      "Um webhook é um endereço que posta num canal sem precisar de conta. Serve pra avisar quando um build passa, quando alguém abre um chamado, ou o que você quiser mandar de um script.",
    novo: "Novo webhook",
    vazio: "Nenhum webhook ainda. Crie um e cole a URL onde quiser que a mensagem venha.",
    canal: "Canal",
    apagar: "Apagar webhook",
    comoUsar: "Como usar",
    comoUsarTexto:
      "Mande um POST com JSON. O formato é o mesmo do Discord, então script que já existe por aí funciona sem mudança:",
  },

  engajamento: {
    titulo: "Engajamento",
    descricao:
      "O que o servidor faz sozinho para não parecer vazio quando chega gente nova.",
    sistema: "Mensagens do sistema",
    boasVindas: "Enviar uma mensagem de boas-vindas quando alguém entrar",
    sorteio: "Sem texto próprio embaixo, a frase é sorteada — sempre a mesma cansa rápido.",
    canalDoSistema: "Canal de mensagens do sistema",
    mensagem: "Mensagem de boas-vindas",
    deixeVazio: "Deixe vazio para sortear entre as frases prontas",
  },
};
