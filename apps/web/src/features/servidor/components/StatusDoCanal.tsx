import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useDefinirStatusDoCanal } from "~/@core/application/queries/guild/use-status-do-canal";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { LottieArt } from "~/components/LottieArt";
import { cn } from "~/lib/utils";

export const StatusDoCanal: React.FC<{
  guildId: string;
  channelId: string;
  nomeDoCanal: string;
  status: string | null | undefined;
  podeEditar: boolean;
  sempreVisivel?: boolean;
  className?: string;
}> = ({ guildId, channelId, nomeDoCanal, status, podeEditar, sempreVisivel, className }) => {
  const [editando, setEditando] = useState(false);

  if (!status && !podeEditar) return null;

  return (
    <>
      <span data-gc="servidor.status-do-canal.span"
        role={podeEditar ? "button" : undefined}
        tabIndex={podeEditar ? 0 : undefined}
        onClick={
          podeEditar
            ? (e) => {
                e.stopPropagation();
                setEditando(true);
              }
            : undefined
        }
        className={cn(
          "mt-px max-w-full items-center gap-1 text-11 leading-[14px]",
          status || sempreVisivel ? "inline-flex" : "hidden",
          status ? "text-ink-muted" : "text-ink-faint",
          podeEditar && "cursor-pointer hover:text-ink-muted",
          className,
        )}
      >
        <span data-gc="servidor.status-do-canal.span--2" className="truncate">{status ?? "Definir um status do canal"}</span>
        {podeEditar && <Pencil data-gc="servidor.status-do-canal.pencil" size={11} className="shrink-0" />}
      </span>

      {editando && (
        <Editor data-gc="servidor.status-do-canal.editor"
          guildId={guildId}
          channelId={channelId}
          nomeDoCanal={nomeDoCanal}
          status={status ?? ""}
          onFechar={() => setEditando(false)}
        />
      )}
    </>
  );
};

const loadBubbles = () =>
  import("~/assets/animations/speech-bubbles.json").then((mod) => mod.default);

const Editor: React.FC<{
  guildId: string;
  channelId: string;
  nomeDoCanal: string;
  status: string;
  onFechar: () => void;
}> = ({ guildId, channelId, nomeDoCanal, status, onFechar }) => {
  const definir = useDefinirStatusDoCanal();
  const [texto, setTexto] = useState(status);

  const salvar = () =>
    definir.mutate(
      { guildId, channelId, status: texto.trim() || null },
      { onSuccess: onFechar },
    );

  return (
    <Dialog data-gc="servidor.status-do-canal.dialog" open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent data-gc="servidor.status-do-canal.dialog-content" className="max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div data-gc="servidor.status-do-canal.div" className="flex justify-center bg-gradient-to-b from-brand/25 to-transparent pb-2 pt-8">
          <LottieArt data-gc="servidor.status-do-canal.lottie-art"
            name="speech-bubbles"
            load={loadBubbles}
            label="Dois balões de fala conversando"
            className="h-24 w-24"
          />
        </div>

        <DialogBody data-gc="servidor.status-do-canal.dialog-body" className="space-y-4 pt-2">
          <div data-gc="servidor.status-do-canal.div--2" className="text-center">
            <DialogTitle data-gc="servidor.status-do-canal.dialog-title" className="text-xl font-bold">
              De que estamos falando?
            </DialogTitle>
            <p data-gc="servidor.status-do-canal.p" className="mt-1 text-sm text-ink-muted">
              Conte para o pessoal o que você anda fazendo no canal de voz.
            </p>
          </div>

          <div data-gc="servidor.status-do-canal.div--3">
            <Label data-gc="servidor.status-do-canal.label" htmlFor="status-do-canal">Status</Label>
            <Input data-gc="servidor.status-do-canal.input"
              id="status-do-canal"
              autoFocus
              value={texto}
              maxLength={LIMITS.statusDoCanal}
              placeholder={`Status para ${nomeDoCanal}`}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && salvar()}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.status-do-canal.dialog-footer">
          {status && (
            <Button data-gc="servidor.status-do-canal.button"
              variant="surface"
              className="mr-auto"
              disabled={definir.isPending}
              onClick={() =>
                definir.mutate({ guildId, channelId, status: null }, { onSuccess: onFechar })
              }
            >
              Limpar
            </Button>
          )}

          <Button data-gc="servidor.status-do-canal.button.on-fechar" variant="surface" onClick={onFechar}>
            Cancelar
          </Button>

          <Button data-gc="servidor.status-do-canal.button.salvar" disabled={definir.isPending} onClick={salvar}>
            Definir status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
