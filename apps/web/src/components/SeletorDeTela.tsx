import React, { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, AppWindow, Volume2 } from "lucide-react";
import type { FonteDeTela } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { desktop } from "~/lib/desktop";
import { useVoiceStore } from "~/stores/voice-store";
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

      /*
        Guardar o que foi escolhido é o que permite o painel dizer "Tela 1" ou
        "Visual Studio Code" em vez de um genérico. É aqui e em nenhum outro
        lugar: depois que o Electron devolve a faixa, este nome já se perdeu —
        o rótulo que chega na `MediaStreamTrack` é um identificador cru.
      */
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
    <Dialog open onOpenChange={(aberto) => !aberto && responder(null, fontes)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("chamada.tela.compartilhar")}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {semPermissao && (
            <div className="mb-4 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
              <p>
                {t("chamada.gravacaoDeTela.bloqueada")}
              </p>
              <Button
                className="mt-2"
                variant="surface"
                size="sm"
                onClick={() => desktop()?.midia.abrirAjustes("screen")}
              >
                {t("chamada.microfone.abrirAjustes")}
              </Button>
              <p className="mt-2 text-ink-faint">
                {t("chamada.gravacaoDeTela.marque")} <b>{desktop()?.nomeNoSistema}</b>{" "}
                {t("chamada.gravacaoDeTela.reabra")}
              </p>

              <p className="mt-1.5 text-ink-faint">
                {t("chamada.gravacaoDeTela.jaMarcado")}
              </p>
            </div>
          )}

          {fontes.length === 0 && !semPermissao && (
            <p className="py-8 text-center text-sm text-ink-muted">
              {t("chamada.tela.semFontes")}
            </p>
          )}

          <Grupo
            titulo={t("chamada.tela.telas")}
            icone={<Monitor size={13} />}
            fontes={telas}
            escolhido={escolhido}
            onEscolher={setEscolhido}
          />
          <Grupo
            titulo={t("chamada.tela.janelas")}
            icone={<AppWindow size={13} />}
            fontes={janelas}
            escolhido={escolhido}
            onEscolher={setEscolhido}
          />
        </div>

        <DialogFooter className="items-center justify-between border-t border-line pt-4">
          <label className="flex items-center gap-2.5 text-sm text-ink-muted">
            <Switch checked={comAudio} onCheckedChange={setComAudio} />
            <span className="flex items-center gap-1.5">
              <Volume2 size={14} /> {t("chamada.tela.somDoSistema")}
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => responder(null, fontes)}>
              {t("chamada.tela.cancelar")}
            </Button>
            <Button
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
    <section className="mb-5 last:mb-0">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {icone} {titulo}
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {fontes.map((fonte) => (
          <button
            key={fonte.id}
            onClick={() => onEscolher(fonte.id)}
            className={cn(
              "overflow-hidden rounded border-2 bg-surface-0 text-left transition",
              escolhido === fonte.id
                ? "border-brand"
                : "border-transparent hover:border-surface-4",
            )}
          >
            <div className="grid aspect-video place-items-center bg-black/40">
              {fonte.miniatura ? (
                <img src={fonte.miniatura} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <Monitor size={28} className="text-ink-faint" />
              )}
            </div>

            <p className="flex items-center gap-1.5 truncate px-2 py-1.5 text-xs text-ink-muted">
              {fonte.icone && <img src={fonte.icone} alt="" className="size-4 shrink-0" />}
              <span className="truncate">{fonte.nome}</span>
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
