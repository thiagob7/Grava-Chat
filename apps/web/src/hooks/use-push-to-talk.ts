import { useEffect } from "react";

import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/stores/ptt-global";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";

/** Digitando? Então a tecla é texto, não push-to-talk. */
function estaDigitando(alvo: EventTarget | null) {
  if (!(alvo instanceof HTMLElement)) return false;

  return (
    alvo.tagName === "INPUT" ||
    alvo.tagName === "TEXTAREA" ||
    alvo.tagName === "SELECT" ||
    alvo.isContentEditable
  );
}

/**
 * Push-to-talk: enquanto a tecla estiver pressionada, a porta de voz abre.
 *
 * São dois caminhos, e eles se completam:
 *
 * - **janela em foco** — o `keydown`/`keyup` daqui, que sabe se a pessoa está
 *   digitando no chat e nesse caso deixa a tecla ser texto;
 * - **fora de foco** (aplicativo de desktop) — o gancho global do Electron, que
 *   é o caso que interessa de verdade: o jogo em primeiro plano.
 *
 * No navegador só existe o primeiro, e a tela de configurações diz isso na cara
 * da pessoa em vez de esconder na documentação.
 */
export function usePushToTalk() {
  const modo = useVoicePrefs((s) => s.modo);
  const tecla = useVoicePrefs((s) => s.teclaPtt);
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const definirPtt = useVoiceStore((s) => s.definirPtt);
  const definirEstadoGlobal = usePttGlobal((s) => s.definir);

  useEffect(() => {
    if (modo !== "ptt" || !emChamada) return;

    const pressionar = (e: KeyboardEvent) => {
      if (e.code !== tecla || e.repeat || estaDigitando(e.target)) return;
      // espaço rolaria a página enquanto você fala
      if (tecla === "Space") e.preventDefault();
      definirPtt(true);
    };

    const soltar = (e: KeyboardEvent) => {
      if (e.code !== tecla) return;
      definirPtt(false);
    };

    /**
     * Perder o foco solta a tecla. Sem isto, um alt+tab no meio da fala deixa o
     * microfone aberto até você voltar e apertar de novo — exatamente o
     * acidente que o push-to-talk existe pra evitar.
     *
     * No aplicativo isto não corta a fala: o gancho global assume justamente
     * quando a janela perde o foco, e ele manda o `true` de novo se a tecla
     * ainda estiver pressionada.
     */
    const soltarTudo = () => definirPtt(false);

    window.addEventListener("keydown", pressionar);
    window.addEventListener("keyup", soltar);
    window.addEventListener("blur", soltarTudo);

    return () => {
      window.removeEventListener("keydown", pressionar);
      window.removeEventListener("keyup", soltar);
      window.removeEventListener("blur", soltarTudo);
      definirPtt(false);
    };
  }, [modo, tecla, emChamada, definirPtt]);

  /**
   * O gancho global. Fica ligado só durante a chamada com push-to-talk: pedir o
   * mundo inteiro de teclas o tempo todo seria abusivo, e no macOS custa a
   * permissão de Acessibilidade.
   */
  useEffect(() => {
    const ponte = desktop();
    if (!ponte) return;

    const ativo = modo === "ptt" && emChamada;
    let vivo = true;

    void ponte.ptt.configurar({ ativo, tecla }).then((estado) => {
      if (vivo) definirEstadoGlobal(estado);
    });

    const desinscrever = ponte.ptt.aoMudar(definirPtt);

    return () => {
      vivo = false;
      desinscrever();
      void ponte.ptt.configurar({ ativo: false, tecla });
    };
  }, [modo, tecla, emChamada, definirPtt, definirEstadoGlobal]);
}
