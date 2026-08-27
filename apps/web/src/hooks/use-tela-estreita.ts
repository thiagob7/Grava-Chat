import { useSyncExternalStore } from "react";

/*
  Abaixo disto, as três colunas do app não cabem lado a lado: sobra uma faixa de
  conversa de 100px e o resto vira coluna de texto vertical. O valor casa com o
  `md` do Tailwind, pra classe e comportamento não divergirem.
*/
const ESTREITA = "(max-width: 767px)";

const consulta = () => window.matchMedia(ESTREITA);

function assinar(avisar: () => void) {
  const mq = consulta();
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

/*
  `useSyncExternalStore` em vez de useState + useEffect: o valor certo já vem no
  primeiro render, sem aquele quadro inicial com o layout errado que o efeito
  corrige logo depois — e que no celular aparece como um "pisca" na abertura.
*/
export const useTelaEstreita = () =>
  useSyncExternalStore(
    assinar,
    () => consulta().matches,
    () => false,
  );
