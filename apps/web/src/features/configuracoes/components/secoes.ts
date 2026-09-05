

export type Secao =
  | "conta"
  | "privacidade"
  | "voz"
  | "video"
  | "avisos"
  | "aplicativos"
  | "conexoes"
  | "aparencia"
  | "bate-papo"
  | "acessibilidade"
  | "idioma"
  | "aplicativo"
  | "atalhos"
  | "servidor";

export interface SubSecao {
  id: string;
  chave: string;
}

export const ancora = (id: string) => `config-${id}`;

export const SUBSECOES: Record<Secao, SubSecao[]> = {
  conta: [
    { id: "detalhes-de-login", chave: "configuracoes.secoes.detalhesDeLogin" },
    { id: "dispositivos", chave: "configuracoes.secoes.dispositivos" },
    {
      id: "usuarios-bloqueados",
      chave: "configuracoes.secoes.usuariosBloqueados",
    },
    {
      id: "aplicativos-autorizados",
      chave: "configuracoes.secoes.aplicativosAutorizados",
    },
    { id: "sessoes", chave: "configuracoes.secoes.sessoes" },
  ],
  privacidade: [
    { id: "amigos-e-dms", chave: "configuracoes.secoes.amigosEDms" },
    {
      id: "compartilhamento-de-atividade",
      chave: "configuracoes.secoes.compartilhamentoDeAtividade",
    },
    {
      id: "visibilidade-do-perfil",
      chave: "configuracoes.secoes.visibilidadeDoPerfil",
    },
    { id: "exportar-dados", chave: "configuracoes.secoes.exportarDados" },
    { id: "exclusao-de-dados", chave: "configuracoes.secoes.exclusaoDeDados" },
  ],
  aparencia: [
    { id: "tema", chave: "configuracoes.secoes.tema" },
    { id: "cor-de-destaque", chave: "configuracoes.secoes.corDeDestaque" },
    { id: "interface", chave: "configuracoes.secoes.interface" },
    { id: "lista-de-canais", chave: "configuracoes.secoes.listaDeCanais" },
    { id: "zoom-do-app", chave: "configuracoes.secoes.zoomDoApp" },
    { id: "escala-da-fonte", chave: "configuracoes.secoes.escalaDaFonte" },
    { id: "modo-streamer", chave: "configuracoes.secoes.modoStreamer" },
  ],
  voz: [
    { id: "dispositivos", chave: "configuracoes.secoes.dispositivosDeVoz" },
    {
      id: "teste-do-microfone",
      chave: "configuracoes.secoes.testeDoMicrofone",
    },
    { id: "modo-de-entrada", chave: "configuracoes.secoes.modoDeEntrada" },
    { id: "sensibilidade", chave: "configuracoes.secoes.sensibilidade" },
    { id: "qualidade", chave: "configuracoes.secoes.qualidade" },
  ],
  video: [
    { id: "video", chave: "configuracoes.secoes.camera" },
    { id: "transmissao", chave: "configuracoes.secoes.transmissao" },
  ],
  "bate-papo": [
    { id: "exibicao", chave: "configuracoes.secoes.exibicao" },
    { id: "entrada", chave: "configuracoes.secoes.entrada" },
    { id: "midia", chave: "configuracoes.secoes.midia" },
  ],
  avisos: [
    { id: "geral", chave: "configuracoes.secoes.geral" },
    {
      id: "preferencia-de-mencao",
      chave: "configuracoes.secoes.preferenciaDeMencao",
    },
    { id: "sons", chave: "configuracoes.secoes.sons" },
  ],
  acessibilidade: [
    { id: "movimento", chave: "configuracoes.secoes.movimento" },
    { id: "texto-em-voz", chave: "configuracoes.secoes.textoEmVoz" },
    { id: "teclado", chave: "configuracoes.secoes.teclado" },
  ],
  idioma: [
    {
      id: "idioma-da-interface",
      chave: "configuracoes.secoes.idiomaDaInterface",
    },
    { id: "formato-da-hora", chave: "configuracoes.secoes.formatoDaHora" },
  ],

  aplicativos: [],
  conexoes: [],
  aplicativo: [],
  atalhos: [],
  servidor: [],
};
