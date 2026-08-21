import React, { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, AppWindow, Volume2 } from "lucide-react";
import type { FonteDeTela } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { desktop } from "~/lib/desktop";
import { cn } from "~/lib/utils";

/**
 * O seletor de tela do aplicativo de desktop.
 *
 * No navegador, quem desenha essa tela é o Chrome e o áudio do sistema não vem
 * junto — de lá só sai o som da *aba*. Aqui o `getDisplayMedia` passa pelo
 * processo principal, que devolve as telas e janelas de verdade; este
 * componente escolhe, e a captura sai com o som do sistema se a pessoa quiser.
 *
 * Fica montado o tempo todo (fora das rotas, como o `VoiceAudioSink`), porque o
 * pedido pode chegar de qualquer lugar do app.
 */
export const SeletorDeTela: React.FC = () => {
  const [fontes, setFontes] = useState<FonteDeTela[] | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [comAudio, setComAudio] = useState(true);
  const [semPermissao, setSemPermissao] = useState(false);

  /**
   * O `getDisplayMedia` do outro lado fica pendurado até alguém responder. Este
   * ref garante UMA resposta por pedido: fechar no Esc, no X, no clique fora e
   * no botão Cancelar são quatro caminhos para o mesmo lugar.
   */
  const respondido = useRef(true);

  const responder = useCallback((escolha: { id: string; comAudio: boolean } | null) => {
    if (respondido.current) return;
    respondido.current = true;
    desktop()?.tela.responder(escolha);
    setFontes(null);
    setEscolhido(null);
  }, []);

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
    <Dialog open onOpenChange={(aberto) => !aberto && responder(null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compartilhar tela</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {semPermissao && (
            <div className="mb-4 rounded bg-idle/10 px-3 py-2 text-xs text-idle">
              <p>
                O macOS ainda não liberou a gravação de tela. Sem isso o compartilhamento sai
                preto.
              </p>
              <Button
                className="mt-2"
                variant="surface"
                size="sm"
                onClick={() => desktop()?.midia.abrirAjustes("screen")}
              >
                Abrir os ajustes
              </Button>
              <p className="mt-2 text-ink-faint">
                Marque o <b>{desktop()?.nomeNoSistema}</b> em Gravação de Tela e reabra o
                aplicativo.
              </p>
            </div>
          )}

          {fontes.length === 0 && !semPermissao && (
            <p className="py-8 text-center text-sm text-ink-muted">
              O sistema não devolveu nenhuma tela ou janela para compartilhar.
            </p>
          )}

          <Grupo
            titulo="Telas"
            icone={<Monitor size={13} />}
            fontes={telas}
            escolhido={escolhido}
            onEscolher={setEscolhido}
          />
          <Grupo
            titulo="Janelas"
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
              <Volume2 size={14} /> Levar o som do sistema junto
            </span>
          </label>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => responder(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!escolhido}
              onClick={() => escolhido && responder({ id: escolhido, comAudio })}
            >
              Compartilhar
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
