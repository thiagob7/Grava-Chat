

export type Section =
  | "account"
  | "privacy"
  | "voice"
  | "video"
  | "notices"
  | "apps"
  | "connections"
  | "appearance"
  | "chat"
  | "accessibility"
  | "language"
  | "app"
  | "desktop"
  | "shortcuts"
  | "advanced";

export interface SubSection {
  id: string;
  key: string;
}

export const anchor = (id: string) => `config-${id}`;

export const SUBSECTIONS: Record<Section, SubSection[]> = {
  account: [
    { id: "detalhes-de-login", key: "configuracoes.secoes.detalhesDeLogin" },
    { id: "dispositivos", key: "configuracoes.secoes.dispositivos" },
    {
      id: "usuarios-bloqueados",
      key: "configuracoes.secoes.usuariosBloqueados",
    },
    {
      id: "aplicativos-autorizados",
      key: "configuracoes.secoes.aplicativosAutorizados",
    },
    { id: "sessoes", key: "configuracoes.secoes.sessoes" },
  ],
  privacy: [
    { id: "amigos-e-dms", key: "configuracoes.secoes.amigosEDms" },
    {
      id: "compartilhamento-de-atividade",
      key: "configuracoes.secoes.compartilhamentoDeAtividade",
    },
    {
      id: "visibilidade-do-perfil",
      key: "configuracoes.secoes.visibilidadeDoPerfil",
    },
    { id: "exportar-dados", key: "configuracoes.secoes.exportarDados" },
    { id: "exclusao-de-dados", key: "configuracoes.secoes.exclusaoDeDados" },
  ],
  appearance: [
    { id: "tema", key: "configuracoes.secoes.tema" },
    { id: "cor-de-destaque", key: "configuracoes.secoes.corDeDestaque" },
    { id: "interface", key: "configuracoes.secoes.interface" },
    { id: "lista-de-canais", key: "configuracoes.secoes.listaDeCanais" },
    { id: "zoom-do-app", key: "configuracoes.secoes.zoomDoApp" },
    { id: "escala-da-fonte", key: "configuracoes.secoes.escalaDaFonte" },
    { id: "modo-streamer", key: "configuracoes.secoes.modoStreamer" },
  ],
  voice: [
    { id: "dispositivos", key: "configuracoes.secoes.dispositivosDeVoz" },
    {
      id: "teste-do-microfone",
      key: "configuracoes.secoes.testeDoMicrofone",
    },
    { id: "modo-de-entrada", key: "configuracoes.secoes.modoDeEntrada" },
    { id: "sensibilidade", key: "configuracoes.secoes.sensibilidade" },
    { id: "qualidade", key: "configuracoes.secoes.qualidade" },
  ],
  video: [
    { id: "video", key: "configuracoes.secoes.camera" },
    { id: "transmissao", key: "configuracoes.secoes.transmissao" },
  ],
  chat: [
    { id: "exibicao", key: "configuracoes.secoes.exibicao" },
    { id: "entrada", key: "configuracoes.secoes.entrada" },
    { id: "midia", key: "configuracoes.secoes.midia" },
  ],
  notices: [
    { id: "geral", key: "configuracoes.secoes.geral" },
    {
      id: "preferencia-de-mencao",
      key: "configuracoes.secoes.preferenciaDeMencao",
    },
    { id: "sons", key: "configuracoes.secoes.sons" },
  ],
  accessibility: [
    { id: "movimento", key: "configuracoes.secoes.movimento" },
    { id: "texto-em-voz", key: "configuracoes.secoes.textoEmVoz" },
    { id: "teclado", key: "configuracoes.secoes.teclado" },
  ],
  language: [
    {
      id: "idioma-da-interface",
      key: "configuracoes.secoes.idiomaDaInterface",
    },
    { id: "formato-da-hora", key: "configuracoes.secoes.formatoDaHora" },
  ],

  apps: [],
  connections: [],
  app: [],
  desktop: [],
  shortcuts: [],
  advanced: [],
};
