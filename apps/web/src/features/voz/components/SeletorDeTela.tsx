import React, { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, AppWindow, Volume2 } from "lucide-react";
import { Warning } from "@phosphor-icons/react";
import type { ScreenFont } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { desktop } from "~/lib/desktop";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const ScreenPicker: React.FC = () => {
  const { t } = useTranslation();
  const [fonts, setFonts] = useState<ScreenFont[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [withAudio, setWithAudio] = useState(true);
  const [withoutPermission, setWithoutPermission] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const replied = useRef(true);
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const setScreenFont = useVoiceStore((s) => s.setScreenFont);

  const reply = useCallback(
    (selection: { id: string; withAudio: boolean } | null, list: ScreenFont[] | null) => {
      if (replied.current) return;
      replied.current = true;

      const font = selection ? list?.find((f) => f.id === selection.id) : null;
      setScreenFont(font ? { name: font.name, icon: font.icon } : null);

      desktop()?.display.reply(selection);
      setFonts(null);
      setPicked(null);
    },
    [setScreenFont],
  );

  useEffect(() => {
    const bridge = desktop();
    if (!bridge) return;

    return bridge.display.onRequestChoice((list) => {
      replied.current = false;
      setFonts(list);
      setPicked(list[0]?.id ?? null);
      void bridge.display.permission().then((p) => setWithoutPermission(p !== "granted"));
    });
  }, []);

  useEffect(() => {
    const area = scroll.current;
    const inside = content.current;
    if (!area || !inside) return;

    const measure = () => setHasMoreBelow(area.scrollHeight - area.scrollTop - area.clientHeight > 8);

    measure();
    area.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(area);
    observer.observe(inside);

    return () => {
      area.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [fonts, withoutPermission]);

  if (!fonts) return null;

  const screens = fonts.filter((f) => f.isScreen);
  const windows = fonts.filter((f) => !f.isScreen);

  return (
    <Dialog data-gc="voz.seletor-de-tela.dialog" open onOpenChange={(isOpen) => !isOpen && reply(null, fonts)}>
      <DialogContent data-gc="voz.seletor-de-tela.dialog-content" className="max-w-3xl">
        <DialogHeader data-gc="voz.seletor-de-tela.dialog-header">
          <DialogTitle data-gc="voz.seletor-de-tela.dialog-title">{t("chamada.tela.compartilhar")}</DialogTitle>
        </DialogHeader>

        <div data-gc="voz.seletor-de-tela.div" className="relative">
          <div data-gc="voz.seletor-de-tela.div--2" ref={scroll} className="max-h-[55vh] overflow-y-auto px-5 py-4">
            <div data-gc="voz.seletor-de-tela.div--3" ref={content}>
              {withoutPermission && (
                <div data-gc="voz.seletor-de-tela.div--4" className="mb-4 flex gap-3 rounded-md border border-idle/25 border-l-2 border-l-idle bg-idle/10 p-3">
                  <Warning data-gc="voz.seletor-de-tela.warning" size={16} weight="fill" className="mt-0.5 shrink-0 text-idle" />

                  <div data-gc="voz.seletor-de-tela.div--5" className="min-w-0 flex-1">
                    <p data-gc="voz.seletor-de-tela.p" className="text-13 font-semibold leading-5 text-idle">
                      {t("chamada.gravacaoDeTela.bloqueada")}
                    </p>

                    <p data-gc="voz.seletor-de-tela.p--2" className="mt-1.5 text-12 leading-5 text-ink-muted">
                      {t("chamada.gravacaoDeTela.marque")}{" "}
                      <b data-gc="voz.seletor-de-tela.b" className="font-semibold text-ink">{desktop()?.nameSystem}</b>{" "}
                      {t("chamada.gravacaoDeTela.reabra")}
                    </p>

                    <p data-gc="voz.seletor-de-tela.p--3" className="mt-1 text-12 leading-5 text-ink-faint">
                      {t("chamada.gravacaoDeTela.jaMarcado")}
                    </p>

                    <Button data-gc="voz.seletor-de-tela.button"
                      className="mt-3"
                      variant="surface"
                      size="sm"
                      onClick={() => desktop()?.media.openSettings("screen")}
                    >
                      {t("chamada.microfone.abrirAjustes")}
                    </Button>
                  </div>
                </div>
              )}

              {fonts.length === 0 && !withoutPermission && (
                <p data-gc="voz.seletor-de-tela.p--4" className="py-8 text-center text-sm text-ink-muted">
                  {t("chamada.tela.semFontes")}
                </p>
              )}

              <Group data-gc="voz.seletor-de-tela.group.set-picked"
                title={t("chamada.tela.telas")}
                icon={<Monitor data-gc="voz.seletor-de-tela.monitor" size={13} />}
                fonts={screens}
                picked={picked}
                onPick={setPicked}
              />
              <Group data-gc="voz.seletor-de-tela.group.set-picked--2"
                title={t("chamada.tela.janelas")}
                icon={<AppWindow data-gc="voz.seletor-de-tela.app-window" size={13} />}
                fonts={windows}
                picked={picked}
                onPick={setPicked}
              />
            </div>
          </div>

          <div data-gc="voz.seletor-de-tela.div--6"
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-1 via-surface-1/60 to-transparent transition-opacity duration-200",
              hasMoreBelow ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <DialogFooter data-gc="voz.seletor-de-tela.dialog-footer"
          className={cn(
            "items-center justify-between border-t border-line pt-4 transition-shadow",
            hasMoreBelow && "shadow-[0_-0.5rem_1rem_-0.75rem_var(--color-sombra)]",
          )}
        >
          <div data-gc="voz.seletor-de-tela.div--7" className="flex items-center gap-2.5 text-sm text-ink-muted">
            <Switch data-gc="voz.seletor-de-tela.switch.set-with-audio"
              checked={withAudio}
              onCheckedChange={setWithAudio}
              aria-label={t("chamada.tela.somDoSistema")}
            />
            <span data-gc="voz.seletor-de-tela.span" className="flex select-none items-center gap-1.5">
              <Volume2 data-gc="voz.seletor-de-tela.volume2" size={14} /> {t("chamada.tela.somDoSistema")}
            </span>
          </div>

          <div data-gc="voz.seletor-de-tela.div--8" className="flex gap-2">
            <Button data-gc="voz.seletor-de-tela.button--2" variant="ghost" onClick={() => reply(null, fonts)}>
              {t("chamada.tela.cancelar")}
            </Button>
            <Button data-gc="voz.seletor-de-tela.button--3"
              disabled={!picked}
              onClick={() => picked && reply({ id: picked, withAudio }, fonts)}
            >
              {t("chamada.tela.compartilharAcao")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Group: React.FC<{
  title: string;
  icon: React.ReactNode;
  fonts: ScreenFont[];
  picked: string | null;
  onPick: (id: string) => void;
}> = ({ title, icon, fonts, picked, onPick }) => {
  if (fonts.length === 0) return null;

  return (
    <section data-gc="voz.seletor-de-tela.section" className="mb-5 last:mb-0">
      <h3 data-gc="voz.seletor-de-tela.h3" className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {icon} {title}
      </h3>

      <div data-gc="voz.seletor-de-tela.div--9" className="grid grid-cols-3 gap-3">
        {fonts.map((font) => (
          <button data-gc="voz.seletor-de-tela.button--4"
            key={font.id}
            onClick={() => onPick(font.id)}
            className={cn(
              "overflow-hidden rounded border-2 bg-surface-0 text-left transition",
              picked === font.id
                ? "border-brand"
                : "border-transparent hover:border-surface-4",
            )}
          >
            <div data-gc="voz.seletor-de-tela.div--10" className="grid aspect-video place-items-center bg-sobre-midia">
              {font.thumbnail ? (
                <img data-gc="voz.seletor-de-tela.img" src={font.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <Monitor data-gc="voz.seletor-de-tela.monitor--2" size={28} className="text-ink-faint" />
              )}
            </div>

            <p data-gc="voz.seletor-de-tela.p--5" className="flex items-center gap-1.5 truncate px-2 py-1.5 text-xs text-ink-muted">
              {font.icon && <img data-gc="voz.seletor-de-tela.img--2" src={font.icon} alt="" className="size-4 shrink-0" />}
              <span data-gc="voz.seletor-de-tela.span--2" className="truncate">{font.name}</span>
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
