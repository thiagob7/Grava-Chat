/*
  O mapa das seções das configurações — a fonte única.

  A lateral desenha os sub-itens a partir daqui e cada tela marca as suas
  âncoras com os mesmos ids. Com duas listas, bastaria renomear uma seção pra
  ganhar um sub-item que rola pra lugar nenhum, e nada acusaria: a rolagem
  simplesmente não aconteceria.
*/

export type Secao = "conta" | "voz" | "avisos" | "bots" | "aparencia" | "aplicativo" | "servidor";

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
  aparencia: [
    { id: "tema", label: "Tema" },
    { id: "cor-de-destaque", label: "Cor de destaque" },
    { id: "mensagens", label: "Mensagens" },
    { id: "caixa-de-chat", label: "Caixa de chat" },
    { id: "modo-streamer", label: "Modo streamer" },
  ],
  voz: [
    { id: "dispositivos", label: "Dispositivos" },
    { id: "teste-do-microfone", label: "Teste do microfone" },
    { id: "modo-de-entrada", label: "Modo de entrada" },
    { id: "sensibilidade", label: "Sensibilidade de entrada" },
    { id: "qualidade", label: "Qualidade" },
  ],
  avisos: [{ id: "o-que-te-interrompe", label: "O que te interrompe" }],

  /// Sem subdivisão: uma lista só, ou uma tela de um assunto só.
  bots: [],
  aplicativo: [],
  servidor: [],
};
