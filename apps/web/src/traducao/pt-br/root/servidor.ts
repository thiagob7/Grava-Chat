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

  /// Os nomes das seções na lateral. "Perfil", "Cargos" e as outras reaproveitam
  /// o título da própria seção; só estas quatro não têm de onde tirar.
  abas: {
    expressoes: "Expressões",
    pessoas: "Pessoas",
    apps: "Apps",
    moderacao: "Moderação",
    banimentos: "Banimentos",
  },

  auditoria: {
    titulo: "Registro de auditoria",
    porUsuario: "Filtrar por usuário",
    porAcao: "Filtrar por ação",
    vazio: "Nada registrado ainda com esse filtro.",
    motivo: "Motivo:",
    todasAsAcoes: "Todas as ações",
    todosOsUsuarios: "Todos os usuários",
    filtroMembros: "Membros",
    filtroCanais: "Canais",
    filtroEmojis: "Emojis",
    filtroServidor: "Servidor",
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
    tudoVai:
      "Todos os canais, mensagens e convites de {{servidor}} serão apagados para os {{membros}} membros. Ninguém consegue recuperar depois.",
    digite: "Digite {{servidor}} para confirmar",
  },

  emblemas: {
    titulo: "Emblemas",
    vazio: "Nenhum emblema ainda.",
    novo: "Novo emblema",
    apagarDescricao: "Ele sai de quem estiver usando. Não dá pra desfazer.",
  },

  convites: {
    titulo: "Convites",
    descricao: "Todos os links de convite ativos deste servidor.",
    vazio: "Nenhum convite criado ainda.",
    revogar: "Revogar convite",
    revogarTitulo: "Revogar convite?",
    revogarAcao: "Revogar",
    revogarDescricao:
      "O link {{codigo}} para de funcionar na hora. Quem já entrou por ele continua no servidor.",
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
    opcionais:
      "username e avatar_url são opcionais e valem por mensagem. O limite é de 5 mensagens a cada 5 segundos.",
    apagarDescricao:
      "A URL para de funcionar na hora. As mensagens que ele já mandou continuam no canal.",
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
    semCanal: "Sem canal de sistema",
  },

  automod: {
    titulo: "AutoMod",
    descricao:
      "Filtros que moderam sozinhos, antes de a mensagem existir. Quem administra o servidor nunca é filtrado — e cargos isentos passam direto.",
    palavras: {
      titulo: "Bloquear palavras personalizadas",
      descricao: "Sua lista de palavras que ninguém pode escrever.",
    },
    mencoes: {
      titulo: "Bloquear spam de menções",
      descricao: "Bloqueia mensagem com menções demais de uma vez.",
    },
    links: {
      titulo: "Bloquear links",
      descricao: "Segura qualquer endereço colado no chat.",
    },
    definir: "Definir",
    nomeDaRegra: "Nome da regra",
    bloqueadas: "Palavras bloqueadas",
    digiteEnter: "Digite e aperte Enter",
    comparacao:
      "A comparação ignora maiúscula, acento e pontuação — e não pega palavra dentro de outra (\"burro\" não bloqueia \"burrocracia\").",
    aPartirDe: "Bloquear a partir de quantas menções",
    oQueFazer: "O que fazer",
    canalDoAlerta: "Canal do alerta",
    escolhaCanal: "Escolha um canal",
    castigo: "Castigo (minutos)",
    isentos: "Cargos isentos",
    semCargos: "Nenhum cargo criado ainda.",
    salvarRegra: "Salvar regra",
    apagar: "Apagar regra",
    excluirTitulo: "Excluir regra do AutoMod?",
    excluirDescricao:
      "O servidor deixa de filtrar por ela na hora. Dá pra criar de novo, mas a configuração atual se perde.",
    excluirAcao: "Excluir regra",
  },

  cargos: {
    titulo: "Cargos",
    descricao:
      "Cargos dão nome, cor e poderes. Quem está mais alto na lista manda em quem está abaixo — e ninguém mexe em cargo igual ou acima do próprio.",
    criar: "Criar cargo",
    vazio: "Nenhum cargo ainda.",
    abaExibicao: "Exibição",
    abaPermissoes: "Permissões",
    abaMembros: "Membros — {{quantos}}",
    everyone: "Vale para todo mundo no servidor. É a base sobre a qual os outros cargos somam.",
    nomeDoCargo: "Nome do cargo",
    cor: "Cor do cargo",
    corDica: "Pinta o nome de quem tem o cargo na lista de membros e no chat.",
    semCor: "Sem cor",
    corPersonalizada: "Cor personalizada",
    estilo: "Estilo do nome",
    segundaCor: "Segunda cor",
    segundaCorDica: "Sem ela, o gradiente cai para cor sólida — não some.",
    limparSegundaCor: "Limpar segunda cor",
    icone: "Ícone",
    iconeDica: "Aparece ao lado do cargo no cartão de perfil de quem o tem.",
    exibirSeparado: "Exibir separado dos outros membros",
    exibirSeparadoDica: "O cargo ganha uma seção própria na lista de membros.",
    permitirMencionar: "Permitir mencionar este cargo",
    permitirMencionarDica: "Qualquer um poderá notificar todo mundo que tem o cargo.",
    semPoderDeConceder: "{{descricao}} (você não tem esta permissão para conceder)",
    adicionar: "Adicionar alguém a este cargo",
    tirar: "Tirar o cargo",
    semNinguem: "Ninguém tem este cargo ainda.",
    apagar: "Apagar cargo",
    excluirTitulo: "Excluir cargo \"{{nome}}\"?",
    excluirDescricao: "Quem tem esse cargo perde tudo o que ele dava. Não dá pra desfazer.",
    excluirAcao: "Excluir cargo",
  },

  membros: {
    procurar: "Pesquisar pelo nome ou usuário",
    membroDesde: "Membro desde",
    vazio: "Ninguém encontrado.",
    acoesPara: "Ações para {{nome}}",
    deCastigo: "de castigo",
    tirarCastigo: "Tirar do castigo",
    castigo5min: "5 minutos",
    castigo1h: "1 hora",
    castigo1d: "1 dia",
    castigo1s: "1 semana",
    expulsar: "Expulsar",
    expulsarTitulo: "Expulsar {{nome}}?",
    expulsarDescricao:
      "sai de {{servidor}} na hora. Pode entrar de novo com um convite — expulsar não impede a volta.",
    banir: "Banir",
    banirTitulo: "Banir {{nome}}?",
    banirDescricao:
      "sai de {{servidor}} e não consegue voltar, nem com convite, até ser desbanido.",
    motivo: "Motivo (opcional)",
    motivoDica: "Fica registrado na auditoria",
  },

  perfil: {
    titulo: "Perfil do servidor",
    descricao: "É assim que seu servidor aparece na lista e nos links de convite.",
    icone: "Ícone",
    faixa: "Faixa do topo",
    nomeDoServidor: "Nome do servidor",
    campoDescricao: "Descrição",
    doQueE: "Do que é esse servidor?",
    comprimido: "Comprimido antes de subir: {{economia}}",
  },

  etiqueta: {
    titulo: "Tag do servidor",
    descricao:
      "Uma etiqueta de até 4 letras que aparece ao lado do nome de quem é membro — no chat e na lista de pessoas. Aqui é de graça: sem impulso, sem nível.",
    escolhaNome: "Escolha um nome",
    limite: "No máximo 4 caracteres, letras e números.",
    escolhaInsignia: "Escolha uma insígnia",
    voce: "Você",
    fala1: "alguém aí pra jogar?",
    fala2: "dá uma olhada na minha tag!",
    fala3: "eita, como conseguiu isso",
  },

  expressoes: {
    comoUsar:
      "Adicione até {{limite}} emojis que todo mundo pode usar neste servidor. Digite :nome: no chat para mandar.",
    imagem: "Imagem",
    enviadoPor: "Enviado por",
    semEmoji: "Nenhum emoji ainda.",
    figurinhas: "Figurinhas",
    enviarFigurinha: "Enviar figurinha",
    nomeDaFigurinha: "Nome da figurinha",
    exemploFigurinha: "Ex: abraço de gatinho",
    figurinhaGrande: "A figurinha passa de {{limite}}.",
    deixaPraLa: "Deixa pra lá",
    sons: "Painel de efeitos sonoros",
    enviarSom: "Enviar som",
    nomeDoSom: "Nome do som",
    semSom: "Nenhum som ainda.",
    somGrande: "O som passa de {{limite}}.",
    emojiRelacionado: "Emoji relacionado",
    ouvir: "Ouvir",
    ouvirAssim: "Ouvir assim",
    volumeDe: "Volume de {{nome}}",
    volumeDica:
      "Vale pra todo mundo do servidor. Cada pessoa ainda pode abaixar os sons só pra ela, no painel da chamada.",
    falhaEnvio: "Não deu pra subir o arquivo.",
    excluirTitulo: "Excluir {{tipo}} \"{{nome}}\"?",
    excluirDescricao:
      "Some do servidor para todo mundo. As mensagens que já usaram continuam como estão.",
  },

  canal: {
    visaoGeral: "Visão geral",
    nome: "Nome do canal",
    topico: "Tópico do canal",
    topicoDica: "Do que se fala aqui?",
    modoLento:
      "Cada pessoa só manda uma mensagem por intervalo. Quem gerencia mensagens ou canais passa direto.",
    visibilidade: "Visibilidade do conteúdo",
    padrao: "Padrão",
    padraoDica: "O conteúdo do canal fica sempre visível.",
    spoiler: "Canal de spoiler",
    spoilerDica:
      "Marque este canal como contendo spoilers, para que plot twists e assuntos pesados fiquem ocultos até alguém escolher ver.",
    idade: "Canal com restrição de idade",
    idadeDica: "Quem entrar precisa confirmar que é maior de idade para ver o conteúdo.",
    bitrateDica: "Passar de 64 kbps pode atrapalhar quem tem internet ruim.",
    qualidadeDeVideo: "Qualidade do vídeo",
    automatica: "Automática",
    limite: "Limite de usuários — {{valor}}",
    pessoas: "{{quantos}} pessoas",
    semLimite: "sem limite",
    permissoesDescricao:
      "Aqui você muda o que vale neste canal. O que ficar em “herdar” continua seguindo o cargo.",
    excluir: {
      titulo: "Excluir canal",
      historico: "Todo o histórico de {{canal}} vai junto, para todo mundo.",
      digite: "Digite {{canal}} para confirmar",
    },
  },

  moderacao: {
    titulo: "Visualização de moderador",
    semPermissao: "Você precisa da permissão “Moderar membros” para ver isto.",
    fecharEsc: "Fechar (Esc)",
    atividade: "Atividade no servidor",
    mensagens: "Mensagens",
    links: "Links",
    midia: "Mídia",
    acoesNaAuditoria: "Ações na auditoria",
    moderacoesSofridas: "Moderações sofridas",
    permissoes: "Permissões ({{quantas}})",
    semPermissaoEspecial: "Nenhuma permissão especial.",
    conta: "Conta",
    entrouNoServidor: "Entrou no servidor",
    contaCriadaEm: "Conta criada em",
    deCastigoAte: "De castigo até",
    formaDeAdesao: "Forma de adesão",
    mensagem: "Mensagem",
    castigo: "Castigo",
    copiarId: "Copiar ID",
    idCopiado: "ID copiado.",
    adicionarCargo: "Adicionar cargo",
    semCargos: "Nenhum cargo criado",
    soEveryone: "Só o @everyone.",
    voltar: "Voltar",
    vazio: "Nada por aqui.",
    cinquenta: "Mostrando as 50 mais recentes.",
    irParaMensagem: "Ir para mensagem",
    precisaSerAmigo: "Vocês precisam ser amigos para conversar.",
    expulsarDescricao: "Sai do servidor na hora, mas pode voltar com um convite.",
    banirDescricao:
      "Sai do servidor e não consegue voltar, nem com convite, até ser desbanido.",
    castigarTitulo: "Castigar {{nome}}?",
    castigoDescricao: "Enquanto durar, não escreve nem fala em nenhum canal do servidor.",
    aplicarCastigo: "Aplicar castigo",
    duracao: "Duração em minutos",
    informeDuracao: "Informe a duração em minutos.",
  },
};
