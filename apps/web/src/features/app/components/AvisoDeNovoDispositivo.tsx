import React, { useEffect, useRef, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Headphones } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useTranslation } from "~/traducao";

const KEY = "gravae:dispositivos-ignorados";

const readIgnored = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};

interface Fresh {
  id: string;
  name: string;
  kind: "audioinput" | "audiooutput";
}

export const NewDeviceNotice: React.FC = () => {
  const { t } = useTranslation();
  const applySettings = useVoiceStore((s) => s.applySettings);
  const inCall = useVoiceStore((s) => s.channelId !== null);
  const [fresh, setNew] = useState<Fresh | null>(null);
  const [notSuggest, setNotSuggest] = useState(false);

  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.enumerateDevices) return;

    const check = async () => {
      const list = await media.enumerateDevices().catch(() => []);
      const audio = list.filter(
        (d) => d.kind === "audioinput" || d.kind === "audiooutput",
      );

      if (!known.current) {
        known.current = new Set(audio.map((d) => d.deviceId));
        return;
      }

      const ignoredList = readIgnored();
      const match = audio.find(
        (d) =>
          d.deviceId &&
          d.deviceId !== "default" &&
          !known.current!.has(d.deviceId) &&
          !ignoredList.includes(d.label || d.deviceId),
      );

      for (const d of audio) known.current.add(d.deviceId);

      if (match?.label) {
        setNotSuggest(false);
        setNew({
          id: match.deviceId,
          name: match.label,
          kind: match.kind as Fresh["kind"],
        });
      }
    };

    void check();
    media.addEventListener("devicechange", check);
    return () => media.removeEventListener("devicechange", check);
  }, []);

  if (!fresh) return null;

  const isEntry = fresh.kind === "audioinput";

  const close = () => {
    if (notSuggest) {
      try {
        localStorage.setItem(
          KEY,
          JSON.stringify([...readIgnored(), fresh.name]),
        );
      } catch {
      }
    }

    setNew(null);
  };

  const swap = () => {
    void applySettings(
      isEntry ? { entryId: fresh.id } : { outputId: fresh.id },
    );
    setNew(null);
  };

  return (
    <Dialog data-gc="app.aviso-de-novo-dispositivo.dialog" open onOpenChange={(v) => !v && close()}>
      <DialogContent data-gc="app.aviso-de-novo-dispositivo.dialog-content" className="max-w-md">
        <DialogHeader data-gc="app.aviso-de-novo-dispositivo.dialog-header">
          <DialogTitle data-gc="app.aviso-de-novo-dispositivo.dialog-title" className="flex items-center gap-2">
            <Headphones data-gc="app.aviso-de-novo-dispositivo.headphones" size={18} className="text-brand" />
            {isEntry
              ? t("chamada.aparelhoNovo.microfone")
              : t("chamada.aparelhoNovo.saida")}
          </DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="app.aviso-de-novo-dispositivo.dialog-body">
          <p data-gc="app.aviso-de-novo-dispositivo.p" className="text-sm leading-relaxed text-ink-muted">
            {t("chamada.aparelhoNovo.apareceu", { nome: fresh.name })}{" "}
            {isEntry
              ? t("chamada.aparelhoNovo.falarPorEle")
              : t("chamada.aparelhoNovo.ouvirPorEle")}
            {inCall && ` ${t("chamada.aparelhoNovo.trocaNaHora")}`}
          </p>

          <label data-gc="app.aviso-de-novo-dispositivo.label" className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <Checkbox data-gc="app.aviso-de-novo-dispositivo.checkbox"
              checked={notSuggest}
              onChange={(e) => setNotSuggest(e.target.checked)}
            />
            {t("chamada.aparelhoNovo.naoSugerir")}
          </label>
        </DialogBody>

        <DialogFooter data-gc="app.aviso-de-novo-dispositivo.dialog-footer">
          <Button data-gc="app.aviso-de-novo-dispositivo.button.close" variant="ghost" onClick={close}>
            {t("comum.agoraNao")}
          </Button>
          <Button data-gc="app.aviso-de-novo-dispositivo.button.swap" onClick={swap}>{t("chamada.aparelhoNovo.trocar")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
