import { useEffect, useState } from "react";
import type { UpdateState } from "@gravae/shared";

import { desktop } from "~/lib/desktop";

export function useUpdate() {
  const [state, setState] = useState<UpdateState | null>(null);

  useEffect(() => {
    const bridge = desktop()?.update;
    if (!bridge) return;

    void bridge.state().then(setState);
    return bridge.onChange(setState);
  }, []);

  const bridge = desktop()?.update;

  return {
    state,
    bridge,
    hasNews: Boolean(state?.available) && state?.phase !== "erro",
    downloading: state?.phase === "baixando",
    ready: state?.phase === "pronta",
    installing: state?.phase === "instalando",
  };
}
