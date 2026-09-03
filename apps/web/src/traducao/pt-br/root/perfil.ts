/// O perfil: o cartão que abre no clique do avatar, a janela cheia, o painel
/// do privado e as telas de edição que penduram nele — status, cargos,
/// etiqueta, emblemas e nota. É a terceira área a sair do português cravado,
/// depois das configurações e da conversa.
export const perfil = {
  carregando: "Carregando…",
  editar: "Editar perfil",
  mensagem: "Mensagem",
  abrirConversa: "Abrir conversa",
  verCompleto: "Ver perfil completo",
  convidarParaServidor: "Convidar para o servidor",
  semServidores: "Você não tem servidores",
  conviteEnviado: "Convite enviado para {{nome}}.",
  moderador: "Abrir na visualização de moderador",
  mais: "Mais",
  ignorar: "Ignorar",
  deixarDeIgnorar: "Deixar de ignorar",
  copiarId: "Copiar ID do usuário",
  idCopiado: "ID copiado.",
  conexoes: "Conexões",
  membroDesde: "Membro desde",
  sobre: "Sobre",
  cargosTitulo: "Cargos",
  visaoGeral: "Visão geral",
  amigosEmComum: "Amigos em comum ({{quantidade}})",
  servidoresEmComum: "Servidores em comum ({{quantidade}})",
  amizade: {
    amigo: "Amigo",
    pedidoEnviado: "Pedido de amizade enviado",
    respondaAbaixo: "Te mandou um pedido — responda abaixo",
    adicionar: "Adicionar amigo",
    teMandouPedido: "Te mandou um pedido de amizade",
    aceitar: "Aceitar",
    desfazer: "Desfazer amizade",
    desfazerTitulo: "Desfazer amizade com {{nome}}?",
    desfazerDescricao:
      "Vocês deixam de ser amigos. A conversa privada continua no histórico, e dá pra adicionar de novo depois.",
    bloquear: "Bloquear",
    bloquearTitulo: "Bloquear {{nome}}?",
    bloquearDescricao:
      "Vocês deixam de ser amigos, a conversa privada para de aceitar mensagens e ele não consegue mais te mandar pedido de amizade.",
    linkCopiado: "Vocês não são amigos — o link foi copiado para você mandar.",
  },
  /// O campinho de mandar uma mensagem sem sair do cartão.
  recado: {
    escrever: "Conversar com @{{usuario}}",
    enviar: "Enviar",
    enviada: "Mensagem enviada",
    falhou: "Não deu pra enviar. Tente pela conversa.",
  },
  cartao: {
    trocarFaixa: "Trocar a faixa do cartão",
    trocarFaixaCurto: "Trocar a faixa",
    trocarFoto: "Trocar a foto de perfil",
    trocarFotoCurto: "Trocar a foto",
    suaEtiqueta: "Sua etiqueta",
    editarEtiqueta: "Clique para editar sua etiqueta",
    conteAlgo: "Conte algo sobre você",
    adicionarStatus: "Adicionar status",
    adicionarDescricao: "Clique para adicionar uma descrição",
    /*
      Três chaves para a mesma seção porque o título conta os cargos, e contar
      em português muda a palavra: "Cargo" com um, "Cargos — 4" com quatro.
      Idioma que não faz essa distinção repete o mesmo texto nas duas primeiras
      e ninguém percebe; idioma que faz, faz certo.
    */
    cargo: "Cargo",
    cargos: "Cargos",
    cargosCom: "Cargos — {{quantidade}}",
    tirarCargo: "Tirar o cargo {{cargo}}",
  },
  cargos: {
    adicionar: "Adicionar cargo",
    procurar: "Procurar cargo",
  },
  etiqueta: {
    escolher: "Escolher a etiqueta de servidor",
    nenhuma: "Nenhuma tag do servidor",
    semEtiqueta: "Nenhum dos seus servidores tem etiqueta",
  },
  emblemas: {
    doServidor: "Emblemas deste servidor",
    limite: "Dá pra vestir até {{quantidade}} emblemas.",
  },
  nota: {
    vazia: "Clique para anotar algo",
    rotulo: "Nota (só você vê)",
  },
  status: {
    titulo: "Status",
    definir: "Definir seu status",
    escolherEmoji: "Escolher emoji",
    tirarEmoji: "Tirar o emoji",
    oQuePensa: "No que você está pensando?",
    limparAgora: "Limpar status agora",
    naoLimpar: "Não limpar",
    limpar30m: "Limpar em 30 minutos",
    limpar1h: "Limpar em 1 hora",
    limpar4h: "Limpar em 4 horas",
    limparHoje: "Limpar hoje",
    limparAmanha: "Limpar amanhã",
    /*
      "Limpar amanhã" não diz nada; "Limpar amanhã às 21:11" diz. A hora sai do
      mesmo cálculo que grava o valor, então o rótulo nunca mente sobre o que
      vai acontecer — e por isso ela entra por interpolação, e não escrita
      dentro de cada um dos seis prazos.
    */
    comHora: "{{prazo}} às {{hora}}",
  },
  presenca: {
    disponivel: "Disponível",
    ausente: "Ausente",
    naoPerturbar: "Não perturbar",
    naoPerturbarDetalhe: "Você não recebe aviso de mensagem nova",
    invisivel: "Invisível",
    invisivelDetalhe: "Você aparece offline para os outros",
  },
  menu: {
    mudarDeConta: "Mudar de conta",
    gerenciarContas: "Gerenciar contas",
  },
  editor: {
    decoracao: "Alterar a decoração do avatar",
    naoSalvo: "Não se esqueça de salvar suas alterações!",
    principal: "Perfil principal",
  },
};
