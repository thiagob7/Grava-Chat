import { useEffect } from "react";

import { readUrlRequest, clearUrlRequest } from "~/features/app/lib/link-de-config";
import { SUBSECTIONS } from "~/features/configuracoes/components/secoes";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";

export function useConfigByUrl(): void {
  useEffect(() => {
    const request = readUrlRequest();
    if (!request) return;

    if (!(request.section in SUBSECTIONS)) {
      clearUrlRequest();
      return;
    }

    const exists = SUBSECTIONS[request.section].some((sub) => sub.id === request.sub);

    useSettings.getState().open(request.section, exists ? (request.sub ?? undefined) : undefined);
    clearUrlRequest();
  }, []);
}
