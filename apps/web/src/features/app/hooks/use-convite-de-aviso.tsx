import { useEffect } from "react";
import { toast } from "react-toastify";

import { pedirPermissaoDeAviso, permissaoDeAviso } from "~/lib/notificacoes";

const CHAVE = "gravae:aviso-perguntado";

export function useConviteDeAviso(ativo: boolean) {
  useEffect(() => {
    if (!ativo || permissaoDeAviso() !== "perguntar") return;

    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      return;
    }

    const marcar = () => {
      try {
        localStorage.setItem(CHAVE, "1");
      } catch {
      }
    };

    const relogio = setTimeout(() => {
      toast.info(
        ({ closeToast }) => (
          <div data-gc="app.use-convite-de-aviso.div">
            <p data-gc="app.use-convite-de-aviso.p" className="text-sm font-medium">Quer ser avisado das mensagens?</p>
            <p data-gc="app.use-convite-de-aviso.p--2" className="mt-0.5 text-xs opacity-80">
              Com o Gravaê atrás de outra janela, ele te chama.
            </p>
            <div data-gc="app.use-convite-de-aviso.div--2" className="mt-2 flex gap-2">
              <button data-gc="app.use-convite-de-aviso.button"
                onClick={() => {
                  marcar();
                  void pedirPermissaoDeAviso();
                  closeToast?.();
                }}
                className="rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white"
              >
                Permitir
              </button>
              <button data-gc="app.use-convite-de-aviso.button--2"
                onClick={() => {
                  marcar();
                  closeToast?.();
                }}
                className="rounded px-2.5 py-1 text-xs text-ink-muted hover:text-ink"
              >
                Agora não
              </button>
            </div>
          </div>
        ),
        { autoClose: false, closeOnClick: false },
      );
    }, 4_000);

    return () => clearTimeout(relogio);
  }, [ativo]);
}
