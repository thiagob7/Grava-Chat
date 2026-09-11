import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
import { useCreateChannel } from "~/@core/application/queries/guild/use-create-channel";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { inviteCode, MOLDS, type ServerMold } from "~/features/servidor/lib/moldes-de-servidor";

export const FirstServer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const createServer = useCreateGuild();
  const createChannel = useCreateChannel();

  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [mold, setMold] = useState<ServerMold | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async (withMold: ServerMold | null, namePicked: string) => {
    const clean = namePicked.trim();
    if (!clean || creating) return;

    setCreating(true);

    try {
      const guild = await createServer.mutateAsync({ name: clean });

      for (const channel of withMold?.channels ?? []) {
        await createChannel
          .mutateAsync({ guildId: guild.id, name: channel.name, type: channel.kind })
          .catch(() => undefined);
      }

      navigate(`/channels/${guild.id}`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não consegui criar o servidor."));
      setCreating(false);
    }
  };

  const join = () => {
    const code = inviteCode(invite);
    if (!code) return;

    navigate(`/invite/${code}`);
  };

  return (
    <Dialog data-gc="servidor.primeiro-servidor.dialog" open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-gc="servidor.primeiro-servidor.dialog-content" className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader data-gc="servidor.primeiro-servidor.dialog-header">
          <DialogTitle data-gc="servidor.primeiro-servidor.dialog-title">Crie seu primeiro servidor</DialogTitle>
          <DialogDescription data-gc="servidor.primeiro-servidor.dialog-description">
            Um servidor é onde você e seus amigos se encontram. Crie o seu e
            chame a galera.
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="servidor.primeiro-servidor.dialog-body">

        <div data-gc="servidor.primeiro-servidor.div" className="space-y-2">
          <label data-gc="servidor.primeiro-servidor.label" className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Criar o meu
          </label>

          <div data-gc="servidor.primeiro-servidor.div--2" className="flex gap-2">
            <Input data-gc="servidor.primeiro-servidor.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void create(mold, name)}
              placeholder={mold ? mold.nameSuggestion : "Nome do servidor"}
              maxLength={64}
            />
            <Button data-gc="servidor.primeiro-servidor.button" onClick={() => void create(mold, name)} disabled={!name.trim() || creating}>
              {creating ? <Loader2 data-gc="servidor.primeiro-servidor.loader2" size={16} className="animate-spin" /> : "Criar"}
            </Button>
          </div>
        </div>

        <div data-gc="servidor.primeiro-servidor.div--3" className="mt-6">
          <p data-gc="servidor.primeiro-servidor.p" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Começar de um molde
          </p>

          <div data-gc="servidor.primeiro-servidor.div--4" className="space-y-2">
            {MOLDS.map((m) => (
              <button data-gc="servidor.primeiro-servidor.button--2"
                key={m.id}
                disabled={creating}
                onClick={() => {
                  setMold(m);
                  setName((current) => current || m.nameSuggestion);
                }}
                className={cnMold(mold?.id === m.id)}
              >
                <span data-gc="servidor.primeiro-servidor.span" className="text-xl">{m.emoji}</span>

                <span data-gc="servidor.primeiro-servidor.span--2" className="min-w-0 flex-1 text-left">
                  <span data-gc="servidor.primeiro-servidor.span--3" className="block truncate font-medium">{m.name}</span>
                  <span data-gc="servidor.primeiro-servidor.span--4" className="block truncate text-xs text-ink-faint">
                    {m.channels.map((c) => c.name).join(" · ")}
                  </span>
                </span>

                <ChevronRight data-gc="servidor.primeiro-servidor.chevron-right" size={16} className="shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        </div>

        <div data-gc="servidor.primeiro-servidor.div--5" className="mt-8 border-t border-divisor pt-6">
          <p data-gc="servidor.primeiro-servidor.p--2" className="mb-2 text-sm font-medium">Já tem um convite?</p>

          <div data-gc="servidor.primeiro-servidor.div--6" className="flex gap-2">
            <Input data-gc="servidor.primeiro-servidor.input--2"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="Cole o link ou o código do convite"
            />
            <Button data-gc="servidor.primeiro-servidor.button.join" variant="surface" onClick={join} disabled={!inviteCode(invite)}>
              Entrar
            </Button>
          </div>
        </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const cnMold = (picked: boolean) =>
  [
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
    picked
      ? "bg-surface-4 ring-1 ring-brand"
      : "bg-surface-1 hover:bg-surface-3 disabled:opacity-60",
  ].join(" ");
