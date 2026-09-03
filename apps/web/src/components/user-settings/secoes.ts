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
  | "aparencia"
  | "bate-papo"
  | "acessibilidade"
  | "idioma"
  | "aplicativo"
  | "servidor";

export interface SubSecao {
  id: string;
  label: string;
}

/// O id do elemento que a rolagem procura. Prefixo pra não colidir com nada
/// que já exista na página por baixo do modal.
export const ancora = (id: string) => `config-${id}`;

export const SUBSECOES: Record<Secao, SubSecao[]> = {
  conta: [
    { id: "detalhes-de-login", label: "Detalhes de login" },
    { id: "dispositivos", label: "Dispositivos" },
    { id: "usuarios-bloqueados", label: "Usuários bloqueados" },
    { id: "aplicativos-autorizados", label: "Aplicativos autorizados" },
    { id: "sessoes", label: "Sessões" },
  ],
  privacidade: [
    { id: "amigos-e-dms", label: "Amigos e mensagens diretas" },
    {
      id: "compartilhamento-de-atividade",
      label: "Compartilhamento de atividade",
    },
    { id: "visibilidade-do-perfil", label: "Visibilidade do perfil" },
    { id: "exportar-dados", label: "Exportar dados" },
    { id: "exclusao-de-dados", label: "Exclusão de dados" },
  ],
  aparencia: [
    { id: "tema", label: "Tema" },
    { id: "cor-de-destaque", label: "Cor de destaque" },
    { id: "interface", label: "Interface" },
    { id: "lista-de-canais", label: "Lista de canais" },
    { id: "zoom-do-app", label: "Nível de zoom do app" },
    { id: "escala-da-fonte", label: "Escala da fonte do chat" },
    { id: "modo-streamer", label: "Privacidade de transmissão" },
  ],
  voz: [
    { id: "dispositivos", label: "Dispositivos" },
    { id: "teste-do-microfone", label: "Teste do microfone" },
    { id: "modo-de-entrada", label: "Modo de entrada" },
    { id: "sensibilidade", label: "Sensibilidade de entrada" },
    { id: "qualidade", label: "Qualidade" },
  ],
  video: [
    { id: "video", label: "Câmera" },
    { id: "transmissao", label: "Transmissão" },
  ],
  "bate-papo": [
    { id: "exibicao", label: "Exibição" },
    { id: "entrada", label: "Entrada" },
    { id: "midia", label: "Mídia" },
  ],
  avisos: [
    { id: "geral", label: "Geral" },
    { id: "preferencia-de-mencao", label: "Preferência de menção" },
    { id: "sons", label: "Sons" },
  ],
  acessibilidade: [
    { id: "movimento", label: "Movimento" },
    { id: "texto-em-voz", label: "Texto em voz" },
    { id: "teclado", label: "Teclado" },
  ],
  idioma: [{ id: "formato-da-hora", label: "Formato da hora" }],

  /// Sem subdivisão: uma lista só, ou uma tela de um assunto só.
  aplicativos: [],
  aplicativo: [],
  servidor: [],
};
