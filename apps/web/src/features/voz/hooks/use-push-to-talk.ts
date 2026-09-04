import { useEffect } from "react";

import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/features/voz/stores/ptt-global";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

function estaDigitando(alvo: EventTarget | null) {
  if (!(alvo instanceof HTMLElement)) return false;

  return (
    alvo.tagName === "INPUT" ||
    alvo.tagName === "TEXTAREA" ||
    alvo.tagName === "SELECT" ||
    alvo.isContentEditable
  );
}

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
      if (tecla === "Space") e.preventDefault();
      definirPtt(true);
    };

    const soltar = (e: KeyboardEvent) => {
      if (e.code !== tecla) return;
      definirPtt(false);
    };

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
