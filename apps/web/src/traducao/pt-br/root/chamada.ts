/// A chamada: o painel de voz, o palco, a barra de controles, o menu de quem
/// está na sala, o compartilhamento de tela, a supressão de ruído e os avisos
/// de permissão. Quarta área a sair do português cravado.
export const chamada = {
  conectando: "Conectando à chamada…",
  naoEntrou: "Não deu pra entrar na chamada",
  sair: "Sair da chamada",
  sairDaVoz: "Sair da chamada de voz",
  desconectar: "Desconectar",
  voltar: "Voltar para a chamada",
  voltarAosQuadros: "Voltar para os quadros da chamada",
  fecharChat: "Fechar chat",
  mostrarChat: "Mostrar o chat",
  convidar: "Convidar para a chamada",
  carregandoPrevia: "Carregando a prévia…",
  maisOpcoes: "Mais opções",
  deVideo: "Chamada de vídeo",
  deVoz: "Chamada de voz",
  alguem: "Alguém",
  volume: {
    entrada: "Volume de entrada",
    saida: "Volume de saída",
    live: "Volume da live",
    liveComPorcento: "Volume da live ({{porcento}}%)",
    liveSemSom: "Live sem som",
  },
  aparelhos: {
    entrada: "Dispositivo de entrada",
    saida: "Dispositivo de saída",
    camera: "Câmera",
    /// Nome de reserva quando o navegador não diz qual é o aparelho — vira
    /// "Microfone 2", "Saída 3". Sem ele a lista teria linhas em branco.
    microfone: "Microfone",
    saidaCurto: "Saída",
    /*
      Dois "o do sistema" porque o português concorda com o substantivo: o
      DISPOSITIVO é ele, a CÂMERA é ela. Idioma sem gênero repete o mesmo texto
      nos dois e ninguém percebe; idioma que tem, acerta.
    */
    oDoSistema: "O do sistema",
    aDoSistema: "A do sistema",
    semEscolhaDeSaida:
      "Este navegador não deixa escolher a saída — quem manda é o sistema.",
    espelhar: "Espelhar a minha câmera",
    configEntrada: "Configurações de entrada",
    configSaida: "Configurações de saída",
    configCamera: "Configurações da câmera",
    configAudioEVideo: "Configurações de áudio e vídeo",
  },
  tela: {
    compartilhar: "Compartilhar tela",
    compartilharAcao: "Compartilhar",
    cancelar: "Cancelar",
    telas: "Telas",
    janelas: "Janelas",
    somDoComputador: "Levar o som do computador junto",
    somDoSistema: "Levar o som do sistema junto",
    configCompartilhamento: "Configurações de compartilhamento",
    mostrarSemVideo: "Mostrar quem está sem vídeo",
    semFontes: "O sistema não devolveu nenhuma tela ou janela para compartilhar.",
    pararDeCompartilhar: "Parar de compartilhar",
    encerrarTransmissao: "Encerrar a transmissão",
  },
  live: {
    etiqueta: "Ao vivo",
    etiquetaMaiuscula: "AO VIVO",
    assistir: "Assistir à transmissão",
    assistirPessoa: "Assistir a {{nome}}",
    pararDeAssistir: "Parar de assistir",
  },
  membro: {
    mudarMeuApelido: "Mudar meu apelido",
    meuMicrofone: "Meu microfone",
    ouvirChamada: "Ouvir a chamada",
    copiarMeuId: "Copiar meu ID",
    idCopiado: "ID copiado.",
    mensagem: "Mensagem",
    silenciar: "Silenciar",
    alterarApelido: "Alterar apelido",
    cargos: "Cargos",
    semCargo: "Nenhum cargo criado",
    moverPara: "Mover para",
    silenciarNoServidor: "Silenciar voz no servidor",
    desativarAudioNoServidor: "Desativar áudio no servidor",
    desconectar: "Desconectar",
    apelidoTitulo: "Seu apelido neste servidor",
    apelidoDeAlguem: "Apelido de {{nome}}",
    apelidoCampo: "Apelido",
    apelidoDicaPropria: "Vale só aqui. Em branco, volta a valer seu nome de sempre.",
    apelidoDicaDeOutro:
      "Vale só neste servidor. Deixe em branco para voltar ao nome original.",
  },
  detalhes: {
    abrir: "Detalhes de voz",
    titulo: "Detalhes de Voz",
    conexao: "Conexão",
    pingMedio: "Ping médio",
    ultimoPing: "Último ping",
    perda: "Perda de pacotes enviados",
    medindo: "Medindo…",
    criptografado: "Criptografado até o servidor (DTLS-SRTP)",
    explicacao:
      "Acima de 250 ms dá pra notar atraso na conversa — as pessoas começam a se atropelar. Perda de pacotes acima de 10% deixa a voz robótica. Nos dois casos, o problema quase sempre está entre você e a internet: tente cabo em vez de Wi-Fi, ou reiniciar o roteador.",
  },
  microfone: {
    bloqueado:
      "Microfone bloqueado — você está só ouvindo. Libere o acesso nas permissões do navegador.",
    bloqueadoNoMac: "O macOS está bloqueando o microfone. Marque o",
    caminhoNoMac: "Ajustes do Sistema → Privacidade e Segurança → Microfone",
    abrirAjustes: "Abrir os ajustes",
    vaiReabrir: "O macOS vai pedir pra reabrir o aplicativo.",
    naoAbriu:
      "Não deu pra abrir o microfone — você está só ouvindo. Confira o dispositivo em Configurações → Voz e vídeo.",
  },
  gravacaoDeTela: {
    bloqueada:
      "O macOS ainda não liberou a gravação de tela. Sem isso o compartilhamento sai preto.",
    marque: "Marque o",
    reabra: "em Gravação de Tela e reabra o aplicativo.",
    /*
      O caso que a mensagem antiga não cobria, e que é o MAIS comum aqui.

      A assinatura do aplicativo é ad-hoc, e ela muda a cada build. O macOS
      amarra a permissão de tela à assinatura, então depois de uma atualização
      o interruptor continua ligado — o registro é que deixou de conferir. A
      pessoa olha os ajustes, vê tudo marcado, e o app insiste que não tem
      permissão. Desmarcar e marcar de novo reescreve o registro com a
      assinatura de agora.
    */
    jaMarcado:
      "Se já estiver marcado, a permissão envelheceu na última atualização: desmarque, marque de novo e reabra.",
  },
  ruido: {
    titulo: "Supressão de ruído",
    explicacao:
      "Tire o barulho de fundo da sua voz. Tente bater palmas ou arrastar o teclado enquanto fala — quem está na chamada só ouve você.",
    semSuporte:
      "Este navegador não roda a supressão avançada. Continua valendo a do próprio navegador, que é mais fraca.",
    aplicando: "Aplicando na chamada…",
    faleParaTestar: "Fale para testar",
    verdeQuandoPassa: "Verde quando sua voz passa.",
    teOuvindo: "Estão te ouvindo agora.",
    feitoCom: "Feito com",
    aquiNoAparelho: ", aqui no seu aparelho",
    ajustes: "Ajustes",
  },
  permissoes: {
    titulo: "Permissões do macOS",
    detalhe:
      "O macOS pergunta uma vez só, e depois só muda pelo painel dele. Aqui dá pra ver o que está valendo e resolver o que faltou.",
    concedida: "Concedida",
    negada: "Negada",
    naoPedida: "Não pedida",
    permitir: "Permitir",
    abrirAjustes: "Abrir ajustes",
    microfone: "Microfone",
    microfoneDetalhe: "Falar nas chamadas e testar sua entrada.",
    camera: "Câmera",
    cameraDetalhe: "Ligar o vídeo na chamada.",
    tela: "Gravação de tela",
    telaDetalhe: "Compartilhar a tela e as janelas.",
    monitoramento: "Monitoramento de entrada",
    monitoramentoDetalhe:
      "Usar o push-to-talk mesmo com o Gravaê em segundo plano.",
  },
  jaConectado: {
    titulo: "Você já está nesta chamada",
    trazer: "Trazer a chamada para cá",
    deixar: "Deixar como está",
    detalhe:
      "Trazendo para cá, a outra ponta sai da chamada — sua conta fica em um lugar de cada vez.",
  },
};
