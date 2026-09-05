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

const CHAVE = "gravae:dispositivos-ignorados";

const lerIgnorados = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]") as string[];
  } catch {
    return [];
  }
};

interface Novo {
  id: string;
  nome: string;
  tipo: "audioinput" | "audiooutput";
}

export const AvisoDeNovoDispositivo: React.FC = () => {
  const aplicarAjustes = useVoiceStore((s) => s.aplicarAjustes);
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const [novo, setNovo] = useState<Novo | null>(null);
  const [naoSugerir, setNaoSugerir] = useState(false);

  const conhecidos = useRef<Set<string> | null>(null);

  useEffect(() => {
    const midia = navigator.mediaDevices;
    if (!midia?.enumerateDevices) return;

    const conferir = async () => {
      const lista = await midia.enumerateDevices().catch(() => []);
      const audio = lista.filter(
        (d) => d.kind === "audioinput" || d.kind === "audiooutput",
      );

      if (!conhecidos.current) {
        conhecidos.current = new Set(audio.map((d) => d.deviceId));
        return;
      }

      const ignorados = lerIgnorados();
      const achado = audio.find(
        (d) =>
          d.deviceId &&
          d.deviceId !== "default" &&
          !conhecidos.current!.has(d.deviceId) &&
          !ignorados.includes(d.label || d.deviceId),
      );

      for (const d of audio) conhecidos.current.add(d.deviceId);

      if (achado?.label) {
        setNaoSugerir(false);
        setNovo({
          id: achado.deviceId,
          nome: achado.label,
          tipo: achado.kind as Novo["tipo"],
        });
      }
    };

    void conferir();
    midia.addEventListener("devicechange", conferir);
    return () => midia.removeEventListener("devicechange", conferir);
  }, []);

  if (!novo) return null;

  const ehEntrada = novo.tipo === "audioinput";

  const fechar = () => {
    if (naoSugerir) {
      try {
        localStorage.setItem(
          CHAVE,
          JSON.stringify([...lerIgnorados(), novo.nome]),
        );
      } catch {
        /* sem armazenamento: ele volta a sugerir, e tudo bem */
      }
    }

    setNovo(null);
  };

  const trocar = () => {
    void aplicarAjustes(
      ehEntrada ? { entradaId: novo.id } : { saidaId: novo.id },
    );
    setNovo(null);
  };

  return (
    <Dialog data-gc="app.aviso-de-novo-dispositivo.dialog" open onOpenChange={(v) => !v && fechar()}>
      <DialogContent data-gc="app.aviso-de-novo-dispositivo.dialog-content" className="max-w-md">
        <DialogHeader data-gc="app.aviso-de-novo-dispositivo.dialog-header">
          <DialogTitle data-gc="app.aviso-de-novo-dispositivo.dialog-title" className="flex items-center gap-2">
            <Headphones data-gc="app.aviso-de-novo-dispositivo.headphones" size={18} className="text-brand" />
            {ehEntrada
              ? "Microfone novo por aqui"
              : "Saída de áudio nova por aqui"}
          </DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="app.aviso-de-novo-dispositivo.dialog-body">
          <p data-gc="app.aviso-de-novo-dispositivo.p" className="text-sm leading-relaxed text-ink-muted">
            Apareceu <b data-gc="app.aviso-de-novo-dispositivo.b" className="text-ink">{novo.nome}</b>.{" "}
            {ehEntrada ? "Quer falar por ele?" : "Quer ouvir por ele?"}
            {emChamada && " A troca vale na hora, sem sair da chamada."}
          </p>

          <label data-gc="app.aviso-de-novo-dispositivo.label" className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <Checkbox data-gc="app.aviso-de-novo-dispositivo.checkbox"
              checked={naoSugerir}
              onChange={(e) => setNaoSugerir(e.target.checked)}
            />
            Não sugerir este aparelho de novo
          </label>
        </DialogBody>

        <DialogFooter data-gc="app.aviso-de-novo-dispositivo.dialog-footer">
          <Button data-gc="app.aviso-de-novo-dispositivo.button.fechar" variant="ghost" onClick={fechar}>
            Agora não
          </Button>
          <Button data-gc="app.aviso-de-novo-dispositivo.button.trocar" onClick={trocar}>Trocar para ele</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
