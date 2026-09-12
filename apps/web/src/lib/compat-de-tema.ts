import { cn } from "~/lib/utils";

interface Place {
  classes: string[];
  flx?: string;
}

export const PLACES = {
  containerDoApp: {
    classes: ["App.module__appContainer_gc"],
    flx: "app.app.app-wrapper.app-container",
  },

  appFrame: { classes: ["AppLayout.module__appLayout_gc"] },

  frameExternal: {
    classes: ["OutlineFrame.module__frame_gc"],
    flx: "app.outline-frame.frame",
  },
  sideDivider: { classes: ["OutlineFrame.module__divider_gc"] },
  membersDivider: { classes: ["ChannelIndexPage.module__memberListDivider_gc"] },

  appLine: {
    classes: [
      "GuildsLayout.module__guildsLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContainer_gc",
      "GuildLayout.module__guildLayoutContent_gc",
    ],
    flx: "app.guilds-layout.guilds-layout",
  },

  coreColumn: {
    classes: [
      "GuildsLayout.module__contentContainer_gc",
      "ChannelIndexPage.module__channelGrid_gc",
    ],
    flx: "app.guilds-layout.content-container",
  },

  serversRail: {
    classes: ["GuildsLayout.module__guildListScrollerWrapper_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-scroller-wrapper",
  },
  railScroller: {
    classes: ["GuildsLayout.module__guildListScrollContainer_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-scroll-container",
  },
  railContent: {
    classes: ["GuildsLayout.module__guildListContent_gc"],
    flx: "app.guilds-layout.guild-list.guild-list-content",
  },
  topRailSection: {
    classes: ["GuildsLayout.module__guildListTopSection_gc"],
  },
  serversSection: {
    classes: ["GuildsLayout.module__guildListGuildsSection_gc"],
  },

  railItem: { classes: ["GuildsLayout.module__guildListItem_gc"] },

  serverIcon: { classes: ["GuildsLayout.module__guildIcon_gc"] },
  serverActiveIcon: { classes: ["GuildsLayout.module__guildIconSelected_gc"] },
  serverPill: {
    classes: ["GuildsLayout.module__guildIndicator_gc"],
    flx: "app.sidebar-nav.guild-list-item-presentation.guild-indicator",
  },
  pillServerBar: {
    classes: ["GuildsLayout.module__guildIndicatorBar_gc"],
    flx: "app.sidebar-nav.guild-list-item-presentation.guild-indicator-bar",
  },
  railDivider: { classes: ["GuildsLayout.module__guildDivider_gc"] },
  serverSeal: { classes: ["GuildsLayout.module__guildBadge_gc"] },

  listChannels: { classes: ["GuildNavbar.module__guildNavbarContainer_gc"] },

  listChats: {
    classes: ["DMList.module__dmListContainer_gc"],
    flx: "channel.direct-message.dm-list.dm-list-container",
  },

  chatsPage: { classes: [], flx: "channel.direct-message.dm-layout.dm-layout-container" },
  chatDirectColumn: {
    classes: [],
    flx: "channel.direct-message.dm-layout.content-column--2",
  },
  chatsScroller: {
    classes: [],
    flx: "channel.direct-message.dm-list.desktop-scroller",
  },

  chatItem: { classes: ["DMList.module__dmItem_gc"] },
  chatActiveItem: { classes: ["DMList.module__dmItemSelected_gc"] },
  channelActiveItem: {
    classes: ["ChannelItemSurface.module__channelItemSurfaceSelected_gc"],
  },
  channelUnreadPill: {
    classes: ["ChannelItem.module__unreadIndicator_gc"],
  },

  userArea: {
    classes: ["GuildsLayout.module__userAreaWrapper_gc"],
    flx: "app.guilds-layout.user-area-wrapper",
  },

  infoUserLine: { classes: ["UserArea.module__userInfo_gc"] },
  userControls: { classes: ["UserArea.module__controlsContainer_gc"] },
  statusStateDefault: { classes: ["UserArea.module__defaultState_gc"] },
  statusStateHover: { classes: ["UserArea.module__hovered_gc"] },
  callFooter: { classes: ["UserArea.module__voiceConnectionWrapper_gc"] },
  userCard: { classes: ["UserArea.module__userAreaInnerWrapper_gc"] },

  titleBar: {
    classes: ["NativeTitlebar.module__titlebar_gc"],
    flx: "app.native-titlebar.titlebar",
  },
  windowControls: { classes: ["NativeTitlebar.module__controls_gc"] },
  windowButton: { classes: ["NativeTitlebar.module__controlButton_gc"] },

  channelTop: { classes: ["ChannelHeader.module__headerWrapper_gc"] },
  topChannelCore: { classes: ["ChannelHeader.module__headerContainer_gc"] },

  listMembers: {
    classes: ["MemberListContainer.module__memberListContainer_gc"],
  },

  messagesArea: {
    classes: ["ChannelChatLayout.module__messagesArea_gc"],
  },

  chatColumn: {
    classes: ["ChannelChatLayout.module__container_gc"],
    flx: "channel.channel-chat-layout.container",
  },
  scroller: { classes: ["Scroller.module__scroller_gc", "Scroller.module__scrollerWrap_gc"] },
  messagesContent: {
    classes: ["ChannelMessages.module__scrollerInner_gc"],
    flx: "channel.message-group.rendered-messages.div",
  },

  scrollerContent: {
    classes: ["Scroller.module__scrollerChildren_gc"],
    flx: "ui.scroller.scroller-children",
  },
  headerServerFrame: { classes: ["GuildHeader.module__headerWrapper_gc"] },
  settingsSideInternal: {
    classes: ["SettingsModalLayout.module__desktopSidebarInner_gc"],
    flx: "app.settings-modal-layout.settings-modal-desktop-sidebar.desktop-sidebar-inner",
  },
  mentionSeal: { classes: ["MentionBadge.module__badge_gc"] },

  writeBox: {
    classes: ["ChannelChatLayout.module__textareaArea_gc"],
    flx: "channel.channel-chat-layout.textarea-area",
  },
  writeField: {
    classes: ["InputWrapper.module__box_gc"],
    flx: "channel.lexical-channel-textarea-content.textarea-outer",
  },

  writeStack: { classes: ["InputWrapper.module__stackSection_gc"] },
  writeLine: {
    classes: [
      "TextareaInput.module__textareaOuterRow_gc",
      "TextareaInput.module__mainWrapperDense_gc",
    ],
  },

  textColumn: { classes: ["TextareaInput.module__flexColumn_gc"] },
  boxButtons: { classes: ["TextareaInput.module__buttonContainerDense_gc"] },
  boxButton: { classes: ["TextareaButton.module__button_gc"] },

  boxParagraph: { classes: ["LexicalMessageComposer.module__paragraph_gc"] },

  noticeRail: {
    classes: ["InputWrapper.module__statusRail_gc"],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-status-rail",
  },
  modeSlowNotice: {
    classes: [],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-slowmode-slot",
  },

  messagesGroup: { classes: [], flx: "channel.message-group.group" },
  messageBody: { classes: ["Message.module__messageContent_gc"] },
  textMarked: { classes: ["Markup.module__markup_gc"] },
  hourPassMouse: { classes: ["Message.module__messageTimestampHover_gc"] },
  messageWithoutText: { classes: ["Message.module__messageNoText_gc"] },

  messageFrame: { classes: ["Message.module__message_gc"] },
  messageColumn: { classes: ["Message.module__container_gc"] },

  quoteAvatar: { classes: ["Message.module__repliedAvatar_gc"] },
  quoteName: { classes: ["Message.module__repliedUsername_gc"] },
  quoteText: { classes: ["Message.module__repliedTextPreview_gc"] },
  replied: { classes: ["Message.module__repliedMessage_gc"] },

  messageGutter: { classes: ["Message.module__messageGutterLeft_gc"] },
  messageAvatar: { classes: ["Message.module__messageAvatar_gc"] },
  authorLine: {
    classes: ["Message.module__messageAuthorRow_gc", "Message.module__messageAuthorInfo_gc"],
  },
  authorName: { classes: ["Message.module__messageUsername_gc"] },
  messageHour: { classes: ["Message.module__messageTimestamp_gc"] },
  messageText: { classes: ["Message.module__messageText_gc"] },
  editedLabel: {
    classes: ["Message.module__editedLabel_gc", "Message.module__editedTimestamp_gc"],
  },
  typingBalloon: {
    classes: ["Message.module__typingIndicator_gc", "Message.module__typingPill_gc"],
    flx: "channel.lexical-channel-textarea-content.flx-channel-textarea-typing-slot",
  },
  typingText: { classes: ["Message.module__typingText_gc"] },
  attachmentsMosaic: { classes: ["AttachmentMosaic.module__mosaicContainerWrapper_gc"] },
  spoiler: { classes: ["Markup.module__blockSpoiler_gc"] },
  spoilerContent: { classes: ["Markup.module__spoilerContent_gc"] },

  mention: { classes: ["Markup.module__mention_gc"] },
  linkText: { classes: ["Markup.module__link_gc"] },
  codeLine: {
    classes: ["Markup.module__inline_gc", "Markup.module__inlineFormat_gc"],
  },
  codeBlock: {
    classes: ["Markup.module__codeContainer_gc"],
    flx: "messaging.markdown.renderers.common.code-elements.rich-code-block-renderer.div--8",
  },
  codeActions: { classes: ["Markup.module__codeActions_gc"] },

  memberLine: { classes: ["ChannelMembers.module__virtualMemberRow_gc"] },

  memberButton: { classes: ["MemberListItem.module__button_gc"] },
  memberOfflineButton: { classes: ["MemberListItem.module__buttonOffline_gc"] },
  memberAvatar: { classes: ["MemberListItem.module__avatarContainer_gc"] },
  memberName: { classes: ["MemberListItem.module__name_gc"] },
  memberItem: { classes: ["MemberListItem.module__grid_gc"] },
  listMembersContent: { classes: ["ChannelMembers.module__virtualListContent_gc"] },

  textSearchField: { classes: ["MessageSearchBar.module__input_gc"] },
  discoveryField: { classes: ["DiscoveryPage.module__searchInput_gc"] },

  searchFrame: { classes: ["ChannelHeader.module__messageSearchFocusWrapper_gc"] },

  channelIcon: { classes: ["ChannelHeader.module__channelIcon_gc"] },
  channelName: { classes: ["ChannelHeader.module__channelName_gc"] },
  topicDivider: { classes: ["ChannelHeader.module__topicDivider_gc"] },
  channelTopic: {
    classes: ["ChannelHeader.module__topicContainer_gc", "ChannelHeader.module__topicMarkup_gc"],
  },
  topSideRight: { classes: ["ChannelHeader.module__headerRightSection_gc"] },
  topChannelButton: {
    classes: ["ChannelHeader.module__iconButton_gc", "ChannelHeader.module__buttonIcon_gc"],
  },
  searchAnchor: { classes: ["MessageSearchBar.module__anchor_gc"] },
  searchField: {
    classes: ["MessageSearchBar.module__inputContainer_gc"],
    flx: "channel.message-search-bar.message-search-bar.input-container",
  },
  clearSearch: { classes: ["MessageSearchBar.module__clearButton_gc"] },

  userLine: {
    classes: ["UserArea.module__userAreaContainer_gc"],
    flx: "app.user-area.user-area-inner.section",
  },

  nameFooter: { classes: ["UserArea.module__userName_gc"] },
  statusFooter: {
    classes: [
      "UserArea.module__userStatus_gc",
      "UserArea.module__hoverRoll_gc",
      "UserArea.module__userStatusLabel_gc",
    ],
  },
  dataFooter: { classes: ["UserArea.module__userInfoText_gc"] },
  footerButton: {
    classes: ["UserArea.module__controlButton_gc", "UserArea.module__controlIcon_gc"],
  },
  profileBio: { classes: ["UserProfileShared.module__bioContainer_gc"] },

  pronounsProfile: { classes: ["UserProfileModal.module__pronouns_gc"] },
  pronounsCard: { classes: ["ProfileCardUserInfo.module__pronouns_gc"] },
  settingsWindow: { classes: ["SettingsModalLayout.module__container_gc"] },

  settingsSide: {
    classes: [
      "SettingsModalLayout.module__desktopSidebar_gc",
      "SettingsModalLayout.module__sidebarNav_gc",
    ],
  },
  settingsGroup: { classes: ["SettingsModalLayout.module__sidebarCategory_gc"] },
  groupSettingsTitle: {
    classes: ["SettingsModalLayout.module__sidebarCategoryTitle_gc"],
  },
  settingsItem: { classes: ["SettingsModalLayout.module__sidebarItem_gc"] },
  settingsActiveItem: {
    classes: ["SettingsModalLayout.module__sidebarItemSelected_gc"],
  },
  itemSettingsLabel: {
    classes: ["SettingsModalLayout.module__sidebarItemLabel_gc"],
  },
  itemSettingsIcon: {
    classes: ["SettingsModalLayout.module__sidebarItemIcon_gc"],
  },
  settingsContent: {
    classes: [
      "SettingsModalLayout.module__desktopContent_gc",
      "SettingsModalLayout.module__desktopContentCard_gc",
    ],
  },
  settingsTop: { classes: ["SettingsModalLayout.module__desktopHeader_gc"] },
  fieldGroup: { classes: ["FormInput.module__inputGroup_gc"] },

  messageMentions: { classes: ["Message.module__messageMentioned_gc"] },
  messageBar: {
    classes: [
      "MessageActionBar.module__actionBar_gc",
      "MessageActionBar.module__actionBarContainer_gc",
    ],
  },
  reactionButton: {
    classes: ["MessageReactions.module__reactionButton_gc"],
    flx: "channel.message-reactions.message-reaction-item.reaction-button.click",
  },

  appSeal: { classes: ["ChannelUserTag.module__tag_gc"] },
  appTinySeal: { classes: ["ChannelUserTag.module__tagSm_gc"] },

  listFriends: { classes: ["DMFriendsView.module__content_gc"] },
  activeNow: { classes: ["ActiveNowSidebar.module__sidebar_gc"] },

  friendsTitle: { classes: ["DMFriendsView.module__titleSection_gc"] },
  titleFriendsIcon: { classes: ["DMFriendsView.module__titleIcon_gc"] },
  titleFriendsText: { classes: ["DMFriendsView.module__titleText_gc"] },
  topFriendsDivider: { classes: ["DMFriendsView.module__divider_gc"] },
  friendsTab: { classes: ["DMFriendsView.module__tabButton_gc"] },
  friendsActiveTab: { classes: ["DMFriendsView.module__active_gc"] },
  friendsPrincipalTab: { classes: ["DMFriendsView.module__primary_gc"] },
  tabFriendsBody: {
    classes: ["DMFriendsView.module__tabBody_gc", "DMFriendsView.module__tabContent_gc"],
  },
  searchFriendsFrame: { classes: ["DMFriendsView.module__searchWrapper_gc"] },
  searchFriendsIcon: { classes: ["DMFriendsView.module__searchIcon_gc"] },

  activeTitle: { classes: ["ActiveNowSidebar.module__headerTitle_gc"] },
  activeContent: { classes: ["ActiveNowSidebar.module__content_gc"] },
  activeEmpty: { classes: ["ActiveNowSidebar.module__emptyState_gc"] },
  emptyActiveIcon: { classes: ["ActiveNowSidebar.module__emptyIcon_gc"] },
  emptyActiveTitle: { classes: ["ActiveNowSidebar.module__emptyTitle_gc"] },
  emptyActiveDescription: { classes: ["ActiveNowSidebar.module__emptyDescription_gc"] },
  searchPanel: {
    classes: [
      "ChannelIndexPage.module__searchPanel_gc",
      "MessageSearchBar.module__popoutContainer_gc",
    ],
  },
  channelGoodWelcome: { classes: ["ChannelIndexPage.module__emptyStateContent_gc"] },
  editPlaceFrame: { classes: ["InlineEdit.module__wrapper_gc"] },
  editPlaceBox: { classes: ["InlineEdit.module__container_gc"] },
  editPlaceButton: { classes: ["InlineEdit.module__idleButton_gc"] },
  editPlaceField: { classes: ["InlineEdit.module__editable_gc"] },

  avatarsStack: { classes: ["AvatarStack.module__container_gc"] },

  liveSeal: { classes: ["LiveBadge.module__liveBadge_gc"] },

  forwardedBox: { classes: ["MessageAttachments.module__forwardedContainer_gc"] },
  originButton: {
    classes: ["MessageAttachments.module__forwardedSourceButton_gc"],
    flx: "channel.message-attachments.forwarded-from-source.forwarded-source-button.jump-to-original--2",
  },
  originLabel: { classes: ["MessageAttachments.module__forwardedSourceLabel_gc"] },
  originName: { classes: ["MessageAttachments.module__forwardedSourceName_gc"] },

  blockedGroup: { classes: ["BlockedMessageGroups.module__container_gc"] },

  videoControls: { classes: ["VideoPlayer.module__controlsRow_gc"] },

  trackMask: { classes: ["ProfileCardBanner.module__bannerMask_gc"] },
  trackProfileMask: { classes: ["UserProfileModal.module__bannerMask_gc"] },

  roleSeal: { classes: ["RoleManagement.module__roleBadge_gc"] },
  roleName: { classes: ["RoleManagement.module__roleName_gc"] },

  themeButton: { classes: ["ThemeTab.module__themeButtonDark_gc"] },

  boxEntryTop: { classes: ["InboxMessageHeader.module__header_gc"] },
  topBoxEntryButton: {
    classes: ["InboxMessageHeader.module__headerIconButton_gc"],
  },

  chatsColumn: { classes: [], flx: "channel.direct-message.dm-layout.dm-list-column--2" },
  createServerButton: { classes: [], flx: "app.sidebar-nav.add-guild-button.div" },
  exploreButton: { classes: [], flx: "app.sidebar-nav.discovery-button.div" },
  settingsButton: {
    classes: [],
    flx: "app.user-area.user-area-inner.control-button.settings-click",
  },
  voiceEmpty: {
    classes: [],
    flx: "channel.channel-view.guild-channel-view.voice-channel-join-empty-state.voice-join-empty-state",
  },

  createServerIcon: { classes: ["GuildsLayout.module__addGuildButtonIcon_gc"] },

  explore: { classes: ["DiscoveryPage.module__container_gc"] },
  exploreNavigation: {
    classes: [],
    flx: "discovery.discovery.discovery-navbar.navbar",
  },
  friendsSearch: {
    classes: [],
    flx: "channel.direct-message.dm-friends-view.input.set-search-query",
  },

  voiceStage: { classes: ["VoiceCallView.module__root_gc"] },

  callTop: { classes: ["VoiceCallView.module__voiceHeader_gc"] },
  topCallButton: { classes: ["VoiceCallView.module__voiceHeaderIconButton_gc"] },
  controlsCallBar: {
    classes: ["VoiceCallView.module__controlBarContainer_gc"],
    flx: "voice.voice-control-bar.voice-control-bar-inner.container",
  },
  participantFrame: { classes: ["VoiceCallView.module__lkParticipantTile_gc"] },
  avatarWithoutCamera: { classes: ["VoiceCallView.module__audioAvatarFallback_gc"] },
  participantSeals: {
    classes: [
      "VoiceCallView.module__lkParticipantMetadata_gc",
      "VoiceCallView.module__tileControlPill_gc",
    ],
  },
  participantName: { classes: ["VoiceCallView.module__participantName_gc"] },
  broadcastInfo: { classes: ["VoiceCallView.module__streamFocusInfo_gc"] },
  whoBroadcastsName: { classes: ["VoiceCallView.module__streamFocusStreamerName_gc"] },
  topFaded: { classes: ["VoiceCallView.module__voiceEdgeFadeTop_gc"] },
  baseFaded: { classes: ["VoiceCallView.module__voiceEdgeFadeBottom_gc"] },
  callCompact: { classes: ["DMChannelView.module__callBanner_gc"] },
  callCompactStage: {
    classes: [
      "DMChannelView.module__compactVoiceCallView_gc",
      "DMChannelView.module__compactCallWrapper_gc",
    ],
    flx: "channel.channel-view.dm-channel-view.compact-call-wrapper",
  },

  membersPage: { classes: ["GuildMembersPage.module__pageContainer_gc"] },
  entryCard: { classes: ["AuthLayout.module__card_gc"] },
  opening: { classes: ["SplashScreen.module__splashContent_gc"] },

  channelFrame: {
    classes: [
      "ChannelLayout.module__channelLayoutContainer_gc",
      "ChannelIndexPage.module__contentGrid_gc",
      "GuildLayout.module__guildMainContent_gc",
    ],
    flx: "app.guilds-layout.main-content",
  },

  serverHeader: { classes: ["GuildHeader.module__headerContainer_gc"] },
  channelsScroller: { classes: ["ChannelListContent.module__channelListScroller_gc"] },
  channelsGroup: { classes: ["ChannelListContent.module__channelGroupsContainer_gc"] },
  listChannelsFrame: {
    classes: ["ChannelListContent.module__navigationContainer_gc"],
    flx: "app.guild-sidebar.guild-navbar",
  },
  membersScroller: { classes: ["MemberListContainer.module__memberListScroller_gc"] },
  friendsColumn: {
    classes: ["DMFriendsView.module__container_gc", "DMFriendsView.module__mainColumn_gc"],
    flx: "channel.direct-message.dm-friends-view.container",
  },

  dayDivider: {
    classes: ["Divider.module__text_gc", "Divider.module__dateWithUnreadText_gc"],
  },

  linkCard: {
    classes: ["EmbedCard.module__wrapper_gc", "Embed.module__embedFull_gc"],
    flx: "messaging.embeds.embed-card.embed-card.wrapper",
  },
  cardLinkCore: {
    classes: [],
    flx: "channel.embeds.embed.rich-embed.embed",
  },
  twoGrid: { classes: ["AttachmentLayoutGrid.module__twoImageGrid_gc"] },
  threeGrid: { classes: ["AttachmentLayoutGrid.module__threeImageGrid_gc"] },
  fourGrid: { classes: ["AttachmentLayoutGrid.module__fourImageGrid_gc"] },
  fiveGrid: { classes: ["AttachmentLayoutGrid.module__fiveImageGrid_gc"] },
  sixGrid: { classes: ["AttachmentLayoutGrid.module__sixImageGrid_gc"] },
  sevenBox: { classes: ["AttachmentLayoutGrid.module__sevenImageContainer_gc"] },
  sevenGrid: { classes: ["AttachmentLayoutGrid.module__sevenGrid_gc"] },
  eightBox: { classes: ["AttachmentLayoutGrid.module__eightImageContainer_gc"] },
  eightGrid: { classes: ["AttachmentLayoutGrid.module__eightBottomGrid_gc"] },
  nineGrid: { classes: ["AttachmentLayoutGrid.module__nineImageGrid_gc"] },
  tenBox: { classes: ["AttachmentLayoutGrid.module__tenImageContainer_gc"] },
  tenGrid: { classes: ["AttachmentLayoutGrid.module__tenGrid_gc"] },

  attachmentCard: {
    classes: [
      "AttachmentFile.module__attachmentContainer_gc",
      "Attachment.module__attachmentWrapper_gc",
    ],
  },
  attachmentUploading: {
    classes: [
      "ChannelAttachmentArea.module__upload_gc",
      "InputWrapper.module__composerActionStack_gc",
    ],
  },
  messagePreview: { classes: ["MessagePreview.module__previewCard_gc"] },
  suggestions: { classes: ["Autocomplete.module__container_gc"] },
  searchResults: { classes: ["ChannelSearchResults.module__container_gc"] },
  resultItem: { classes: ["ChannelSearchResults.module__messageItem_gc"] },
  quote: { classes: ["Markup.module__blockquoteContainer_gc"] },
  quoteDivider: { classes: ["Markup.module__blockquoteDivider_gc"] },
  markdownNotice: { classes: ["Markup.module__alert_gc"] },
  noticeTitle: { classes: ["Markup.module__alertTitle_gc"] },
  noticeBody: { classes: ["Markup.module__alertContent_gc"] },
  noticeNote: { classes: ["Markup.module__alertNote_gc"] },
  noticeHint: { classes: ["Markup.module__alertTip_gc"] },
  noticeImportant: { classes: ["Markup.module__alertImportant_gc"] },
  noticeAttention: { classes: ["Markup.module__alertWarning_gc"] },
  noticeCaution: { classes: ["Markup.module__alertCaution_gc"] },
  drawer: { classes: ["Sheet.module__root_gc", "Sheet.module__container_gc"] },
  secondaryButton: { classes: ["Button.module__secondary_gc"] },

  buttonPrimary: { classes: ["Button.module__primary_gc"] },
  dangerButton: { classes: ["Button.module__danger_gc"] },
  buttonInverted: { classes: ["Button.module__inverted_gc"] },
  button: { classes: ["Button.module__button_gc"] },

  itemDoMenu: { classes: ["ContextMenu.module__item_gc"] },
  submenu: { classes: ["ContextMenu.module__submenuPopover_gc"] },
  markBox: { classes: ["ContextMenu.module__checkbox_gc"] },
  markOnBox: { classes: ["ContextMenu.module__checkboxChecked_gc"] },

  sliderControl: { classes: ["Slider.module__control_gc"] },
  sliderCore: { classes: ["Slider.module__sliderControl_gc"] },
  sliderRail: { classes: ["Slider.module__track_gc"] },
  sliderFill: { classes: ["Slider.module__barFill_gc"] },
  sliderFist: { classes: ["Slider.module__grabber_gc"] },

  defaultBrand: { classes: ["Slider.module__defaultValue_gc"] },
  brandTick: { classes: ["Slider.module__markDash_gc"] },
  brandNumber: { classes: ["Slider.module__markValue_gc"] },

  tab: { classes: ["Tabs.module__tab_gc"] },
  tabPicked: { classes: ["Tabs.module__selected_gc"] },

  fieldFrame: { classes: ["FormInput.module__inputWrapper_gc"] },

  balloonFloating: { classes: ["PopoverPopout.module__popout_gc"] },
  entryBox: {
    classes: [
      "InboxPopout.module__container_gc",
      "InboxPopout.module__containerWithSidebar_gc",
    ],
  },
  boxEntrySide: { classes: ["InboxPopout.module__sidebar_gc"] },

  markLooseBox: { classes: ["Checkbox.module__checkbox_gc"] },
  fieldSurface: { classes: ["FormSurface.module__surface_gc"] },
  comboGroup: {
    classes: ["FormCombobox.module__inputGroup_gc"],
    flx: "ui.form.combobox.input-group",
  },
  pickerColorFrame: { classes: ["ColorPickerField.module__inputWrapper_gc"] },
  itemDeRadioDoMenu: { classes: ["MenuItemRadio.module__radioButton_gc"] },

  radioGroup: { classes: ["RadioGroup.module__group_gc"] },
  radioOption: { classes: ["RadioGroup.module__radioGroupOption_gc"] },
  radioIndicator: { classes: ["RadioGroup.module__radioIndicator_gc"] },
  baseDoRadio: { classes: ["RadioGroup.module__outerRadioBase_gc"] },
  radioDot: { classes: ["RadioGroup.module__innerDotRadio_gc"] },
  radioMenuPickedItem: {
    classes: ["MenuItemRadio.module__radioButtonSelected_gc"],
  },
  menuOffItem: { classes: ["ContextMenu.module__disabled_gc"] },

  spoilerWrapper: { classes: ["Markup.module__spoilerWrapper_gc"] },
  spoilerLine: { classes: ["Markup.module__spoiler_gc"] },

  profileCompleteContent: { classes: ["UserProfileModal.module__profileContent_gc"] },
  cardProfileSection: { classes: ["ProfileCardContent.module__contentSection_gc"] },

  voiceActiveCard: { classes: ["VoiceActivityCard.module__card_gc"] },
  listChatsPanel: { classes: ["DirectMessageList.module__dmChannelList_gc"] },
  listChatsTop: { classes: ["DirectMessageList.module__dmListHeader_gc"] },
  profileSettings: { classes: ["UserSettingsModal.module__userProfile_gc"] },
  windowSettingsTop: {
    classes: ["SettingsModalHeader.module__headerTransition_gc"],
  },
  avatarFrame: { classes: ["BaseAvatar.module__container_gc"] },

  appWindow: { classes: ["Modal.module__root_gc", "Modal.module__surface_gc"] },
  windowBackground: { classes: ["Modal.module__modalBackdrop_gc"] },
  menu: { classes: ["ContextMenu.module__contextMenu_gc"] },
  balloon: { classes: ["Popout.module__popout_gc"] },
  hint: { classes: ["Tooltip.module__tooltip_gc"] },

  profileCard: { classes: ["ProfileCardLayout.module__profileCard_gc"] },
  completeProfile: {
    classes: [
      "UserProfileModal.module__modalContainer_gc",
      "UserProfileModal.module__modalRoot_gc",
    ],
  },
  profileContent: { classes: ["UserProfileModal.module__profileContentWrapper_gc"] },

  profileData: {
    classes: [
      "ProfileCardUserInfo.module__userInfoContainer_gc",
      "UserProfileModal.module__userInfoContent_gc",
    ],
  },
  nameProfileLine: {
    classes: [
      "ProfileCardUserInfo.module__nameRow_gc",
      "UserProfileModal.module__nameRow_gc",
    ],
  },
  userProfileLine: {
    classes: [
      "ProfileCardUserInfo.module__usernameRow_gc",
      "UserProfileModal.module__usernameRow_gc",
    ],
  },
  userProfileButton: { classes: ["ProfileCardUserInfo.module__usernameButton_gc"] },
  photoProfileFrame: {
    classes: [
      "ProfileCardBanner.module__avatarButton_gc",
      "UserProfileModal.module__avatarContainer_gc",
    ],
  },

  profileNote: {
    classes: [
      "CustomStatusDisplay.module__editableWrapper_gc",
      "ProfilePreview.module__profileCustomStatus_gc",
      "UserProfilePopout.module__profileCustomStatus_gc",
      "UserProfileModal.module__customStatusRow_gc",
      "UserAreaPopout.module__customStatusRow_gc",
    ],
  },
  noteText: { classes: ["CustomStatusDisplay.module__content_gc"] },
  emptyNote: { classes: ["UserAreaPopout.module__customStatusPlaceholder_gc"] },

  tabsFrame: { classes: ["Tabs.module__container_gc"] },

  textPreview: { classes: ["TextualAttachmentPreview.module__textualPreview_gc"] },
  expressionPicker: {
    classes: ["ExpressionPickerPopout.module__container_gc"],
  },
  pinned: { classes: ["ChannelPinsPopout.module__container_gc"] },

  avatar: {
    classes: ["BaseAvatar.module__avatar_gc"],
    flx: "ui.status-aware-avatar.avatar",
  },
  avatarImage: { classes: [], flx: "ui.base-avatar.image-frame" },
  statusDot: {
    classes: ["BaseAvatar.module__statusContainer_gc"],
    flx: "ui.base-avatar.status-container",
  },

  field: { classes: ["Input.module__input_gc"] },

  fieldError: { classes: ["FormInput.module__error_gc"] },
  passwordEye: { classes: ["FormInput.module__passwordToggle_gc"] },
  key: { classes: ["FormSwitch.module__switchRoot_gc"], flx: "ui.form.switch.container" },
  notice: { classes: ["Toast.module__toast_gc"] },
} as const satisfies Record<string, Place>;

export type Places = keyof typeof PLACES;

export function flx(place: Places, className?: string) {
  const target: Place = PLACES[place];

  return {
    className: cn(className, ...target.classes),
    ...(target.flx ? { "data-flx": target.flx } : {}),
  };
}

export function flxAttr(place: Places) {
  const target: Place = PLACES[place];

  return target.flx ? { "data-flx": target.flx } : {};
}

export function flxCls(place: Places) {
  return PLACES[place].classes.join(" ");
}
