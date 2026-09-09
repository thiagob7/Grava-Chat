import { cn } from "~/lib/utils";

interface Lugar {
  classes: string[];
  flx?: string;
}

export const LUGARES = {
  containerDoApp: {
    classes: ["App.module__appContainer_gc"],
    flx: "app.app.app-wrapper.app-container",
  },

  molduraDoApp: { classes: ["AppLayout.module__appLayout_gc"] },

  molduraExterna: {
    classes: ["OutlineFrame.module__frame_gc"],
    flx: "app.outline-frame.frame",
  },
  divisorDaLateral: { classes: ["OutlineFrame.module__divider_gc"] },
  divisorDosMembros: { classes: ["ChannelIndexPage.module__memberListDivider_gc"] },

  linhaDoApp: {
    classes: [
      "GuildsLayout.module__guildsLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContent_gc",
    ],
    flx: "app.guilds-layout.guilds-layout",
  },

  colunaDoMiolo: {
    classes: [
      "GuildsLayout.module__contentContainer_gc",
      "ChannelIndexPage.module__channelGrid_gc",
    ],
    flx: "app.guilds-layout.content-container",
  },

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

  iconeDoServidor: { classes: ["GuildsLayout.module__guildIcon_gc"] },
  iconeDoServidorAtivo: { classes: ["GuildsLayout.module__guildIconSelected_gc"] },
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

  areaDoUsuario: {
    classes: ["GuildsLayout.module__userAreaWrapper_gc"],
    flx: "app.guilds-layout.user-area-wrapper",
  },

  linhaDeInfoDoUsuario: { classes: ["UserArea.module__userInfo_gc"] },
  controlesDoUsuario: { classes: ["UserArea.module__controlsContainer_gc"] },
  estadoPadraoDoStatus: { classes: ["UserArea.module__defaultState_gc"] },
  estadoNoHoverDoStatus: { classes: ["UserArea.module__hovered_gc"] },
  chamadaNoRodape: { classes: ["UserArea.module__voiceConnectionWrapper_gc"] },
  cartaoDoUsuario: { classes: ["UserArea.module__userAreaInnerWrapper_gc"] },

  barraDeTitulo: {
    classes: ["NativeTitlebar.module__titlebar_gc"],
    flx: "app.native-titlebar.titlebar",
  },
  controlesDaJanela: { classes: ["NativeTitlebar.module__controls_gc"] },
  botaoDaJanela: { classes: ["NativeTitlebar.module__controlButton_gc"] },

  topoDoCanal: { classes: ["ChannelHeader.module__headerWrapper_gc"] },
  mioloDoTopoDoCanal: { classes: ["ChannelHeader.module__headerContainer_gc"] },

  listaDeMembros: {
    classes: ["MemberListContainer.module__memberListContainer_gc"],
  },

  areaDeMensagens: {
    classes: ["ChannelChatLayout.module__messagesArea_gc"],
  },

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

  caixaDeEscrever: {
    classes: ["ChannelChatLayout.module__textareaArea_gc"],
    flx: "channel.channel-chat-layout.textarea-area",
  },
  campoDeEscrever: {
    classes: ["InputWrapper.module__box_gc"],
    flx: "channel.lexical-channel-textarea-content.textarea-outer",
  },

  pilhaDeEscrever: { classes: ["InputWrapper.module__stackSection_gc"] },
  linhaDeEscrever: {
    classes: [
      "TextareaInput.module__textareaOuterRow_gc",
      "TextareaInput.module__mainWrapperDense_gc",
    ],
  },

  colunaDoTexto: { classes: ["TextareaInput.module__flexColumn_gc"] },
  botoesDaCaixa: { classes: ["TextareaInput.module__buttonContainerDense_gc"] },
  botaoDaCaixa: { classes: ["TextareaButton.module__button_gc"] },

  paragrafoDaCaixa: { classes: ["LexicalMessageComposer.module__paragraph_gc"] },

  trilhoDeAviso: {
    classes: ["InputWrapper.module__statusRail_gc"],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-status-rail",
  },
  avisoDeModoLento: {
    classes: [],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-slowmode-slot",
  },

  grupoDeMensagens: { classes: [], flx: "channel.message-group.group" },
  corpoDaMensagem: { classes: ["Message.module__messageContent_gc"] },
  textoMarcado: { classes: ["Markup.module__markup_gc"] },
  horaAoPassarOMouse: { classes: ["Message.module__messageTimestampHover_gc"] },
  mensagemSemTexto: { classes: ["Message.module__messageNoText_gc"] },

  molduraDaMensagem: { classes: ["Message.module__message_gc"] },
  colunaDaMensagem: { classes: ["Message.module__container_gc"] },

  avatarDaCitacao: { classes: ["Message.module__repliedAvatar_gc"] },
  nomeDaCitacao: { classes: ["Message.module__repliedUsername_gc"] },
  textoDaCitacao: { classes: ["Message.module__repliedTextPreview_gc"] },
  respondida: { classes: ["Message.module__repliedMessage_gc"] },

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

  botaoDoMembro: { classes: ["MemberListItem.module__button_gc"] },
  botaoDoMembroOffline: { classes: ["MemberListItem.module__buttonOffline_gc"] },
  avatarDoMembro: { classes: ["MemberListItem.module__avatarContainer_gc"] },
  nomeDoMembro: { classes: ["MemberListItem.module__name_gc"] },
  itemDeMembro: { classes: ["MemberListItem.module__grid_gc"] },
  conteudoDaListaDeMembros: { classes: ["ChannelMembers.module__virtualListContent_gc"] },

  campoDoTextoDaBusca: { classes: ["MessageSearchBar.module__input_gc"] },
  campoDaDescoberta: { classes: ["DiscoveryPage.module__searchInput_gc"] },

  molduraDaBusca: { classes: ["ChannelHeader.module__messageSearchFocusWrapper_gc"] },

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

  pronomesNoPerfil: { classes: ["UserProfileModal.module__pronouns_gc"] },
  pronomesNoCartao: { classes: ["ProfileCardUserInfo.module__pronouns_gc"] },
  janelaDeConfiguracoes: { classes: ["SettingsModalLayout.module__container_gc"] },

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
  fieldGroup: { classes: ["FormInput.module__inputGroup_gc"] },

  mensagemQueMenciona: { classes: ["Message.module__messageMentioned_gc"] },
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

  seloDeApp: { classes: ["ChannelUserTag.module__tag_gc"] },
  seloDeAppMiudo: { classes: ["ChannelUserTag.module__tagSm_gc"] },

  listaDeAmigos: { classes: ["DMFriendsView.module__content_gc"] },
  ativosAgora: { classes: ["ActiveNowSidebar.module__sidebar_gc"] },

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
  boasVindasDoCanal: { classes: ["ChannelIndexPage.module__emptyStateContent_gc"] },
  molduraDeEditarNoLugar: { classes: ["InlineEdit.module__wrapper_gc"] },
  caixaDeEditarNoLugar: { classes: ["InlineEdit.module__container_gc"] },
  botaoDeEditarNoLugar: { classes: ["InlineEdit.module__idleButton_gc"] },
  campoDeEditarNoLugar: { classes: ["InlineEdit.module__editable_gc"] },

  pilhaDeAvatares: { classes: ["AvatarStack.module__container_gc"] },

  seloDeAoVivo: { classes: ["LiveBadge.module__liveBadge_gc"] },

  caixaDeEncaminhada: { classes: ["MessageAttachments.module__forwardedContainer_gc"] },
  botaoDaOrigem: {
    classes: ["MessageAttachments.module__forwardedSourceButton_gc"],
    flx: "channel.message-attachments.forwarded-from-source.forwarded-source-button.jump-to-original--2",
  },
  rotuloDaOrigem: { classes: ["MessageAttachments.module__forwardedSourceLabel_gc"] },
  nomeDaOrigem: { classes: ["MessageAttachments.module__forwardedSourceName_gc"] },

  grupoDeBloqueadas: { classes: ["BlockedMessageGroups.module__container_gc"] },

  controlesDoVideo: { classes: ["VideoPlayer.module__controlsRow_gc"] },

  mascaraDaFaixa: { classes: ["ProfileCardBanner.module__bannerMask_gc"] },
  mascaraDaFaixaNoPerfil: { classes: ["UserProfileModal.module__bannerMask_gc"] },

  seloDeCargo: { classes: ["RoleManagement.module__roleBadge_gc"] },
  nomeDoCargo: { classes: ["RoleManagement.module__roleName_gc"] },

  botaoDeTema: { classes: ["ThemeTab.module__themeButtonDark_gc"] },

  topoDaCaixaDeEntrada: { classes: ["InboxMessageHeader.module__header_gc"] },
  botaoDoTopoDaCaixaDeEntrada: {
    classes: ["InboxMessageHeader.module__headerIconButton_gc"],
  },

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
  mioloDoCartaoDeLink: {
    classes: [],
    flx: "channel.embeds.embed.rich-embed.embed",
  },
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

  botaoPrimario: { classes: ["Button.module__primary_gc"] },
  botaoDePerigo: { classes: ["Button.module__danger_gc"] },
  botaoInvertido: { classes: ["Button.module__inverted_gc"] },
  botao: { classes: ["Button.module__button_gc"] },

  itemDoMenu: { classes: ["ContextMenu.module__item_gc"] },
  submenu: { classes: ["ContextMenu.module__submenuPopover_gc"] },
  caixaDeMarcar: { classes: ["ContextMenu.module__checkbox_gc"] },
  caixaDeMarcarLigada: { classes: ["ContextMenu.module__checkboxChecked_gc"] },

  controleDoSlider: { classes: ["Slider.module__control_gc"] },
  mioloDoSlider: { classes: ["Slider.module__sliderControl_gc"] },
  trilhoDoSlider: { classes: ["Slider.module__track_gc"] },
  preenchimentoDoSlider: { classes: ["Slider.module__barFill_gc"] },
  punhoDoSlider: { classes: ["Slider.module__grabber_gc"] },

  marcaDoPadrao: { classes: ["Slider.module__defaultValue_gc"] },
  risquinhoDaMarca: { classes: ["Slider.module__markDash_gc"] },
  numeroDaMarca: { classes: ["Slider.module__markValue_gc"] },

  aba: { classes: ["Tabs.module__tab_gc"] },
  abaEscolhida: { classes: ["Tabs.module__selected_gc"] },

  molduraDoCampo: { classes: ["FormInput.module__inputWrapper_gc"] },

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

  molduraDasAbas: { classes: ["Tabs.module__container_gc"] },

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

  erroDoCampo: { classes: ["FormInput.module__error_gc"] },
  olhoDaSenha: { classes: ["FormInput.module__passwordToggle_gc"] },
  chave: { classes: ["FormSwitch.module__switchRoot_gc"], flx: "ui.form.switch.container" },
  aviso: { classes: ["Toast.module__toast_gc"] },
} as const satisfies Record<string, Lugar>;

export type Lugares = keyof typeof LUGARES;

export function flx(lugar: Lugares, className?: string) {
  const alvo: Lugar = LUGARES[lugar];

  return {
    className: cn(className, ...alvo.classes),
    ...(alvo.flx ? { "data-flx": alvo.flx } : {}),
  };
}

export function flxAttr(lugar: Lugares) {
  const alvo: Lugar = LUGARES[lugar];

  return alvo.flx ? { "data-flx": alvo.flx } : {};
}

export function flxCls(lugar: Lugares) {
  return LUGARES[lugar].classes.join(" ");
}
