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
    { id: "sessoes", label: "Sessões" },
  ],
  privacidade: [
    { id: "amigos-e-dms", label: "Amigos e mensagens diretas" },
    { id: "compartilhamento-de-atividade", label: "Compartilhamento de atividade" },
    { id: "exportar-dados", label: "Exportar dados" },
  ],
  aparencia: [
    { id: "tema", label: "Tema" },
    { id: "cor-de-destaque", label: "Cor de destaque" },
    { id: "zoom-do-app", label: "Nível de zoom do app" },
    { id: "escala-da-fonte", label: "Escala da fonte do chat" },
    { id: "modo-streamer", label: "Privacidade de transmissão" },
  ],
  voz: [
    { id: "dispositivos", label: "Dispositivos" },
    { id: "teste-do-microfone", label: "Teste do microfone" },
    { id: "modo-de-entrada", label: "Modo de entrada" },
    { id: "sensibilidade", label: "Sensibilidade de entrada" },
    { id: "video", label: "Vídeo" },
    { id: "qualidade", label: "Qualidade" },
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
  acessibilidade: [{ id: "movimento", label: "Movimento" }],
  idioma: [{ id: "formato-da-hora", label: "Formato da hora" }],

  /// Sem subdivisão: uma lista só, ou uma tela de um assunto só.
  aplicativos: [],
  aplicativo: [],
  servidor: [],
};
