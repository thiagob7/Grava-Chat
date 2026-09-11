import React, { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { MediaKind } from "@gravae/shared";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { desktop } from "~/lib/desktop";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

type State = "concedida" | "negada" | "indefinida";

interface Line {
  key: string;
  title: string;
  description: string;
  state: State;
  conceder: (() => Promise<void>) | null;
  settings: () => void;
}

const MEDIA: { kind: MediaKind; key: string }[] = [
  { kind: "microphone", key: "microfone" },
  { kind: "camera", key: "camera" },
  { kind: "screen", key: "tela" },
];

export const MacPermissions: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const bridge = desktop();
  const keyPtt = useVoicePrefs((s) => s.keyPtt);
  const [media, setMedia] = useState<Record<string, State>>({});
  const [ptt, setPtt] = useState<State>("indefinida");

  const check = useCallback(async () => {
    if (!bridge) return;

    const read = await Promise.all(
      MEDIA.map(async ({ kind }) => [kind, translate(await bridge.media.status(kind))] as const),
    );
    setMedia(Object.fromEntries(read));

    const state = await bridge.ptt.configure({ active: false, key: keyPtt });
    setPtt(state.unavailable ? "negada" : state.needsPermission ? "indefinida" : "concedida");
  }, [bridge, keyPtt]);

  useEffect(() => {
    if (isOpen) void check();
  }, [isOpen, check]);

  useEffect(() => {
    if (!isOpen) return;

    const onBack = () => void check();
    window.addEventListener("focus", onBack);
    return () => window.removeEventListener("focus", onBack);
  }, [isOpen, check]);

  if (!bridge) return null;

  const lines: Line[] = [
    ...MEDIA.map(({ kind, key }) => ({
      key: kind,
      title: t(`chamada.permissoes.${key}`),
      description: t(`chamada.permissoes.${key}Detalhe`),
      state: media[kind] ?? "indefinida",
      conceder:
        kind === "screen"
          ? null
          : async () => {
              await bridge.media.ensure(kind);
              await check();
            },
      settings: () => bridge.media.openSettings(kind),
    })),
    {
      key: "ptt",
      title: t("chamada.permissoes.monitoramento"),
      description: t("chamada.permissoes.monitoramentoDetalhe"),
      state: ptt,
      conceder: async () => {
        await bridge.ptt.requestPermission({ active: false, key: keyPtt });
        await check();
      },
      settings: () => bridge.media.openSettings("microphone"),
    },
  ];

  return (
    <Dialog data-gc="app.permissoes-do-mac.dialog" open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-gc="app.permissoes-do-mac.dialog-content" className="max-w-lg">
        <DialogHeader data-gc="app.permissoes-do-mac.dialog-header">
          <DialogTitle data-gc="app.permissoes-do-mac.dialog-title">{t("chamada.permissoes.titulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="app.permissoes-do-mac.dialog-body">
          <p data-gc="app.permissoes-do-mac.p" className="text-sm text-ink-muted">
            {t("chamada.permissoes.detalhe")}
          </p>

          <div data-gc="app.permissoes-do-mac.div" className="mt-4 space-y-2">
            {lines.map((line) => (
              <div data-gc="app.permissoes-do-mac.div--2"
                key={line.key}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-1 p-3"
              >
                <div data-gc="app.permissoes-do-mac.div--3" className="min-w-0 flex-1">
                  <p data-gc="app.permissoes-do-mac.p--2" className="text-sm font-medium">{line.title}</p>
                  <p data-gc="app.permissoes-do-mac.p--3" className="mt-0.5 text-xs text-ink-muted">{line.description}</p>
                </div>

                {line.state === "concedida" ? (
                  <span data-gc="app.permissoes-do-mac.span" className="flex shrink-0 items-center gap-1.5 rounded-md bg-online/10 px-2.5 py-1.5 text-xs font-medium text-online">
                    <Check data-gc="app.permissoes-do-mac.check" size={14} /> {t("chamada.permissoes.concedida")}
                  </span>
                ) : (
                  <div data-gc="app.permissoes-do-mac.div--4" className="flex shrink-0 items-center gap-2">
                    <span data-gc="app.permissoes-do-mac.span--2"
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                        line.state === "negada"
                          ? "bg-danger-fundo text-danger"
                          : "bg-aviso/10 text-aviso",
                      )}
                    >
                      {line.state === "negada" ? <X data-gc="app.permissoes-do-mac.x" size={14} /> : null}
                      {t(line.state === "negada" ? "chamada.permissoes.negada" : "chamada.permissoes.naoPedida")}
                    </span>

                    {line.conceder && line.state === "indefinida" ? (
                      <Button data-gc="app.permissoes-do-mac.button" size="sm" onClick={() => void line.conceder?.()}>
                        {t("chamada.permissoes.permitir")}
                      </Button>
                    ) : (
                      <Button data-gc="app.permissoes-do-mac.button.settings" variant="surface" size="sm" onClick={line.settings}>
                        {t("chamada.permissoes.abrirAjustes")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const translate = (status: string): State =>
  status === "granted" ? "concedida" : status === "denied" || status === "restricted" ? "negada" : "indefinida";
