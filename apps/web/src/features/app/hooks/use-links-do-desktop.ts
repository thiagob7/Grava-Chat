import { useEffect } from "react";
import { useNavigate } from "react-router";

import { desktop } from "~/lib/desktop";

export function useLinksDoDesktop() {
  const navigate = useNavigate();

  useEffect(() => {
    const ponte = desktop();
    if (!ponte?.links) return;

    return ponte.links.aoAbrir((rota) => navigate(rota));
  }, [navigate]);
}
