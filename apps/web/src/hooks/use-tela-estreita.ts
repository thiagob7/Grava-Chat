import { useSyncExternalStore } from "react";

const NARROW = "(max-width: 767px)";

const query = () => window.matchMedia(NARROW);

function sign(notify: () => void) {
  const mq = query();
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}

export const useScreenNarrow = () =>
  useSyncExternalStore(
    sign,
    () => query().matches,
    () => false,
  );
