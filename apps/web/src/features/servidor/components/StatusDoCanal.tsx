import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { LIMITS } from "@gravae/shared";

import { useSetChannelStatus } from "~/@core/application/queries/guild/use-status-do-canal";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { LottieArt } from "~/components/LottieArt";
import { cn } from "~/lib/utils";

export const ChannelStatus: React.FC<{
  guildId: string;
  channelId: string;
  channelName: string;
  status: string | null | undefined;
  canEdit: boolean;
  visibleAlways?: boolean;
  className?: string;
}> = ({ guildId, channelId, channelName, status, canEdit, visibleAlways, className }) => {
  const [editing, setEditing] = useState(false);

  if (!status && !canEdit) return null;

  return (
    <>
      <span data-gc="servidor.status-do-canal.span"
        role={canEdit ? "button" : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onClick={
          canEdit
            ? (e) => {
                e.stopPropagation();
                setEditing(true);
              }
            : undefined
        }
        className={cn(
          "mt-px max-w-full items-center gap-1 text-11 leading-[14px]",
          status || visibleAlways ? "inline-flex" : "hidden",
          status ? "text-ink-muted" : "text-ink-faint",
          canEdit && "cursor-pointer hover:text-ink-muted",
          className,
        )}
      >
        <span data-gc="servidor.status-do-canal.span--2" className="truncate">{status ?? "Definir um status do canal"}</span>
        {canEdit && <Pencil data-gc="servidor.status-do-canal.pencil" size={11} className="shrink-0" />}
      </span>

      {editing && (
        <Editor data-gc="servidor.status-do-canal.editor"
          guildId={guildId}
          channelId={channelId}
          channelName={channelName}
          status={status ?? ""}
          onClose={() => setEditing(false)}
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
  channelName: string;
  status: string;
  onClose: () => void;
}> = ({ guildId, channelId, channelName, status, onClose }) => {
  const set = useSetChannelStatus();
  const [text, setText] = useState(status);

  const save = () =>
    set.mutate(
      { guildId, channelId, status: text.trim() || null },
      { onSuccess: onClose },
    );

  return (
    <Dialog data-gc="servidor.status-do-canal.dialog" open onOpenChange={(isOpen) => !isOpen && onClose()}>
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
              value={text}
              maxLength={LIMITS.channelStatus}
              placeholder={`Status para ${channelName}`}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.status-do-canal.dialog-footer">
          {status && (
            <Button data-gc="servidor.status-do-canal.button"
              variant="surface"
              className="mr-auto"
              disabled={set.isPending}
              onClick={() =>
                set.mutate({ guildId, channelId, status: null }, { onSuccess: onClose })
              }
            >
              Limpar
            </Button>
          )}

          <Button data-gc="servidor.status-do-canal.button.on-close" variant="surface" onClick={onClose}>
            Cancelar
          </Button>

          <Button data-gc="servidor.status-do-canal.button.save" disabled={set.isPending} onClick={save}>
            Definir status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
