import React, { useEffect, useRef, useState } from "react";
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
import { useVoiceStore } from "~/stores/voice-store";
import { useVoicePrefs } from "~/stores/voice-prefs";

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

/*
  Avisa quando um microfone ou fone novo aparece, e oferece trocar.

  O caso é sempre o mesmo: a pessoa pluga o fone no meio da conversa e continua
  falando no microfone do notebook por mais dez minutos até alguém reclamar. O
  navegador não troca sozinho — e trocar sozinho seria pior, porque nem todo
  aparelho que aparece é o que se quer usar (um monitor com alto-falante ruim,
  uma placa virtual de captura).

  Por isso é uma pergunta, com um "não sugira mais este" que ela lembra: quem
  tem uma placa virtual que aparece toda hora precisa poder calar essa sugestão
  pra sempre, ou o aviso vira barulho e ninguém mais lê.
*/
export const AvisoDeNovoDispositivo: React.FC = () => {
  const aplicarAjustes = useVoiceStore((s) => s.aplicarAjustes);
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const [novo, setNovo] = useState<Novo | null>(null);
  const [naoSugerir, setNaoSugerir] = useState(false);

  /// Guardado em ref, e não em estado: mudar isto não redesenha nada, e como
  /// estado ele reiniciaria o efeito a cada aparelho novo.
  const conhecidos = useRef<Set<string> | null>(null);

  useEffect(() => {
    const midia = navigator.mediaDevices;
    if (!midia?.enumerateDevices) return;

    const conferir = async () => {
      const lista = await midia.enumerateDevices().catch(() => []);
      const audio = lista.filter(
        (d) => d.kind === "audioinput" || d.kind === "audiooutput",
      );

      /*
        A primeira leitura só ANOTA o que já existe. Sem isso, todo aparelho
        do computador seria "novo" na abertura e a pessoa levaria uma janela na
        cara antes de fazer qualquer coisa.
      */
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

      /*
        Sem rótulo não dá pra perguntar: antes de conceder o microfone, o
        navegador entrega a lista com os nomes em branco, e "aparelho novo
        detectado: (sem nome)" não ajuda ninguém a decidir.
      */
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
        localStorage.setItem(CHAVE, JSON.stringify([...lerIgnorados(), novo.nome]));
      } catch {
        /* sem armazenamento: ele volta a sugerir, e tudo bem */
      }
    }

    setNovo(null);
  };

  const trocar = () => {
    void aplicarAjustes(ehEntrada ? { entradaId: novo.id } : { saidaId: novo.id });
    setNovo(null);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones size={18} className="text-brand" />
            {ehEntrada ? "Microfone novo por aqui" : "Saída de áudio nova por aqui"}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <p className="text-sm leading-relaxed text-ink-muted">
            Apareceu <b className="text-ink">{novo.nome}</b>.{" "}
            {ehEntrada ? "Quer falar por ele?" : "Quer ouvir por ele?"}
            {emChamada && " A troca vale na hora, sem sair da chamada."}
          </p>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={naoSugerir}
              onChange={(e) => setNaoSugerir(e.target.checked)}
              className="size-4 accent-brand"
            />
            Não sugerir este aparelho de novo
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>
            Agora não
          </Button>
          <Button onClick={trocar}>Trocar para ele</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
