/*
  O mapa das seções das configurações — a fonte única.

  A lateral desenha os sub-itens a partir daqui e cada tela marca as suas
  âncoras com os mesmos ids. Com duas listas, bastaria renomear uma seção pra
  ganhar um sub-item que rola pra lugar nenhum, e nada acusaria: a rolagem
  simplesmente não aconteceria.
*/

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
  | "servidor";

export interface SubSecao {
  id: string;
  /*
    A chave da tradução, não o texto.

    Aqui só vive a ESTRUTURA — que telas existem e que âncoras cada uma tem. O
    texto mora no catálogo, com os outros, porque a lateral em português e o
    título da tela em inglês seriam duas metades do mesmo modal em idiomas
    diferentes. Um mapa não é lugar de texto de interface.
  */
  chave: string;
}

/// O id do elemento que a rolagem procura. Prefixo pra não colidir com nada
/// que já exista na página por baixo do modal.
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
    /// Chave própria, e não a mesma de Conta: as duas dizem "Dispositivos" em
    /// português por coincidência — uma é aparelho conectado à conta, a outra
    /// é microfone e caixa de som. Compartilhar a chave amarraria as duas.
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

  /// Sem subdivisão: uma lista só, ou uma tela de um assunto só.
  aplicativos: [],
  conexoes: [],
  aplicativo: [],
  servidor: [],
};
