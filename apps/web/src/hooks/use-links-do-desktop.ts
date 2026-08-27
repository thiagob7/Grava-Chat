import { useEffect } from "react";
import { useNavigate } from "react-router";

import { desktop } from "~/lib/desktop";

/**
 * Leva a janela para a rota que o sistema entregou pelo `gravae://`.
 *
 * Só o aplicativo de desktop tem a ponte — no navegador o hook não faz nada.
 */
export function useLinksDoDesktop() {
  const navigate = useNavigate();

  useEffect(() => {
    const ponte = desktop();
    if (!ponte?.links) return;

    return ponte.links.aoAbrir((rota) => navigate(rota));
  }, [navigate]);
}
