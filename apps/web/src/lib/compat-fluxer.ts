import { cn } from "~/lib/utils";

/*
  Nomes que os temas do Fluxer procuram, dados aos nossos elementos.

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
  /// A moldura de tudo: é onde entra o respiro entre painéis.
  molduraDoApp: { classes: ["AppLayout.module__appLayout_gc"] },

  /// A linha que segura trilho, lateral e miolo.
  linhaDoApp: {
    classes: [
      "GuildsLayout.module__guildsLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContent_gc",
    ],
  },

  /// A coluna do miolo: cabeçalho em cima, conversa embaixo.
  colunaDoMiolo: {
    classes: [
      "GuildsLayout.module__contentContainer_gc",
      "ChannelIndexPage.module__channelGrid_gc",
    ],
  },

  /*
    O `guildListScrollerWrapper` traz duas coisas na mesma regra: a altura, que
    encurta o trilho para o rodapé caber embaixo, e a largura, que aqui não
    serve porque o nosso trilho já é a coluna. Ele entra pela altura, e a
    largura volta pela folha de correções.
  */
  trilhoDeServidores: {
    classes: [
      "GuildsLayout.module__guildListScrollContainer_gc",
      "GuildsLayout.module__guildListScrollerWrapper_gc",
    ],
    flx: "app.guilds-layout.guild-list.guild-list-scroller-wrapper",
  },

  itemDoTrilho: { classes: ["GuildsLayout.module__guildListItem_gc"] },

  listaDeCanais: { classes: ["GuildNavbar.module__guildNavbarContainer_gc"] },

  listaDeConversas: {
    classes: ["DMList.module__dmListContainer_gc"],
    flx: "channel.direct-message.dm-list.dm-list-container",
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
  areaDoUsuario: { classes: [], flx: "app.guilds-layout.user-area-wrapper" },
  cartaoDoUsuario: { classes: ["UserArea.module__userAreaInnerWrapper_gc"] },

  topoDoCanal: {
    classes: [
      "ChannelHeader.module__headerWrapper_gc",
      "ChannelHeader.module__headerContainer_gc",
    ],
  },

  listaDeMembros: {
    classes: ["MemberListContainer.module__memberListContainer_gc"],
  },


  areaDeMensagens: {
    classes: ["ChannelChatLayout.module__messagesArea_gc"],
  },

  /// Mesma divisão da área do usuário: o painel de fora, o campo de dentro.
  caixaDeEscrever: { classes: [], flx: "channel.channel-chat-layout.textarea-area" },
  campoDeEscrever: {
    classes: [],
    flx: "channel.lexical-channel-textarea-content.textarea-outer",
  },

  conteudoDaMensagem: { classes: ["Markup.module__markup_gc"] },
  mensagemQueMenciona: { classes: ["Message.module__messageMentioned_gc"] },
  barraDaMensagem: { classes: ["MessageActionBar.module__actionBar_gc"] },
  botaoDeReacao: { classes: ["MessageReactions.module__reactionButton_gc"] },

  listaDeAmigos: { classes: ["DMFriendsView.module__content_gc"] },
  ativosAgora: { classes: ["ActiveNowSidebar.module__sidebar_gc"] },
  painelDeBusca: { classes: ["ChannelIndexPage.module__searchPanel_gc"] },
  explorar: { classes: ["DiscoveryPage.module__container_gc"] },

  palcoDeVoz: { classes: ["VoiceCallView.module__root_gc"] },
  paginaDeMembros: { classes: ["GuildMembersPage.module__pageContainer_gc"] },
  cartaoDeEntrada: { classes: ["AuthLayout.module__card_gc"] },
  abertura: { classes: ["SplashScreen.module__splashContent_gc"] },

  /// A moldura da conversa: cabeçalho, mensagens e caixa juntos.
  molduraDoCanal: {
    classes: [
      "ChannelLayout.module__channelLayoutContainer_gc",
      "GuildLayout.module__guildMainContent_gc",
    ],
  },

  cabecalhoDoServidor: { classes: ["GuildHeader.module__headerContainer_gc"] },
  roladorDeCanais: { classes: ["ChannelListContent.module__channelListScroller_gc"] },
  roladorDeMembros: { classes: ["MemberListContainer.module__memberListScroller_gc"] },
  colunaDeAmigos: {
    classes: ["DMFriendsView.module__container_gc", "DMFriendsView.module__mainColumn_gc"],
  },

  divisorDoDia: {
    classes: ["Divider.module__text_gc", "Divider.module__dateWithUnreadText_gc"],
  },

  cartaoDeLink: {
    classes: ["EmbedCard.module__wrapper_gc", "Embed.module__embedFull_gc"],
  },
  cartaoDeAnexo: { classes: ["AttachmentFile.module__attachmentContainer_gc"] },
  anexoSubindo: { classes: ["ChannelAttachmentArea.module__upload_gc"] },
  previaDaMensagem: { classes: ["MessagePreview.module__previewCard_gc"] },
  sugestoes: { classes: ["Autocomplete.module__container_gc"] },
  resultadosDaBusca: { classes: ["ChannelSearchResults.module__container_gc"] },
  itemDoResultado: { classes: ["ChannelSearchResults.module__messageItem_gc"] },
  citacao: { classes: ["Markup.module__blockquoteContainer_gc"] },
  gaveta: { classes: ["Sheet.module__root_gc", "Sheet.module__container_gc"] },
  botaoSecundario: { classes: ["Button.module__secondary_gc"] },

  janela: { classes: ["Modal.module__root_gc", "Modal.module__surface_gc"] },
  fundoDaJanela: { classes: ["Modal.module__modalBackdrop_gc"] },
  menu: { classes: ["ContextMenu.module__contextMenu_gc"] },
  balao: { classes: ["Popout.module__popout_gc"] },
  dica: { classes: ["Tooltip.module__tooltip_gc"] },

  cartaoDePerfil: { classes: ["ProfileCardLayout.module__profileCard_gc"] },
  perfilCompleto: { classes: ["UserProfileModal.module__modalContainer_gc"] },
  seletorDeExpressao: {
    classes: ["ExpressionPickerPopout.module__container_gc"],
  },
  fixadas: { classes: ["ChannelPinsPopout.module__container_gc"] },

  avatar: {
    classes: ["BaseAvatar.module__avatar_gc"],
    flx: "ui.status-aware-avatar.avatar",
  },
  imagemDoAvatar: { classes: [], flx: "ui.base-avatar.image-frame" },
  bolinhaDeStatus: { classes: [], flx: "ui.base-avatar.status-container" },

  campo: { classes: ["Input.module__input_gc"] },
  chave: { classes: [], flx: "ui.form.switch.container" },
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
