import React, { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, AppWindow, Volume2 } from "lucide-react";
import type { FonteDeTela } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { desktop } from "~/lib/desktop";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const SeletorDeTela: React.FC = () => {
  const { t } = useTranslation();
  const [fontes, setFontes] = useState<FonteDeTela[] | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [comAudio, setComAudio] = useState(true);
  const [semPermissao, setSemPermissao] = useState(false);

  const respondido = useRef(true);

  const definirFonteDaTela = useVoiceStore((s) => s.definirFonteDaTela);

  const responder = useCallback(
    (escolha: { id: string; comAudio: boolean } | null, lista: FonteDeTela[] | null) => {
      if (respondido.current) return;
      respondido.current = true;

      const fonte = escolha ? lista?.find((f) => f.id === escolha.id) : null;
      definirFonteDaTela(fonte ? { nome: fonte.nome, icone: fonte.icone } : null);

      desktop()?.tela.responder(escolha);
      setFontes(null);
      setEscolhido(null);
    },
    [definirFonteDaTela],
  );

  useEffect(() => {
    const ponte = desktop();
    if (!ponte) return;

    return ponte.tela.aoPedirEscolha((lista) => {
      respondido.current = false;
      setFontes(lista);
      setEscolhido(lista[0]?.id ?? null);
      void ponte.tela.permissao().then((p) => setSemPermissao(p !== "granted"));
    });
  }, []);

  if (!fontes) return null;

  const telas = fontes.filter((f) => f.ehTela);
  const janelas = fontes.filter((f) => !f.ehTela);

  return (
    <Dialog data-gc="voz.seletor-de-tela.dialog" open onOpenChange={(aberto) => !aberto && responder(null, fontes)}>
      <DialogContent data-gc="voz.seletor-de-tela.dialog-content" className="max-w-3xl">
        <DialogHeader data-gc="voz.seletor-de-tela.dialog-header">
          <DialogTitle data-gc="voz.seletor-de-tela.dialog-title">{t("chamada.tela.compartilhar")}</DialogTitle>
        </DialogHeader>

        <div data-gc="voz.seletor-de-tela.div" className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {semPermissao && (
            <div data-gc="voz.seletor-de-tela.div--2" className="mb-4 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
              <p data-gc="voz.seletor-de-tela.p">
                {t("chamada.gravacaoDeTela.bloqueada")}
              </p>
              <Button data-gc="voz.seletor-de-tela.button"
                className="mt-2"
                variant="surface"
                size="sm"
                onClick={() => desktop()?.midia.abrirAjustes("screen")}
              >
                {t("chamada.microfone.abrirAjustes")}
              </Button>
              <p data-gc="voz.seletor-de-tela.p--2" className="mt-2 text-ink-faint">
                {t("chamada.gravacaoDeTela.marque")} <b data-gc="voz.seletor-de-tela.b">{desktop()?.nomeNoSistema}</b>{" "}
                {t("chamada.gravacaoDeTela.reabra")}
              </p>

              <p data-gc="voz.seletor-de-tela.p--3" className="mt-1.5 text-ink-faint">
                {t("chamada.gravacaoDeTela.jaMarcado")}
              </p>
            </div>
          )}

          {fontes.length === 0 && !semPermissao && (
            <p data-gc="voz.seletor-de-tela.p--4" className="py-8 text-center text-sm text-ink-muted">
              {t("chamada.tela.semFontes")}
            </p>
          )}

          <Grupo data-gc="voz.seletor-de-tela.grupo.set-escolhido"
            titulo={t("chamada.tela.telas")}
            icone={<Monitor data-gc="voz.seletor-de-tela.monitor" size={13} />}
            fontes={telas}
            escolhido={escolhido}
            onEscolher={setEscolhido}
          />
          <Grupo data-gc="voz.seletor-de-tela.grupo.set-escolhido--2"
            titulo={t("chamada.tela.janelas")}
            icone={<AppWindow data-gc="voz.seletor-de-tela.app-window" size={13} />}
            fontes={janelas}
            escolhido={escolhido}
            onEscolher={setEscolhido}
          />
        </div>

        <DialogFooter data-gc="voz.seletor-de-tela.dialog-footer" className="items-center justify-between border-t border-line pt-4">
          <label data-gc="voz.seletor-de-tela.label" className="flex items-center gap-2.5 text-sm text-ink-muted">
            <Switch data-gc="voz.seletor-de-tela.switch.set-com-audio" checked={comAudio} onCheckedChange={setComAudio} />
            <span data-gc="voz.seletor-de-tela.span" className="flex items-center gap-1.5">
              <Volume2 data-gc="voz.seletor-de-tela.volume2" size={14} /> {t("chamada.tela.somDoSistema")}
            </span>
          </label>

          <div data-gc="voz.seletor-de-tela.div--3" className="flex gap-2">
            <Button data-gc="voz.seletor-de-tela.button--2" variant="ghost" onClick={() => responder(null, fontes)}>
              {t("chamada.tela.cancelar")}
            </Button>
            <Button data-gc="voz.seletor-de-tela.button--3"
              disabled={!escolhido}
              onClick={() => escolhido && responder({ id: escolhido, comAudio }, fontes)}
            >
              {t("chamada.tela.compartilharAcao")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Grupo: React.FC<{
  titulo: string;
  icone: React.ReactNode;
  fontes: FonteDeTela[];
  escolhido: string | null;
  onEscolher: (id: string) => void;
}> = ({ titulo, icone, fontes, escolhido, onEscolher }) => {
  if (fontes.length === 0) return null;

  return (
    <section data-gc="voz.seletor-de-tela.section" className="mb-5 last:mb-0">
      <h3 data-gc="voz.seletor-de-tela.h3" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {icone} {titulo}
      </h3>

      <div data-gc="voz.seletor-de-tela.div--4" className="grid grid-cols-3 gap-3">
        {fontes.map((fonte) => (
          <button data-gc="voz.seletor-de-tela.button--4"
            key={fonte.id}
            onClick={() => onEscolher(fonte.id)}
            className={cn(
              "overflow-hidden rounded border-2 bg-surface-0 text-left transition",
              escolhido === fonte.id
                ? "border-brand"
                : "border-transparent hover:border-surface-4",
            )}
          >
            <div data-gc="voz.seletor-de-tela.div--5" className="grid aspect-video place-items-center bg-black/40">
              {fonte.miniatura ? (
                <img data-gc="voz.seletor-de-tela.img" src={fonte.miniatura} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <Monitor data-gc="voz.seletor-de-tela.monitor--2" size={28} className="text-ink-faint" />
              )}
            </div>

            <p data-gc="voz.seletor-de-tela.p--5" className="flex items-center gap-1.5 truncate px-2 py-1.5 text-xs text-ink-muted">
              {fonte.icone && <img data-gc="voz.seletor-de-tela.img--2" src={fonte.icone} alt="" className="size-4 shrink-0" />}
              <span data-gc="voz.seletor-de-tela.span--2" className="truncate">{fonte.nome}</span>
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
