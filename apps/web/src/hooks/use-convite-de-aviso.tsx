import { useEffect } from "react";
import { toast } from "react-toastify";

import { pedirPermissaoDeAviso, permissaoDeAviso } from "~/lib/notificacoes";

const CHAVE = "gravae:aviso-perguntado";

/**
 * O convite para ligar os avisos, uma vez só.
 *
 * Pedir a permissão no carregamento, sem que ninguém tenha clicado em nada, é
 * o jeito mais rápido de levar um "bloquear" para sempre — e aí nem a tela de
 * Configurações consegue pedir de novo. Então o pedido de verdade acontece no
 * clique daqui, que é um gesto do usuário como o navegador exige.
 *
 * Quem disser "agora não" não vê mais: o caminho continua em Configurações →
 * Notificações.
 */
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

    /// Uma pausa antes de aparecer: chegar junto com a tela ainda montando
    /// vira mais uma coisa piscando no meio de tudo.
    const relogio = setTimeout(() => {
      toast.info(
        ({ closeToast }) => (
          <div>
            <p className="text-sm font-medium">Quer ser avisado das mensagens?</p>
            <p className="mt-0.5 text-xs opacity-80">
              Com o Gravaê atrás de outra janela, ele te chama.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  marcar();
                  void pedirPermissaoDeAviso();
                  closeToast?.();
                }}
                className="rounded bg-brand px-2.5 py-1 text-xs font-semibold text-white"
              >
                Permitir
              </button>
              <button
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
