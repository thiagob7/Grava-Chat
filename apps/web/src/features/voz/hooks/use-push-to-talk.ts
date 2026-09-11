import { useEffect } from "react";

import { desktop } from "~/lib/desktop";
import { usePttGlobal } from "~/features/voz/stores/ptt-global";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

function thisTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function usePushToTalk() {
  const mode = useVoicePrefs((s) => s.mode);
  const key = useVoicePrefs((s) => s.keyPtt);
  const inCall = useVoiceStore((s) => s.channelId !== null);
  const setPtt = useVoiceStore((s) => s.setPtt);
  const setStateGlobal = usePttGlobal((s) => s.set);

  useEffect(() => {
    if (mode !== "ptt" || !inCall) return;

    const press = (e: KeyboardEvent) => {
      if (e.code !== key || e.repeat || thisTyping(e.target)) return;
      if (key === "Space") e.preventDefault();
      setPtt(true);
    };

    const drop = (e: KeyboardEvent) => {
      if (e.code !== key) return;
      setPtt(false);
    };

    const dropEverything = () => setPtt(false);

    window.addEventListener("keydown", press);
    window.addEventListener("keyup", drop);
    window.addEventListener("blur", dropEverything);

    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", drop);
      window.removeEventListener("blur", dropEverything);
      setPtt(false);
    };
  }, [mode, key, inCall, setPtt]);

  useEffect(() => {
    const bridge = desktop();
    if (!bridge) return;

    const active = mode === "ptt" && inCall;
    let live = true;

    void bridge.ptt.configure({ active, key }).then((state) => {
      if (live) setStateGlobal(state);
    });

    const unsubscribe = bridge.ptt.onChange(setPtt);

    return () => {
      live = false;
      unsubscribe();
      void bridge.ptt.configure({ active: false, key });
    };
  }, [mode, key, inCall, setPtt, setStateGlobal]);
}
