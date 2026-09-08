import { cn } from "~/lib/utils";

/*
  Nomes que os temas da referência procuram, dados aos nossos elementos.

  Um tema deles não pinta variável e pronto: ele mira lugar da tela, com o nome
  de classe que o build deles gera — `[class*="GuildNavbar.module__guildNavbarContainer_"]`
  — e com o `data-flx` que o codemod deles carimba. É assim que saem as bordas
  por painel, o espaço entre eles, o hover na borda e os rótulos.

  Esses nomes não descrevem código deles: descrevem um lugar, e o lugar existe
  aqui igual. Então damos os mesmos nomes aos nossos elementos — pela mesma
  razão que um editor de texto abre .docx sem ser o Word. Nada de CSS ou de
  código deles foi copiado; o que atravessa é o vocabulário.

  O que continua sem funcionar é o que um tema faz mirando pedaço que só existe
  lá. Para isso é que serve o nosso `data-gc`.
*/

interface Lugar {
  /// Fragmentos que os seletores `[class*="…"]` deles encontram.
  classes: string[];
  /// Valor do data-flx, quando o tema mira por atributo.
  flx?: string;
}

/*
  Nem todo nome deles carrega a mesma coisa. Uns só pintam — borda, fundo, raio,
  desfoque, rótulo — e cabem em qualquer elemento que faça o papel. Outros o tema
  usa para MEDIR, e aí o nome só serve se a nossa peça tiver a mesma posição na
  árvore.

  Foi por ignorar isso que a tela quebrou: o `guildListScrollerWrapper` lá é o
  rolador dentro da coluna do trilho, e ganha `width: -webkit-fill-available`
  para preencher a coluna. Aqui o nosso trilho É a coluna, então ele passou a
  preencher a linha toda.

  Nome que mede e não casa fica de fora. Quando ele traz coisa boa junto — o
  painel do usuário traz borda e rótulo com a largura errada — o nome entra e a
  medida volta pela folha de correções.
*/

export const LUGARES = {
  /*
    O container de fora de tudo, e o motivo de um tema transparente não pegar.

    Um tema de fundo com imagem põe a imagem num `body::before` com `z-index:
    -1` e depois manda cada superfície ficar transparente, uma por uma, pelo
    nome. O `app-container` e o `outline-frame.frame` estão nessa lista — e a
    nossa `.moldura-externa` pinta `surface-2`. Sem esses dois nomes, a imagem
    ficava atrás de um retângulo opaco do tamanho da tela: o tema aplicava,
    sete painéis ficavam transparentes, e a tela não mudava nada.
  */
  containerDoApp: {
    classes: ["App.module__appContainer_gc"],
    flx: "app.app.app-wrapper.app-container",
  },

  /// A moldura de tudo: é onde entra o respiro entre painéis.
  molduraDoApp: { classes: ["AppLayout.module__appLayout_gc"] },

  /*
    O chrome — a moldura de fora e os divisores — com nome.

    A referência não desenha borda em painel nenhum. Ele desenha UMA moldura de 1px
    em volta de tudo (o `OutlineFrame`) e põe os divisores como elementos
    próprios, absolutos, de 1px. Um tema que quer painéis soltos apaga a
    moldura e esconde os divisores — e é isso que o Galaxy faz.

    Aqui a borda vivia em cada painel e o anel no `#app`, sem nome. O tema não
    tinha como apagar, e a nossa linha ficava embaixo do contorno dele: duas
    linhas coladas, sem espaço para o halo. Agora o chrome tem os nomes deles,
    e o visual padrão é o mesmo — só mudou quem desenha.
  */
  molduraExterna: {
    classes: ["OutlineFrame.module__frame_gc"],
    flx: "app.outline-frame.frame",
  },
  divisorDaLateral: { classes: ["OutlineFrame.module__divider_gc"] },
  divisorDosMembros: { classes: ["ChannelIndexPage.module__memberListDivider_gc"] },

  /// A linha que segura trilho, lateral e miolo.
  linhaDoApp: {
    classes: [
      "GuildsLayout.module__guildsLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContent_gc",
    ],
    flx: "app.guilds-layout.guilds-layout",
  },

  /// A coluna do miolo: cabeçalho em cima, conversa embaixo.
  colunaDoMiolo: {
    classes: [
      "GuildsLayout.module__contentContainer_gc",
      "ChannelIndexPage.module__channelGrid_gc",
    ],
    flx: "app.guilds-layout.content-container",
  },

  /*
    O `guildListScrollerWrapper` traz duas coisas na mesma regra: a altura, que
    encurta o trilho para o rodapé caber embaixo, e a largura, que aqui não
    serve porque o nosso trilho já é a coluna. Ele entra pela altura, e a
    largura volta pela folha de correções.
  */
  /*
    Os três níveis do trilho, como na referência.

    Lá é `nav.guildListScrollerWrapper` > `div.guildListScrollContainer` >
    `div.guildListContent`, e dentro dele duas seções: o topo (o botão de
    amigos e o divisor) e os servidores. Aqui era um `<nav>` só fazendo os
    cinco papéis — largura, rolagem, coluna, topo e lista — e um tema que
    encadeia dois desses nomes não tinha onde pousar.

    O `guildListScrollerWrapper` traz junto uma largura que aqui não serve,
    porque o nosso trilho já é a coluna; ela volta pela folha de correções.
  */
  trilhoDeServidores: {
    classes: ["GuildsLayout.module__guildListScrollerWrapper_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-scroller-wrapper",
  },
  roladorDoTrilho: {
    classes: ["GuildsLayout.module__guildListScrollContainer_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-scroll-container",
  },
  conteudoDoTrilho: {
    classes: ["GuildsLayout.module__guildListContent_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-content",
  },
  secaoDoTopoDoTrilho: {
    classes: ["GuildsLayout.module__guildListTopSection_gc"],
  },
  secaoDeServidores: {
    classes: ["GuildsLayout.module__guildListGuildsSection_gc"],
  },

  itemDoTrilho: { classes: ["GuildsLayout.module__guildListItem_gc"] },

  /*
    As peças de dentro do trilho. A coluna e o item já tinham nome; o ícone do
    servidor, a pilula que marca o ativo e o selo de não-lidas não tinham, então
    o tema pintava a faixa e parava nas bolinhas.

    Fica de fora tudo que é arrastar-e-soltar — `dropIndicator*`,
    `guildListDropZone*`, `guildListReorderTarget` — porque aqui reordenar
    servidor ainda não existe, e nome sem elemento quebra o teste de órfãos.
  */
  iconeDoServidor: { classes: ["GuildsLayout.module__guildIcon_gc"] },
  iconeDoServidorAtivo: { classes: ["GuildsLayout.module__guildIconSelected_gc"] },
  /*
    A pílula em dois: a que se posiciona na beira e a barra que pinta.

    Os dois nomes moravam no mesmo elemento, e com eles o `guild-indicator` e o
    `guild-indicator-bar` — o Gruvbox arredonda a barra, não a caixa. Como a
    caixa já era `absolute left-0` e a barra só precisa preencher, sair de um
    elemento para dois custa uma div.
  */
  pilulaDoServidor: {
    classes: ["GuildsLayout.module__guildIndicator_gc"],
    flx: "app.sidebar-nav.guild-list-item-presentation.guild-indicator",
  },
  barraDaPilulaDoServidor: {
    classes: ["GuildsLayout.module__guildIndicatorBar_gc"],
    flx: "app.sidebar-nav.guild-list-item-presentation.guild-indicator-bar",
  },
  divisorDoTrilho: { classes: ["GuildsLayout.module__guildDivider_gc"] },
  seloDoServidor: { classes: ["GuildsLayout.module__guildBadge_gc"] },

  listaDeCanais: { classes: ["GuildNavbar.module__guildNavbarContainer_gc"] },

  listaDeConversas: {
    classes: ["DMList.module__dmListContainer_gc"],
    flx: "channel.direct-message.dm-list.dm-list-container",
  },

  /*
    A página de conversas, com os nomes que a referência dá por `data-flx`.

    O `DMLayout` deles não tem folha de módulo — quem mira essa área mira o
    atributo, não a classe. O Gruvbox, por exemplo, pinta a coluna do meio por
    `[data-flx="channel.direct-message.dm-layout.content-column--2"]`.
  */
  paginaDeConversas: { classes: [], flx: "channel.direct-message.dm-layout.dm-layout-container" },
  colunaDaConversaDireta: {
    classes: [],
    flx: "channel.direct-message.dm-layout.content-column--2",
  },
  roladorDeConversas: {
    classes: [],
    flx: "channel.direct-message.dm-list.desktop-scroller",
  },

  itemDeConversa: { classes: ["DMList.module__dmItem_gc"] },
  itemDeConversaAtivo: { classes: ["DMList.module__dmItemSelected_gc"] },
  itemDeCanalAtivo: {
    classes: ["ChannelItemSurface.module__channelItemSurfaceSelected_gc"],
  },

  /*
    Dois elementos, não um. O de fora é o painel — é ele que ganha borda,
    rótulo e a largura que cobre trilho e lateral. O de dentro é o cartão, e o
    tema o quer transparente para a borda de fora aparecer sozinha.

    Foi por juntar os dois num só que a borda do usuário saiu curta.
  */
  areaDoUsuario: {
    classes: ["GuildsLayout.module__userAreaWrapper_gc"],
    flx: "app.guilds-layout.user-area-wrapper",
  },

  /*
    O miolo da área do usuário, na mesma árvore que a deles.

    Lá são cinco peças com nome: o botão que abre o perfil (`userInfo`), a
    caixa dos três controles (`controlsContainer`), e o status, que é um rolo
    de duas linhas — `hoverRoll` por fora, `defaultState` e `hovered` dentro.

    Aqui os três controles eram irmãos soltos do botão. Enquanto foram, um tema
    que faz `display: inline-flex; width: auto` na linha — o Galaxy faz — não
    tinha como agrupar, e os botões saíam espalhados. Com a caixa, a linha tem
    duas partes e encolhe como a deles.
  */
  linhaDeInfoDoUsuario: { classes: ["UserArea.module__userInfo_gc"] },
  controlesDoUsuario: { classes: ["UserArea.module__controlsContainer_gc"] },
  estadoPadraoDoStatus: { classes: ["UserArea.module__defaultState_gc"] },
  estadoNoHoverDoStatus: { classes: ["UserArea.module__hovered_gc"] },
  chamadaNoRodape: { classes: ["UserArea.module__voiceConnectionWrapper_gc"] },
  cartaoDoUsuario: { classes: ["UserArea.module__userAreaInnerWrapper_gc"] },

  /*
    A faixa de título do aplicativo. Os botões de janela ficam de fora: no mac
    quem desenha é o sistema, então `controls` e `controlButton` não têm onde
    pousar — e o trecho que os pinta é justamente o que não pega aqui.
  */
  barraDeTitulo: {
    classes: ["NativeTitlebar.module__titlebar_gc"],
    flx: "app.native-titlebar.titlebar",
  },
  /*
    Os três botões de janela, e a caixa deles.

    Só existem onde a moldura é nossa — fora do macOS. Lá as bolinhas são do
    sistema e CSS não alcança, o que vale para qualquer app, não só o nosso.
  */
  controlesDaJanela: { classes: ["NativeTitlebar.module__controls_gc"] },
  botaoDaJanela: { classes: ["NativeTitlebar.module__controlButton_gc"] },

  /*
    O cabeçalho do canal em dois, como na referência: a faixa por fora
    (`headerWrapper`) e o miolo que carrega o conteúdo (`headerContainer`).

    Os dois moravam no mesmo elemento e uma regra de um tema da comunidade os encadeia —
    `.headerWrapper .headerContainer { background-color }` —, que nome no mesmo
    lugar não casa. Separar aqui é barato: a faixa fica com altura, borda e
    fundo (é o que o Gruvbox apaga para soltar os painéis), e o miolo fica com
    a linha de ícone, nome e assunto.
  */
  topoDoCanal: { classes: ["ChannelHeader.module__headerWrapper_gc"] },
  mioloDoTopoDoCanal: { classes: ["ChannelHeader.module__headerContainer_gc"] },

  listaDeMembros: {
    classes: ["MemberListContainer.module__memberListContainer_gc"],
  },


  areaDeMensagens: {
    classes: ["ChannelChatLayout.module__messagesArea_gc"],
  },

  /*
    As duas maiores superfícies da tela, e as duas que mais faltavam.

    A conta que trouxe elas não foi olhar print: foi listar as regras do tema
    que pintam FUNDO e perguntar quais não achavam ninguém. `Scroller` e
    `ChannelChatLayout__container` estavam no topo — juntas cobrem a coluna da
    conversa inteira, que é justamente o que dava a impressão de "sem tema".

    O `Scroller` deles é genérico: vale para qualquer painel que rola. Aqui vai
    na lista de mensagens, que é onde a área é grande o bastante para se ver.
  */
  colunaDaConversa: {
    classes: ["ChannelChatLayout.module__container_gc"],
    flx: "channel.channel-chat-layout.container",
  },
  rolador: { classes: ["Scroller.module__scroller_gc", "Scroller.module__scrollerWrap_gc"] },
  conteudoDasMensagens: {
    classes: ["ChannelMessages.module__scrollerInner_gc"],
    flx: "channel.message-group.rendered-messages.div",
  },

  conteudoDoRolador: {
    classes: ["Scroller.module__scrollerChildren_gc"],
    flx: "ui.scroller.scroller-children",
  },
  molduraDoCabecalhoDoServidor: { classes: ["GuildHeader.module__headerWrapper_gc"] },
  lateralInternaDeConfiguracoes: {
    classes: ["SettingsModalLayout.module__desktopSidebarInner_gc"],
    flx: "app.settings-modal-layout.settings-modal-desktop-sidebar.desktop-sidebar-inner",
  },
  seloDeMencao: { classes: ["MentionBadge.module__badge_gc"] },

  /// Mesma divisão da área do usuário: o painel de fora, o campo de dentro.
  caixaDeEscrever: {
    classes: ["ChannelChatLayout.module__textareaArea_gc"],
    flx: "channel.channel-chat-layout.textarea-area",
  },
  campoDeEscrever: {
    classes: ["InputWrapper.module__box_gc"],
    flx: "channel.lexical-channel-textarea-content.textarea-outer",
  },

  /*
    A pilha de dentro da caixa. Só o recuo entra.

    Ficam de fora todos os `TextareaInput.*`: o tema joga o último botão da
    linha para `position: absolute` e puxa a linha 15px para a direita, contando
    com a árvore deles. Aqui isso jogaria o botão de enviar para fora da caixa.
  */
  /// A pilha por fora, a linha por dentro — dois elementos, como lá.
  pilhaDeEscrever: { classes: ["InputWrapper.module__stackSection_gc"] },
  linhaDeEscrever: {
    classes: [
      "TextareaInput.module__textareaOuterRow_gc",
      "TextareaInput.module__mainWrapperDense_gc",
    ],
  },

  /*
    Os três pedaços de dentro da caixa de escrever.

    Lá a linha é uma grade de três colunas — o `+`, o texto, os botões — e cada
    coluna tem nome. Um tema que engorda a caixa mexe nos três com regras
    diferentes: o texto ganha respiro, os botões encolhem, o `+` fica no canto.
    Com um nome só para a linha inteira não dava para escrever nenhuma delas.
  */
  colunaDoTexto: { classes: ["TextareaInput.module__flexColumn_gc"] },
  botoesDaCaixa: { classes: ["TextareaInput.module__buttonContainerDense_gc"] },
  botaoDaCaixa: { classes: ["TextareaButton.module__button_gc"] },

  /// O que a pessoa está escrevendo. Lá é um parágrafo do editor; aqui, o campo.
  paragrafoDaCaixa: { classes: ["LexicalMessageComposer.module__paragraph_gc"] },

  /*
    A faixa fina de aviso acima da caixa e a pílula que mora nela.

    Os dois estavam no mesmo elemento, e o trilho é nome de MEDIDA — o Gruvbox
    lhe dá altura fixa. Com o nome no parágrafo, a pílula do modo lento é que
    esticava. Agora o trilho é a faixa e a pílula é a pílula, que é onde as três
    regras de pintura do Gruvbox (desfoque, folga e a borda no hover) pousam,
    do lado do balão de quem está digitando.
  */
  trilhoDeAviso: {
    classes: ["InputWrapper.module__statusRail_gc"],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-status-rail",
  },
  avisoDeModoLento: {
    classes: [],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-slowmode-slot",
  },

  /*
    A segunda leva saiu de contar, num tema de verdade, quais nomes ele mira e
    a gente não tinha. Estes são os que mais aparecem lá e têm equivalente aqui
    — a mensagem e o que mora dentro dela, a lista de membros e a busca.
  */
  grupoDeMensagens: { classes: [], flx: "channel.message-group.group" },
  corpoDaMensagem: { classes: ["Message.module__messageContent_gc"] },
  textoMarcado: { classes: ["Markup.module__markup_gc"] },
  /// A hora que só aparece no hover, na calha das mensagens agrupadas.
  horaAoPassarOMouse: { classes: ["Message.module__messageTimestampHover_gc"] },
  /// Mensagem que é só anexo. Lá a grade muda de forma quando não há texto.
  mensagemSemTexto: { classes: ["Message.module__messageNoText_gc"] },

  /*
    Os quatro níveis da mensagem, como na referência — e não dois, como estavam.

    Lá a linha é `message`, dentro dela a coluna é `container`, dentro dela o
    corpo é `messageContent`, e dentro dele o markdown renderizado é
    `Markup.markup`. Um tema escreve a cadeia inteira: só um tema da comunidade tem 35
    regras em `.messageContent .markup`.

    Enquanto dois desses nomes moraram no mesmo elemento, a cadeia não casava —
    `.A .B` exige que B seja descendente de A, e nome no mesmo lugar não é
    descendente de si próprio. As 35 regras não pegavam nada, mesmo com os dois
    nomes presentes. É o tipo de erro que não aparece contando nome.
  */
  molduraDaMensagem: { classes: ["Message.module__message_gc"] },
  colunaDaMensagem: { classes: ["Message.module__container_gc"] },

  /*
    O que a citação mostra da mensagem respondida, em três pedaços.

    Vale a pena separar: um tema que encolhe a citação mexe no avatar e no
    texto com regras diferentes — o avatar vira 12px, o texto perde a cor.
    Com um nome só para a linha inteira não dava para escrever nem uma.
  */
  avatarDaCitacao: { classes: ["Message.module__repliedAvatar_gc"] },
  nomeDaCitacao: { classes: ["Message.module__repliedUsername_gc"] },
  textoDaCitacao: { classes: ["Message.module__repliedTextPreview_gc"] },
  respondida: { classes: ["Message.module__repliedMessage_gc"] },

  /*
    As peças de dentro da mensagem. Antes o tema alcançava a moldura e o corpo,
    então conseguia pintar o fundo da linha, mas não o nome de quem falou, a
    hora, o avatar nem o balão de "está digitando".

    Ficam de fora os nomes de estado que a folha deles usa junto com `:hover` e
    os de modo compacto — `messageHovered`, `messageCompact`, `mobileLayout` e
    companhia. Aqui o compacto é decidido por prop, não por classe, e emprestar
    o nome faria o tema pintar a mensagem errada.
  */
  calhaDaMensagem: { classes: ["Message.module__messageGutterLeft_gc"] },
  avatarDaMensagem: { classes: ["Message.module__messageAvatar_gc"] },
  linhaDoAutor: {
    classes: ["Message.module__messageAuthorRow_gc", "Message.module__messageAuthorInfo_gc"],
  },
  nomeDoAutor: { classes: ["Message.module__messageUsername_gc"] },
  horaDaMensagem: { classes: ["Message.module__messageTimestamp_gc"] },
  textoDaMensagem: { classes: ["Message.module__messageText_gc"] },
  rotuloDeEditada: {
    classes: ["Message.module__editedLabel_gc", "Message.module__editedTimestamp_gc"],
  },
  balaoDeDigitando: {
    classes: ["Message.module__typingIndicator_gc", "Message.module__typingPill_gc"],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-typing-slot",
  },
  textoDeDigitando: { classes: ["Message.module__typingText_gc"] },
  mosaicoDeAnexos: { classes: ["AttachmentMosaic.module__mosaicContainerWrapper_gc"] },
  spoiler: { classes: ["Markup.module__blockSpoiler_gc"] },
  conteudoDoSpoiler: { classes: ["Markup.module__spoilerContent_gc"] },

  /*
    O que o texto da mensagem vira depois de formatado. Menção, link e código
    são o que um tema mais quer pintar depois do fundo, e não tinham nome.

    Tabela, alerta e LaTeX ficam de fora enquanto não renderizarmos nenhum dos
    três — nome sem elemento derruba o teste de órfãos, e com razão.
  */
  mencao: { classes: ["Markup.module__mention_gc"] },
  linkNoTexto: { classes: ["Markup.module__link_gc"] },
  codigoEmLinha: {
    classes: ["Markup.module__inline_gc", "Markup.module__inlineFormat_gc"],
  },
  blocoDeCodigo: {
    classes: ["Markup.module__codeContainer_gc"],
    flx: "messaging.markdown.renderers.common.code-elements.rich-code-block-renderer.div--8",
  },
  acoesDoCodigo: { classes: ["Markup.module__codeActions_gc"] },

  linhaDeMembro: { classes: ["ChannelMembers.module__virtualMemberRow_gc"] },

  /*
    O miolo da linha do membro. Um tema da comunidade pinta cada linha com a cor do
    status e escurece quem está offline; a faixa colorida ele tira do
    `data-flx-status`, que o nosso Avatar já emite, mas o fundo e o
    esmaecido saem destas classes, que faltavam.
  */
  botaoDoMembro: { classes: ["MemberListItem.module__button_gc"] },
  botaoDoMembroOffline: { classes: ["MemberListItem.module__buttonOffline_gc"] },
  avatarDoMembro: { classes: ["MemberListItem.module__avatarContainer_gc"] },
  nomeDoMembro: { classes: ["MemberListItem.module__name_gc"] },
  itemDeMembro: { classes: ["MemberListItem.module__grid_gc"] },
  conteudoDaListaDeMembros: { classes: ["ChannelMembers.module__virtualListContent_gc"] },

  campoDoTextoDaBusca: { classes: ["MessageSearchBar.module__input_gc"] },
  campoDaDescoberta: { classes: ["DiscoveryPage.module__searchInput_gc"] },

  molduraDaBusca: { classes: ["ChannelHeader.module__messageSearchFocusWrapper_gc"] },

  /*
    O cabeçalho do canal tinha só a moldura. Nome, ícone, tópico e os botões da
    direita ficavam fora do alcance de um tema — e é a barra que está sempre na
    tela, em cima de tudo.

    O banner de chamada deles (`callBanner*`) fica de fora: aqui a chamada em
    curso aparece no palco e no rodapé, não numa faixa no cabeçalho.
  */
  iconeDoCanal: { classes: ["ChannelHeader.module__channelIcon_gc"] },
  nomeDoCanal: { classes: ["ChannelHeader.module__channelName_gc"] },
  divisorDoTopico: { classes: ["ChannelHeader.module__topicDivider_gc"] },
  topicoDoCanal: {
    classes: ["ChannelHeader.module__topicContainer_gc", "ChannelHeader.module__topicMarkup_gc"],
  },
  ladoDireitoDoTopo: { classes: ["ChannelHeader.module__headerRightSection_gc"] },
  botaoDoTopoDoCanal: {
    classes: ["ChannelHeader.module__iconButton_gc", "ChannelHeader.module__buttonIcon_gc"],
  },
  ancoraDaBusca: { classes: ["MessageSearchBar.module__anchor_gc"] },
  campoDaBusca: {
    classes: ["MessageSearchBar.module__inputContainer_gc"],
    flx: "channel.message-search-bar.message-search-bar.input-container",
  },
  limparBusca: { classes: ["MessageSearchBar.module__clearButton_gc"] },

  linhaDoUsuario: {
    classes: ["UserArea.module__userAreaContainer_gc"],
    flx: "app.user-area.user-area-inner.section",
  },

  /*
    O painel do usuário, no pé da coluna. A moldura já tinha nome; o que faltava
    era o miolo — nome, status e os botões de microfone, fone e ajustes.
  */
  nomeNoRodape: { classes: ["UserArea.module__userName_gc"] },
  statusNoRodape: {
    classes: [
      "UserArea.module__userStatus_gc",
      "UserArea.module__hoverRoll_gc",
      "UserArea.module__userStatusLabel_gc",
    ],
  },
  dadosNoRodape: { classes: ["UserArea.module__userInfoText_gc"] },
  botaoDoRodape: {
    classes: ["UserArea.module__controlButton_gc", "UserArea.module__controlIcon_gc"],
  },
  bioDoPerfil: { classes: ["UserProfileShared.module__bioContainer_gc"] },

  /*
    Os pronomes. Dois nomes porque lá são duas telas — a janela cheia do perfil
    e o cartãozinho —, e os temas pintam as duas separado.
  */
  pronomesNoPerfil: { classes: ["UserProfileModal.module__pronouns_gc"] },
  pronomesNoCartao: { classes: ["ProfileCardUserInfo.module__pronouns_gc"] },
  janelaDeConfiguracoes: { classes: ["SettingsModalLayout.module__container_gc"] },

  /*
    A janela de configurações tinha só a moldura, e é uma tela inteira: lateral
    com dezenas de itens, cabeçalho e conteúdo. Sem estes nomes o tema pintava a
    borda da janela e deixava o miolo na aparência padrão.

    Fica de fora tudo que é `mobile*` — lá a versão estreita é um deslizar de
    painéis com classe própria; aqui é a mesma árvore respondendo a media query.
  */
  lateralDeConfiguracoes: {
    classes: [
      "SettingsModalLayout.module__desktopSidebar_gc",
      "SettingsModalLayout.module__sidebarNav_gc",
    ],
  },
  grupoDeConfiguracoes: { classes: ["SettingsModalLayout.module__sidebarCategory_gc"] },
  tituloDoGrupoDeConfiguracoes: {
    classes: ["SettingsModalLayout.module__sidebarCategoryTitle_gc"],
  },
  itemDeConfiguracoes: { classes: ["SettingsModalLayout.module__sidebarItem_gc"] },
  itemDeConfiguracoesAtivo: {
    classes: ["SettingsModalLayout.module__sidebarItemSelected_gc"],
  },
  rotuloDoItemDeConfiguracoes: {
    classes: ["SettingsModalLayout.module__sidebarItemLabel_gc"],
  },
  iconeDoItemDeConfiguracoes: {
    classes: ["SettingsModalLayout.module__sidebarItemIcon_gc"],
  },
  conteudoDeConfiguracoes: {
    classes: [
      "SettingsModalLayout.module__desktopContent_gc",
      "SettingsModalLayout.module__desktopContentCard_gc",
    ],
  },
  topoDeConfiguracoes: { classes: ["SettingsModalLayout.module__desktopHeader_gc"] },
  grupoDeCampo: { classes: ["FormInput.module__inputGroup_gc"] },

  mensagemQueMenciona: { classes: ["Message.module__messageMentioned_gc"] },
  /*
    Os dois nomes da barra de ações no mesmo elemento, de propósito.

    Lá são dois — `actionBarContainer` por fora, `actionBar` por dentro — e uma
    regra de um tema da comunidade encadeia os dois. Separar aqui pediria um invólucro que
    ou vira item de flex e quebra a linha da mensagem, ou é `display: contents`
    e não recebe pintura nenhuma. Uma regra não paga isso; as que miram cada
    nome sozinho continuam pousando.
  */
  barraDaMensagem: {
    classes: [
      "MessageActionBar.module__actionBar_gc",
      "MessageActionBar.module__actionBarContainer_gc",
    ],
  },
  botaoDeReacao: {
    classes: ["MessageReactions.module__reactionButton_gc"],
    flx: "channel.message-reactions.message-reaction-item.reaction-button.click",
  },

  /// O selo de quem não é gente: app e webhook usam o mesmo aqui.
  seloDeApp: { classes: ["ChannelUserTag.module__tag_gc"] },
  /// O mesmo selo, na medida de lista — lá eles têm três tamanhos.
  seloDeAppMiudo: { classes: ["ChannelUserTag.module__tagSm_gc"] },

  listaDeAmigos: { classes: ["DMFriendsView.module__content_gc"] },
  ativosAgora: { classes: ["ActiveNowSidebar.module__sidebar_gc"] },

  /*
    O miolo dos amigos ficava só com a moldura pintada: o tema alcançava a
    coluna e parava no cabeçalho, então título, abas e busca continuavam na
    aparência padrão dentro de um app já pintado.

    Ficaram de fora de propósito os nomes que o tema deles usa para MEDIR e que
    não têm par na nossa árvore — `tabsWrapper`, `tabsScroller`, `tabsInner` e
    `headerContent`. Lá as abas moram num rolador próprio; aqui são filhas
    diretas do cabeçalho, e emprestar o nome traria a medida errada junto.
  */
  tituloDosAmigos: { classes: ["DMFriendsView.module__titleSection_gc"] },
  iconeDoTituloDeAmigos: { classes: ["DMFriendsView.module__titleIcon_gc"] },
  textoDoTituloDeAmigos: { classes: ["DMFriendsView.module__titleText_gc"] },
  divisorDoTopoDeAmigos: { classes: ["DMFriendsView.module__divider_gc"] },
  abaDeAmigos: { classes: ["DMFriendsView.module__tabButton_gc"] },
  abaDeAmigosAtiva: { classes: ["DMFriendsView.module__active_gc"] },
  abaDeAmigosPrincipal: { classes: ["DMFriendsView.module__primary_gc"] },
  corpoDaAbaDeAmigos: {
    classes: ["DMFriendsView.module__tabBody_gc", "DMFriendsView.module__tabContent_gc"],
  },
  molduraDaBuscaDeAmigos: { classes: ["DMFriendsView.module__searchWrapper_gc"] },
  iconeDaBuscaDeAmigos: { classes: ["DMFriendsView.module__searchIcon_gc"] },

  tituloDosAtivos: { classes: ["ActiveNowSidebar.module__headerTitle_gc"] },
  conteudoDosAtivos: { classes: ["ActiveNowSidebar.module__content_gc"] },
  vazioDosAtivos: { classes: ["ActiveNowSidebar.module__emptyState_gc"] },
  iconeDoVazioDosAtivos: { classes: ["ActiveNowSidebar.module__emptyIcon_gc"] },
  tituloDoVazioDosAtivos: { classes: ["ActiveNowSidebar.module__emptyTitle_gc"] },
  descricaoDoVazioDosAtivos: { classes: ["ActiveNowSidebar.module__emptyDescription_gc"] },
  painelDeBusca: {
    classes: [
      "ChannelIndexPage.module__searchPanel_gc",
      "MessageSearchBar.module__popoutContainer_gc",
    ],
  },
  /// O "bem-vindo a #canal", que lá é o estado vazio do índice do canal.
  boasVindasDoCanal: { classes: ["ChannelIndexPage.module__emptyStateContent_gc"] },
  /*
    A edição no lugar: um texto que vira campo ao clicar.

    Lá é um componente genérico (`InlineEdit`); aqui existe na etiqueta do
    cartão de perfil, com as mesmas duas caras — o botão parado e o campo
    aberto. O invólucro deles não tem par aqui, e nome sem elemento quebra o
    teste de órfãos.
  */
  /*
    Editar no lugar, nos três níveis que a referência tem: o invólucro que
    reserva o espaço, a caixa que troca de estado, e o botão/campo de dentro.
    Sem os dois de fora, três regras de tema não tinham onde pousar.
  */
  molduraDeEditarNoLugar: { classes: ["InlineEdit.module__wrapper_gc"] },
  caixaDeEditarNoLugar: { classes: ["InlineEdit.module__container_gc"] },
  botaoDeEditarNoLugar: { classes: ["InlineEdit.module__idleButton_gc"] },
  campoDeEditarNoLugar: { classes: ["InlineEdit.module__editable_gc"] },

  /// O cartãozinho de cada cargo no perfil, e o nome dentro dele.
  /// A fileira de avatares que se sobrepõem, nos "ativos agora".
  pilhaDeAvatares: { classes: ["AvatarStack.module__container_gc"] },

  /// O selo de quem está transmitindo a tela na chamada.
  seloDeAoVivo: { classes: ["LiveBadge.module__liveBadge_gc"] },

  /*
    A mensagem encaminhada: a caixa com "Encaminhada de", o botão que leva à
    original, e dentro dele o rótulo e o nome do canal. É o que faltava para o
    encaminhar ter cara de encaminhar — antes a mensagem chegava sem dizer de
    onde veio.
  */
  caixaDeEncaminhada: { classes: ["MessageAttachments.module__forwardedContainer_gc"] },
  botaoDaOrigem: {
    classes: ["MessageAttachments.module__forwardedSourceButton_gc"],
    flx: "channel.message-attachments.forwarded-from-source.forwarded-source-button.jump-to-original--2",
  },
  rotuloDaOrigem: { classes: ["MessageAttachments.module__forwardedSourceLabel_gc"] },
  nomeDaOrigem: { classes: ["MessageAttachments.module__forwardedSourceName_gc"] },

  /// As mensagens de quem você bloqueou, dobradas numa linha só.
  grupoDeBloqueadas: { classes: ["BlockedMessageGroups.module__container_gc"] },

  /// A fileira de controles do tocador de vídeo.
  controlesDoVideo: { classes: ["VideoPlayer.module__controlsRow_gc"] },

  /*
    A máscara que recorta o círculo do avatar na faixa. É um `<mask>` SVG com
    um `<circle>` dentro, como lá — o tema que quer a faixa sem recorte apaga
    o círculo com `display: none`, e para isso o círculo precisa existir.
  */
  mascaraDaFaixa: { classes: ["ProfileCardBanner.module__bannerMask_gc"] },
  mascaraDaFaixaNoPerfil: { classes: ["UserProfileModal.module__bannerMask_gc"] },

  seloDeCargo: { classes: ["RoleManagement.module__roleBadge_gc"] },
  nomeDoCargo: { classes: ["RoleManagement.module__roleName_gc"] },

  /// O botão de escolher a variante em Aparência.
  botaoDeTema: { classes: ["ThemeTab.module__themeButtonDark_gc"] },

  /// O topo da caixa de entrada e os botões dele.
  topoDaCaixaDeEntrada: { classes: ["InboxMessageHeader.module__header_gc"] },
  botaoDoTopoDaCaixaDeEntrada: {
    classes: ["InboxMessageHeader.module__headerIconButton_gc"],
  },

  /*
    Lugares que a referência nomeia só por `data-flx`, sem classe de módulo.

    Os temas miram esses por atributo — o Gruvbox pinta a coluna das conversas
    por `[data-flx="channel.direct-message.dm-layout.dm-list-column--2"]`. Sem o
    atributo, a regra não tem onde pousar, por mais classe que a gente carimbe.
  */
  colunaDasConversas: { classes: [], flx: "channel.direct-message.dm-layout.dm-list-column--2" },
  botaoDeCriarServidor: { classes: [], flx: "app.sidebar-nav.add-guild-button.div" },
  botaoDeExplorar: { classes: [], flx: "app.sidebar-nav.discovery-button.div" },
  botaoDeConfiguracoes: {
    classes: [],
    flx: "app.user-area.user-area-inner.control-button.settings-click",
  },
  vaziaDeVoz: {
    classes: [],
    flx: "channel.channel-view.guild-channel-view.voice-channel-join-empty-state.voice-join-empty-state",
  },

  /// O ícone dentro do botão de criar/entrar num servidor.
  iconeDeCriarServidor: { classes: ["GuildsLayout.module__addGuildButtonIcon_gc"] },

  explorar: { classes: ["DiscoveryPage.module__container_gc"] },
  navegacaoDoExplorar: {
    classes: [],
    flx: "discovery.discovery.discovery-navbar.navbar",
  },
  buscaDeAmigos: {
    classes: [],
    flx: "channel.direct-message.dm-friends-view.input.set-search-query",
  },

  palcoDeVoz: { classes: ["VoiceCallView.module__root_gc"] },

  /*
    A tela de chamada tinha um nome só, a raiz. Um tema importado pintava a
    moldura e parava: quadro de participante, selo de microfone, nome, barra de
    controles e as bordas esmaecidas ficavam na aparência padrão.

    Do módulo deles ficou de fora quase tudo, e de propósito. As 96 classes são
    em grande parte variante de layout que só existe lá — `focusLayout*`,
    `gridLayout*`, `mainContentFocusFullscreen`, `mobileFocusMembersVisible` —
    e nome de estado que a nossa árvore não tem. Entram os que pintam e têm par.
  */
  topoDaChamada: { classes: ["VoiceCallView.module__voiceHeader_gc"] },
  botaoDoTopoDaChamada: { classes: ["VoiceCallView.module__voiceHeaderIconButton_gc"] },
  barraDeControlesDaChamada: {
    classes: ["VoiceCallView.module__controlBarContainer_gc"],
    flx: "voice.voice-control-bar.voice-control-bar-inner.container",
  },
  quadroDeParticipante: { classes: ["VoiceCallView.module__lkParticipantTile_gc"] },
  avatarSemCamera: { classes: ["VoiceCallView.module__audioAvatarFallback_gc"] },
  selosDoParticipante: {
    classes: [
      "VoiceCallView.module__lkParticipantMetadata_gc",
      "VoiceCallView.module__tileControlPill_gc",
    ],
  },
  nomeDoParticipante: { classes: ["VoiceCallView.module__participantName_gc"] },
  infoDaTransmissao: { classes: ["VoiceCallView.module__streamFocusInfo_gc"] },
  nomeDeQuemTransmite: { classes: ["VoiceCallView.module__streamFocusStreamerName_gc"] },
  esmaecidoDoTopo: { classes: ["VoiceCallView.module__voiceEdgeFadeTop_gc"] },
  esmaecidoDaBase: { classes: ["VoiceCallView.module__voiceEdgeFadeBottom_gc"] },
  /*
    A chamada compacta da conversa direta, em dois: a faixa por fora, que é o
    painel que o tema pinta (`callBanner` ganha borda, desfoque e fundo), e o
    palco por dentro, que o mesmo tema manda ficar TRANSPARENTE para o painel
    aparecer. Os dois no mesmo elemento se anulariam.

    Sem o nome no palco, ele ficava um retângulo opaco de `bg-surface-2` no
    meio da tela de vidro.
  */
  chamadaCompacta: { classes: ["DMChannelView.module__callBanner_gc"] },
  palcoDaChamadaCompacta: {
    classes: [
      "DMChannelView.module__compactVoiceCallView_gc",
      "DMChannelView.module__compactCallWrapper_gc",
    ],
    flx: "channel.channel-view.dm-channel-view.compact-call-wrapper",
  },

  paginaDeMembros: { classes: ["GuildMembersPage.module__pageContainer_gc"] },
  cartaoDeEntrada: { classes: ["AuthLayout.module__card_gc"] },
  abertura: { classes: ["SplashScreen.module__splashContent_gc"] },

  /// A moldura da conversa: cabeçalho, mensagens e caixa juntos.
  molduraDoCanal: {
    classes: [
      "ChannelLayout.module__channelLayoutContainer_gc",
      "ChannelIndexPage.module__contentGrid_gc",
      "GuildLayout.module__guildMainContent_gc",
    ],
    flx: "app.guilds-layout.main-content",
  },

  cabecalhoDoServidor: { classes: ["GuildHeader.module__headerContainer_gc"] },
  roladorDeCanais: { classes: ["ChannelListContent.module__channelListScroller_gc"] },
  grupoDeCanais: { classes: ["ChannelListContent.module__channelGroupsContainer_gc"] },
  /*
    A moldura da lista de canais — o painel inteiro, não só o rolador. É onde
    um tema de vidro põe o fundo translúcido e o desfoque; sem o nome, a
    lateral ficava opaca enquanto o resto da tela virava vidro.
  */
  molduraDaListaDeCanais: {
    classes: ["ChannelListContent.module__navigationContainer_gc"],
    flx: "app.guild-sidebar.guild-navbar",
  },
  roladorDeMembros: { classes: ["MemberListContainer.module__memberListScroller_gc"] },
  colunaDeAmigos: {
    classes: ["DMFriendsView.module__container_gc", "DMFriendsView.module__mainColumn_gc"],
    flx: "channel.direct-message.dm-friends-view.container",
  },

  divisorDoDia: {
    classes: ["Divider.module__text_gc", "Divider.module__dateWithUnreadText_gc"],
  },

  cartaoDeLink: {
    classes: ["EmbedCard.module__wrapper_gc", "Embed.module__embedFull_gc"],
    flx: "messaging.embeds.embed-card.embed-card.wrapper",
  },
  /// O miolo do cartão de link, dentro do invólucro.
  mioloDoCartaoDeLink: {
    classes: [],
    flx: "channel.embeds.embed.rich-embed.embed",
  },
  /*
    A grade de imagens por contagem. Um nome por arranjo, como na referência —
    e três deles são de dois níveis, com o invólucro por fora e a grade de baixo
    por dentro. O recorte mora em `features/conversa/lib/grade-de-anexos.ts`.
  */
  gradeDeDuas: { classes: ["AttachmentLayoutGrid.module__twoImageGrid_gc"] },
  gradeDeTres: { classes: ["AttachmentLayoutGrid.module__threeImageGrid_gc"] },
  gradeDeQuatro: { classes: ["AttachmentLayoutGrid.module__fourImageGrid_gc"] },
  gradeDeCinco: { classes: ["AttachmentLayoutGrid.module__fiveImageGrid_gc"] },
  gradeDeSeis: { classes: ["AttachmentLayoutGrid.module__sixImageGrid_gc"] },
  caixaDeSete: { classes: ["AttachmentLayoutGrid.module__sevenImageContainer_gc"] },
  gradeDeSete: { classes: ["AttachmentLayoutGrid.module__sevenGrid_gc"] },
  caixaDeOito: { classes: ["AttachmentLayoutGrid.module__eightImageContainer_gc"] },
  gradeDeOito: { classes: ["AttachmentLayoutGrid.module__eightBottomGrid_gc"] },
  gradeDeNove: { classes: ["AttachmentLayoutGrid.module__nineImageGrid_gc"] },
  caixaDeDez: { classes: ["AttachmentLayoutGrid.module__tenImageContainer_gc"] },
  gradeDeDez: { classes: ["AttachmentLayoutGrid.module__tenGrid_gc"] },

  cartaoDeAnexo: {
    classes: [
      "AttachmentFile.module__attachmentContainer_gc",
      "Attachment.module__attachmentWrapper_gc",
    ],
  },
  anexoSubindo: {
    classes: [
      "ChannelAttachmentArea.module__upload_gc",
      "InputWrapper.module__composerActionStack_gc",
    ],
  },
  previaDaMensagem: { classes: ["MessagePreview.module__previewCard_gc"] },
  sugestoes: { classes: ["Autocomplete.module__container_gc"] },
  resultadosDaBusca: { classes: ["ChannelSearchResults.module__container_gc"] },
  itemDoResultado: { classes: ["ChannelSearchResults.module__messageItem_gc"] },
  /*
    A citação de verdade do markdown, e os avisos que nascem dela.

    `> [!NOTE]` e os quatro irmãos são citação com um cabeçalho: o GitHub
    inventou, a referência seguiu, e os temas miram os seis nomes. O `citacao`
    morava na prévia da resposta, que é parecida e não é a mesma coisa —
    voltou para o lugar dele agora que existe bloco de citação.
  */
  citacao: { classes: ["Markup.module__blockquoteContainer_gc"] },
  divisorDaCitacao: { classes: ["Markup.module__blockquoteDivider_gc"] },
  avisoDoMarkdown: { classes: ["Markup.module__alert_gc"] },
  tituloDoAviso: { classes: ["Markup.module__alertTitle_gc"] },
  corpoDoAviso: { classes: ["Markup.module__alertContent_gc"] },
  avisoNota: { classes: ["Markup.module__alertNote_gc"] },
  avisoDica: { classes: ["Markup.module__alertTip_gc"] },
  avisoImportante: { classes: ["Markup.module__alertImportant_gc"] },
  avisoAtencao: { classes: ["Markup.module__alertWarning_gc"] },
  avisoCuidado: { classes: ["Markup.module__alertCaution_gc"] },
  gaveta: { classes: ["Sheet.module__root_gc", "Sheet.module__container_gc"] },
  botaoSecundario: { classes: ["Button.module__secondary_gc"] },

  /*
    Os primitivos: botão, campo, slider, aba, menu.

    Foi aqui que a conta virou. Os nomes de tela — amigos, chamada, ajustes —
    valem uma tela cada; estes valem o app inteiro, porque um tema pinta botão
    e campo em todo lugar. Contando os usos num tema da comunidade: `Slider` 16,
    `Tabs` 16, `ContextMenu` 15, `InputWrapper` 13, `Button` 10.
  */
  botaoPrimario: { classes: ["Button.module__primary_gc"] },
  botaoDePerigo: { classes: ["Button.module__danger_gc"] },
  botaoInvertido: { classes: ["Button.module__inverted_gc"] },
  botao: { classes: ["Button.module__button_gc"] },

  itemDoMenu: { classes: ["ContextMenu.module__item_gc"] },
  submenu: { classes: ["ContextMenu.module__submenuPopover_gc"] },
  caixaDeMarcar: { classes: ["ContextMenu.module__checkbox_gc"] },
  caixaDeMarcarLigada: { classes: ["ContextMenu.module__checkboxChecked_gc"] },

  /*
    O slider desmanchado, como o deles.

    Ele viveu colapsado num `<input type="range">` — trilho e puxador eram
    pseudo-elementos, não filhos —, e o comentário que ficava aqui dizia que
    cinco regras de tema não pagavam reescrever o controle de volume. Pagavam:
    um tema da comunidade encadeia os cinco nomes (`control > sliderControl > track >
    barFill` e `control > sliderControl > grabber`), e nome no mesmo elemento
    não casa com cadeia.

    Agora são divs de verdade, e o `<input>` continua ali por cima, invisível:
    é ele que ouve o arraste, o teclado e o leitor de tela. Foi o jeito de
    ganhar os cinco nomes sem reescrever o arraste na mão — inclusive o do
    volume da chamada, que vive girado 90° e por isso era o caro.

    `defaultValue`/`markValue`/`markDash` ficam de fora: é a marca do valor de
    fábrica no trilho, que a nossa interface não tem.
  */
  controleDoSlider: { classes: ["Slider.module__control_gc"] },
  mioloDoSlider: { classes: ["Slider.module__sliderControl_gc"] },
  trilhoDoSlider: { classes: ["Slider.module__track_gc"] },
  preenchimentoDoSlider: { classes: ["Slider.module__barFill_gc"] },
  punhoDoSlider: { classes: ["Slider.module__grabber_gc"] },

  /*
    A marca do valor de fábrica no trilho: o risquinho e o número embaixo dele.
    Só aparece quando quem usa o slider diz qual é o padrão — sem isso não há o
    que marcar, e um nome carimbado em elemento que nunca existe é nome morto.
  */
  marcaDoPadrao: { classes: ["Slider.module__defaultValue_gc"] },
  risquinhoDaMarca: { classes: ["Slider.module__markDash_gc"] },
  numeroDaMarca: { classes: ["Slider.module__markValue_gc"] },

  /*
    `Tabs.module__container` fica de fora: o tema lhe dá `width: fit-content` e
    `margin: 0 auto`, e a nossa aba mora no cabeçalho do canal. Emprestar o
    nome centralizaria a barra inteira. As abas em si só pintam, e entram.
  */
  aba: { classes: ["Tabs.module__tab_gc"] },
  abaEscolhida: { classes: ["Tabs.module__selected_gc"] },

  molduraDoCampo: { classes: ["FormInput.module__inputWrapper_gc"] },

  /*
    Estes saíram de medir, não de olhar.

    A conta é por regra do tema: quantas mexem no nome, quantas dessas mexem em
    MEDIDA (largura, posição, margem, grid) e quantas vêm escopadas dentro de
    outro nome. Nome com medida zero pinta e só; nome escopado só alcança quem
    está dentro do pai, então nem chega perto do resto da tela.

    Foi assim que o `Tabs.module__container` voltou: as oito regras dele vêm
    escopadas dentro do cartão de perfil. Eu o tinha recusado achando que
    centralizaria o cabeçalho dos amigos — ele nunca chegaria lá.
  */
  balaoFlutuante: { classes: ["PopoverPopout.module__popout_gc"] },
  caixaDeEntrada: {
    classes: [
      "InboxPopout.module__container_gc",
      "InboxPopout.module__containerWithSidebar_gc",
    ],
  },
  lateralDaCaixaDeEntrada: { classes: ["InboxPopout.module__sidebar_gc"] },

  caixaDeMarcarSolta: { classes: ["Checkbox.module__checkbox_gc"] },
  superficieDeCampo: { classes: ["FormSurface.module__surface_gc"] },
  grupoDeCombo: {
    classes: ["FormCombobox.module__inputGroup_gc"],
    flx: "ui.form.combobox.input-group",
  },
  molduraDoSeletorDeCor: { classes: ["ColorPickerField.module__inputWrapper_gc"] },
  itemDeRadioDoMenu: { classes: ["MenuItemRadio.module__radioButton_gc"] },

  /*
    O rádio das configurações. A bolinha é SVG de propósito: as regras deles
    mexem em `fill` e `stroke`, e num `<div>` isso não pinta nada. O motivo
    completo está no `components/ui/radio-group.tsx`.

    `focusRing`, `label`, `labelText`, `description` e `customContent` ficam de
    fora: o nosso rótulo é texto solto dentro do botão, sem os quatro níveis
    que eles têm.
  */
  grupoDeRadio: { classes: ["RadioGroup.module__group_gc"] },
  opcaoDeRadio: { classes: ["RadioGroup.module__radioGroupOption_gc"] },
  indicadorDeRadio: { classes: ["RadioGroup.module__radioIndicator_gc"] },
  baseDoRadio: { classes: ["RadioGroup.module__outerRadioBase_gc"] },
  pontoDoRadio: { classes: ["RadioGroup.module__innerDotRadio_gc"] },
  itemDeRadioDoMenuEscolhido: {
    classes: ["MenuItemRadio.module__radioButtonSelected_gc"],
  },
  itemDoMenuDesligado: { classes: ["ContextMenu.module__disabled_gc"] },

  envoltorioDoSpoiler: { classes: ["Markup.module__spoilerWrapper_gc"] },
  spoilerEmLinha: { classes: ["Markup.module__spoiler_gc"] },

  conteudoDoPerfilCompleto: { classes: ["UserProfileModal.module__profileContent_gc"] },
  secaoDoCartaoDePerfil: { classes: ["ProfileCardContent.module__contentSection_gc"] },

  cartaoDeVozAtiva: { classes: ["VoiceActivityCard.module__card_gc"] },
  listaDeConversasDoPainel: { classes: ["DirectMessageList.module__dmChannelList_gc"] },
  topoDaListaDeConversas: { classes: ["DirectMessageList.module__dmListHeader_gc"] },
  perfilNasConfiguracoes: { classes: ["UserSettingsModal.module__userProfile_gc"] },
  topoDaJanelaDeConfiguracoes: {
    classes: ["SettingsModalHeader.module__headerTransition_gc"],
  },
  molduraDoAvatar: { classes: ["BaseAvatar.module__container_gc"] },

  janela: { classes: ["Modal.module__root_gc", "Modal.module__surface_gc"] },
  fundoDaJanela: { classes: ["Modal.module__modalBackdrop_gc"] },
  menu: { classes: ["ContextMenu.module__contextMenu_gc"] },
  balao: { classes: ["Popout.module__popout_gc"] },
  dica: { classes: ["Tooltip.module__tooltip_gc"] },

  cartaoDePerfil: { classes: ["ProfileCardLayout.module__profileCard_gc"] },
  perfilCompleto: {
    classes: [
      "UserProfileModal.module__modalContainer_gc",
      "UserProfileModal.module__modalRoot_gc",
    ],
  },
  conteudoDoPerfil: { classes: ["UserProfileModal.module__profileContentWrapper_gc"] },

  /*
    O cartão de perfil e o modal de perfil, com os mesmos nomes.

    Na referência são dois módulos — `ProfileCardUserInfo` no cartão que abre no
    hover, `UserProfileModal` na janela cheia — e um tema costuma escrever a
    mesma regra para os dois. Aqui o cartão é um componente só, usado nos dois
    lugares, então ele carrega os dois nomes e as duas regras pousam.
  */
  dadosDoPerfil: {
    classes: [
      "ProfileCardUserInfo.module__userInfoContainer_gc",
      "UserProfileModal.module__userInfoContent_gc",
    ],
  },
  linhaDoNomeDoPerfil: {
    classes: [
      "ProfileCardUserInfo.module__nameRow_gc",
      "UserProfileModal.module__nameRow_gc",
    ],
  },
  linhaDoUsuarioDoPerfil: {
    classes: [
      "ProfileCardUserInfo.module__usernameRow_gc",
      "UserProfileModal.module__usernameRow_gc",
    ],
  },
  botaoDoUsuarioDoPerfil: { classes: ["ProfileCardUserInfo.module__usernameButton_gc"] },
  molduraDaFotoDoPerfil: {
    classes: [
      "ProfileCardBanner.module__avatarButton_gc",
      "UserProfileModal.module__avatarContainer_gc",
    ],
  },

  /// O recado — o status escrito à mão. Quatro módulos lá, um lugar aqui.
  recadoDoPerfil: {
    classes: [
      "CustomStatusDisplay.module__editableWrapper_gc",
      "ProfilePreview.module__profileCustomStatus_gc",
      "UserProfilePopout.module__profileCustomStatus_gc",
      "UserProfileModal.module__customStatusRow_gc",
      "UserAreaPopout.module__customStatusRow_gc",
    ],
  },
  textoDoRecado: { classes: ["CustomStatusDisplay.module__content_gc"] },
  recadoVazio: { classes: ["UserAreaPopout.module__customStatusPlaceholder_gc"] },

  /// A tira de abas, com a linha embaixo.
  molduraDasAbas: { classes: ["Tabs.module__container_gc"] },

  /// A prévia de um anexo de texto, aberta dentro da mensagem.
  previaDeTexto: { classes: ["TextualAttachmentPreview.module__textualPreview_gc"] },
  seletorDeExpressao: {
    classes: ["ExpressionPickerPopout.module__container_gc"],
  },
  fixadas: { classes: ["ChannelPinsPopout.module__container_gc"] },

  avatar: {
    classes: ["BaseAvatar.module__avatar_gc"],
    flx: "ui.status-aware-avatar.avatar",
  },
  imagemDoAvatar: { classes: [], flx: "ui.base-avatar.image-frame" },
  bolinhaDeStatus: {
    classes: ["BaseAvatar.module__statusContainer_gc"],
    flx: "ui.base-avatar.status-container",
  },

  campo: { classes: ["Input.module__input_gc"] },

  /*
    A linha de erro debaixo do campo e o olho de mostrar a senha. Os dois
    faltavam de verdade: o campo não tinha onde dizer o que deu errado, e senha
    era caixa cega. Seis regras de tema vieram de brinde.
  */
  erroDoCampo: { classes: ["FormInput.module__error_gc"] },
  olhoDaSenha: { classes: ["FormInput.module__passwordToggle_gc"] },
  chave: { classes: ["FormSwitch.module__switchRoot_gc"], flx: "ui.form.switch.container" },
  aviso: { classes: ["Toast.module__toast_gc"] },
} as const satisfies Record<string, Lugar>;

export type Lugares = keyof typeof LUGARES;

/*
  Devolve as props de compatibilidade já com a classe do próprio componente
  junto, para o uso ser um spread só.
*/
export function flx(lugar: Lugares, className?: string) {
  const alvo: Lugar = LUGARES[lugar];

  return {
    className: cn(className, ...alvo.classes),
    ...(alvo.flx ? { "data-flx": alvo.flx } : {}),
  };
}

/// Só o atributo, para quando o className já está montado em outro lugar.
export function flxAttr(lugar: Lugares) {
  const alvo: Lugar = LUGARES[lugar];

  return alvo.flx ? { "data-flx": alvo.flx } : {};
}

/// Só as classes, para entrar num cn() que já existe.
export function flxCls(lugar: Lugares) {
  return LUGARES[lugar].classes.join(" ");
}
