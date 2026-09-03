/// A conversa: a lista, a mensagem, a caixa de escrever e o que pende delas
/// (anexos, cartões de link, enquete, fixadas, encaminhar). É a área mais
/// densa do app e a que mais se lê — por isso é a segunda a ser traduzida,
/// logo depois das configurações.
export const conversa = {
  lista: {
    carregando: "Carregando mensagens…",
    carregandoMais: "Carregando…",
    verMais: "Role para cima para ver mais",
    semHistorico: "Histórico indisponível",
    semHistoricoDetalhe:
      "Seu cargo não tem permissão para ler o histórico de #{{canal}}. As mensagens novas continuam aparecendo enquanto você estiver aqui.",
    boasVindas: "Bem-vindo a #{{canal}}",
    boasVindasDetalhe: "Este é o começo do canal #{{canal}}.",
  },
  /*
    A data escrita por extenso, e não só o número.

    "Hoje" e "Ontem" são o que a pessoa lê no divisor da conversa; o resto do
    calendário vem do `Intl`, que já sabe a ordem de dia e mês em cada idioma.
    Só estas quatro precisam de tradução à mão.
  */
  data: {
    hoje: "Hoje",
    ontem: "Ontem",
    hojeAs: "hoje às {{hora}}",
    ontemAs: "ontem às {{hora}}",
  },
  digitando: {
    um: "{{nome}} está digitando…",
    dois: "{{primeiro}} e {{segundo}} estão digitando…",
    varios: "{{quantidade}} pessoas estão digitando…",
  },
  mensagem: {
    usou: "usou",
    fixada: "fixada",
    editado: "(editado)",
    ignorada: "Mensagem de alguém que você ignora.",
    mostrar: "Mostrar",
    escPara: "Esc para",
    cancelar: "cancelar",
    enterParaSalvar: "Enter para salvar",
    falhou: "Não foi enviada. Tentar de novo",
    naoLidasDaqui: "Não lidas a partir daqui.",
    linkCopiado: "Link copiado.",
    idCopiado: "ID copiado.",
    naoDeuParaCopiar: "Seu navegador não deixou copiar.",
    apagarTitulo: "Apagar mensagem?",
    apagarDescricao: "Ela some para todo mundo do canal. Não dá pra recuperar.",
    apagarAcao: "Apagar",
    citacaoAnexo: "clique para ver o anexo",
    citacaoSumiu: "A mensagem original não está mais aqui.",
    reagirCom: "Reagir com {{emoji}} — segure para super reagir",
    segureParaSuper: "{{emoji}} — segure para super reagir",
  },
  acoes: {
    reagir: "Reagir",
    responder: "Responder",
    encaminhar: "Encaminhar",
    favoritar: "Favoritar mensagem",
    tirarDosFavoritos: "Tirar dos favoritos",
    marcarNaoLida: "Marcar como não lida",
    copiarLink: "Copiar link da mensagem",
    copiarId: "Copiar ID da mensagem",
    fixar: "Fixar mensagem",
    desafixar: "Desafixar",
    editar: "Editar",
    apagar: "Apagar",
    mais: "Mais",
    adicionarReacao: "Adicionar reação",
    superReagirCom: "Super reagir com {{emoji}}",
    fixarMensagem: "Fixar mensagem",
    desafixarMensagem: "Desafixar mensagem",
    editarMensagem: "Editar mensagem",
    apagarMensagem: "Apagar mensagem",
  },
  mencao: {
    cargo: "Menção de cargo",
    pessoa: "Menção",
    alguem: "alguém",
    cargoSemNome: "cargo",
    here: "Notifica quem está online",
    everyone: "Notifica o servidor",
  },
  codigo: {
    copiar: "Copiar",
    copiado: "Copiado",
    copiarAria: "Copiar o código",
    copiadoAria: "Código copiado",
  },
  caixa: {
    escrever: "Conversar em #{{canal}}",
    escreverSemCanal: "Conversar",
    semPermissao: "Você não tem permissão para enviar mensagens neste canal",
    solteParaAnexar: "Solte para anexar",
    respondendoPara: "Respondendo para",
    vaiNotificar: "A pessoa vai ser notificada",
    naoVaiNotificar: "A pessoa não vai ser notificada",
    ligado: "ligado",
    desligado: "desligado",
    pararDeResponder: "Parar de responder",
    mais: "Mais",
    enviarArquivo: "Enviar um arquivo",
    criarEnquete: "Criar enquete",
    expressoes: "Emoji, GIF e figurinhas",
    enviar: "Enviar",
    aguardandoEnvio: "Aguardando o upload",
    modoLento: "Modo lento ativo ({{tempo}})",
    modoLentoDica:
      "O modo lento está definido como {{segundos}}s. Aguarde antes de enviar outra mensagem.",
  },
  anexos: {
    enviando: "Enviando…",
    modificar: "Modificar {{arquivo}}",
    remover: "Remover {{arquivo}}",
    ver: "Ver {{arquivo}}",
    mostrarSpoiler: "Mostrar spoiler: {{arquivo}}",
    spoiler: "spoiler",
    spoilerTitulo: "Spoiler",
    editarTitulo: "Editar anexo",
    nomeDoArquivo: "Nome do arquivo",
    descricao: "Descrição do texto alternativo",
    descricaoDica: "Descreva esta mídia para leitores de tela",
    marcarSpoiler: "Marcar como spoiler",
    cancelar: "Cancelar",
    salvar: "Salvar",
  },
  cartao: {
    tocador: "Tocador",
    abrir: "Abrir {{destino}}",
    tocar: "Tocar {{titulo}}",
    video: "vídeo",
    verImagem: "Ver imagem",
  },
  /*
    Singular e plural em duas chaves, e não com o plural do i18next.

    O `_one`/`_other` dele resolveria melhor o russo e o polonês, que têm
    três e quatro formas — mas cada idioma passaria a ter um conjunto de
    chaves DIFERENTE, e é justamente a igualdade entre os trinta e quatro
    catálogos que o teste usa para achar tradução faltando. Duas chaves
    perdem o caso raro; catálogo sem conferência perde todos.
  */
  enquete: {
    titulo: "Enquete",
    encerrada: "Enquete encerrada",
    variasRespostas: "Enquete — várias respostas",
    umVoto: "{{quantidade}} voto",
    votos: "{{quantidade}} votos",
    umVotoNoTotal: "{{quantidade}} voto no total",
    votosNoTotal: "{{quantidade}} votos no total",
    encerraEm: "encerra {{quando}}",
    encerrarAgora: "Encerrar agora",
  },
  fixadas: {
    titulo: "Mensagens fixadas",
    vazio: "Este canal não tem mensagens fixadas… por enquanto.",
    desafixar: "Desafixar",
    anexo: "(anexo)",
    enquete: "(enquete)",
    dicaRotulo: "FICA A DICA:",
    dica: "quem tem a permissão “Gerenciar mensagens” pode fixar direto no menu da mensagem.",
  },
  encaminhar: {
    titulo: "Encaminhar mensagem",
    paraOnde: "Para onde?",
    semTexto: "(mensagem sem texto)",
    nenhumLugar: "Nenhum lugar com esse nome.",
    canais: "Canais",
    conversas: "Conversas",
  },
};
