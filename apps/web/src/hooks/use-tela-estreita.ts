import { useSyncExternalStore } from "react";

const ESTREITA = "(max-width: 767px)";

const consulta = () => window.matchMedia(ESTREITA);

function assinar(avisar: () => void) {
  const mq = consulta();
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

export const useTelaEstreita = () =>
  useSyncExternalStore(
    assinar,
    () => consulta().matches,
    () => false,
  );
