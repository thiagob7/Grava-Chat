import { useEffect } from "react";
import { toast } from "react-toastify";

import { noticeRequestPermission, noticePermission } from "~/lib/notificacoes";
import { i18next } from "~/traducao";
import { Button } from "~/components/ui/button";

const KEY = "gravae:aviso-perguntado";

export function useInviteNotice(active: boolean) {
  useEffect(() => {
    if (!active || noticePermission() !== "perguntar") return;

    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }

    const mark = () => {
      try {
        localStorage.setItem(KEY, "1");
      } catch {
      }
    };

    const clock = setTimeout(() => {
      toast.info(
        ({ closeToast }) => (
          <div data-gc="app.use-convite-de-aviso.div">
            <p data-gc="app.use-convite-de-aviso.p" className="text-sm font-medium">{i18next.t("comum.avisoDoNavegador.titulo")}</p>
            <p data-gc="app.use-convite-de-aviso.p--2" className="mt-0.5 text-xs opacity-80">
              {i18next.t("comum.avisoDoNavegador.detalhe")}
            </p>
            <div data-gc="app.use-convite-de-aviso.div--2" className="mt-2 flex gap-2">
              <Button data-gc="app.use-convite-de-aviso.button"
                size="xs"
                onClick={() => {
                  mark();
                  void noticeRequestPermission();
                  closeToast?.();
                }}
              >
                {i18next.t("chamada.permissoes.permitir")}
              </Button>
              <Button data-gc="app.use-convite-de-aviso.button--2"
                size="xs"
                variant="ghost"
                onClick={() => {
                  mark();
                  closeToast?.();
                }}
              >
                {i18next.t("comum.agoraNao")}
              </Button>
            </div>
          </div>
        ),
        { autoClose: false, closeOnClick: false },
      );
    }, 4_000);

    return () => clearTimeout(clock);
  }, [active]);
}
