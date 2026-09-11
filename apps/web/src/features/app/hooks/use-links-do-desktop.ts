import { useEffect } from "react";
import { useNavigate } from "react-router";

import { desktop } from "~/lib/desktop";

export function useLinksDoDesktop() {
  const navigate = useNavigate();

  useEffect(() => {
    const bridge = desktop();
    if (!bridge?.links) return;

    return bridge.links.onOpen((route) => navigate(route));
  }, [navigate]);
}
