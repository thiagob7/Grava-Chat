import { create } from "zustand";

/**
 * O pedido de "abre esta mensagem para editar", vindo de fora dela.
 *
 * Existe por uma limitação de onde o estado mora: cada `MessageItem` guarda o
 * seu próprio `editing` num `useState`. Isso é bom — ninguém precisa de um
 * estado global pra clicar no lápis — mas fecha a porta para quem está do lado
 * de fora, e a seta pra cima é acionada no CAMPO DE ESCREVER, que não tem
 * acesso nenhum àquele estado.
 *
 * Em vez de subir o `editing` de todas as mensagens para o topo — o que faria
 * a lista inteira redesenhar a cada tecla digitada numa edição —, o campo
 * deixa um bilhete com o id, e a mensagem dona daquele id o recolhe.
 */
type EdicaoStore = {
  /// id da mensagem que deve abrir em edição; `null` quando não há pedido
  pedido: string | null;

  pedir: (messageId: string) => void;
  /*
    Quem recolhe é quem limpa, e no mesmo instante em que abre. Deixar o
    bilhete no quadro faria a mensagem reabrir em edição toda vez que a lista
    remontasse — ao trocar de canal e voltar, por exemplo.
  */
  recolher: () => void;
};

export const useEdicaoStore = create<EdicaoStore>((set) => ({
  pedido: null,

  pedir: (messageId) => set({ pedido: messageId }),
  recolher: () => set({ pedido: null }),
}));
