import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { openDm } from "~/@core/application/requests/friend/open-dm";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Avatar } from "~/features/perfil/components/Avatar";
import { StepCarousel } from "~/components/ui/step-carousel";
import {
  InviteSettings,
  type InviteOptions,
} from "~/features/servidor/components/ConfiguracoesDoConvite";
import { copyText } from "~/lib/copiar";
import { formatTimestamp } from "~/lib/format";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FieldWithAction, Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface InviteModalProps {
  open: boolean;
  guildId: string | undefined;
  guildName?: string;
  onClose: () => void;
}

type Sending = "enviando" | "enviado" | "erro";

type Step = "convidar" | "opcoes";
const STEPS: readonly Step[] = ["convidar", "opcoes"];

const MASK = "••••••••••••••••••••••••••";

export const InviteModal: React.FC<InviteModalProps> = ({ open, guildId, guildName, onClose }) => {
  const createInvite = useCreateInvite();
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<Step>("convidar");
  const [options, setOptions] = useState<InviteOptions>({
    expiresInHours: null,
    maxUses: null,
  });
  const [revealed, setRevealed] = useState(false);
  const prefs = useAppearance();

  const hidden = !revealed && prefs.modeStreamer && prefs.streamerHidesInvites;
  const [search, setSearch] = useState("");
  const [sendings, setSendings] = useState<Record<string, Sending>>({});

  const { data: friendships, isLoading } = useFindFriends(open);

  const { mutateAsync } = createInvite;

  const generate = useCallback(
    (picked: InviteOptions) => {
      if (!guildId) return;

      setLink(null);
      setExpiresAt(null);
      setCopied(false);

      void mutateAsync({ guildId, ...picked })
        .then((invite) => {
          setLink(`${window.location.origin}/invite/${invite.code}`);
          setExpiresAt(invite.expiresAt);
          setOptions(picked);
          setView("convidar");
        })
        .catch(() => undefined);
    },
    [guildId, mutateAsync],
  );

  useEffect(() => {
    if (!open || !guildId) return;

    setSearch("");
    setSendings({});
    setView("convidar");
    generate({ expiresInHours: null, maxUses: null });
  }, [open, guildId, generate]);

  const friends = useMemo(() => {
    const accepted = (friendships ?? []).filter((a) => a.status === "ACCEPTED");
    const term = search.trim().toLowerCase();
    if (!term) return accepted;

    return accepted.filter(
      (a) =>
        a.user.displayName.toLowerCase().includes(term) ||
        a.user.username.toLowerCase().includes(term),
    );
  }, [friendships, search]);

  const copy = async () => {
    if (!link) return;

    if (!(await copyText(link))) {
      toast.error("Não deu pra copiar. Selecione o link e copie na mão.");
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const invite = async (userId: string) => {
    if (!link) return;

    setSendings((current) => ({ ...current, [userId]: "enviando" }));

    try {
      const channel = await openDm(userId);
      await sendMessage({ channelId: channel.id, content: link, nonce: crypto.randomUUID() });

      setSendings((current) => ({ ...current, [userId]: "enviado" }));
    } catch {
      setSendings((current) => ({ ...current, [userId]: "erro" }));
      toast.error("Não deu pra mandar o convite. Tente de novo.");
    }
  };

  return (
    <>
      <Dialog data-gc="servidor.invite-modal.dialog" open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent data-gc="servidor.invite-modal.dialog-content" className="overflow-hidden">
          <StepCarousel data-gc="servidor.invite-modal.step-carousel"
            step={view}
            steps={STEPS}
            panels={{
              options: (
                <InviteSettings data-gc="servidor.invite-modal.invite-settings.generate"
                  current={options}
                  generating={createInvite.isPending}
                  onBack={() => setView("convidar")}
                  onCreate={generate}
                />
              ),
              invite: (
                <>
              <DialogHeader data-gc="servidor.invite-modal.dialog-header">
              <DialogTitle data-gc="servidor.invite-modal.dialog-title">Convidar amigos {guildName ? `para ${guildName}` : ""}</DialogTitle>
              <DialogDescription data-gc="servidor.invite-modal.dialog-description">
                Quem você escolher recebe o link numa conversa privada.
              </DialogDescription>
            </DialogHeader>

            <DialogBody data-gc="servidor.invite-modal.dialog-body" className="space-y-3">
              <div data-gc="servidor.invite-modal.div" className="relative">
                <Search data-gc="servidor.invite-modal.search"
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <Input data-gc="servidor.invite-modal.input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar amigos"
                  className="pl-9"
                />
              </div>

              <div data-gc="servidor.invite-modal.div--2" className="cascata h-[25rem] space-y-0.5 overflow-y-auto pr-1">
                {isLoading && <Empty data-gc="servidor.invite-modal.empty">Carregando…</Empty>}

                {!isLoading && !friends.length && (
                  <Empty data-gc="servidor.invite-modal.empty--2">
                    {search.trim()
                      ? "Nenhum amigo com esse nome."
                      : "Você ainda não tem amigos adicionados. Use o link ali embaixo."}
                  </Empty>
                )}

                {friends.map(({ user }) => {
                  const state = sendings[user.id];

                  return (
                    <div data-gc="servidor.invite-modal.div--3"
                      key={user.id}
                      className="flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-hover"
                    >
                  <Avatar data-gc="servidor.invite-modal.avatar"
                    id={user.id}
                    name={user.displayName}
                    url={user.avatarUrl}
                    size={32}
                    status={user.status}
                  />

                      <div data-gc="servidor.invite-modal.div--4" className="min-w-0 flex-1">
                        <p data-gc="servidor.invite-modal.p" className="truncate text-sm font-medium">{user.displayName}</p>
                        <p data-gc="servidor.invite-modal.p--2" className="truncate text-xs text-ink-faint">{user.username}</p>
                      </div>

                      <Button data-gc="servidor.invite-modal.button"
                        size="sm"
                        variant={state === "enviado" ? "ghost" : "outline"}
                        disabled={!link || state === "enviando" || state === "enviado"}
                        onClick={() => void invite(user.id)}
                        className={cn(state === "enviado" && "text-online")}
                      >
                        {state === "enviado" ? (
                          <>
                            <Check data-gc="servidor.invite-modal.check" size={14} /> Enviado
                          </>
                        ) : state === "enviando" ? (
                          "Enviando…"
                        ) : state === "erro" ? (
                          "Tentar de novo"
                        ) : (
                          "Convidar"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div data-gc="servidor.invite-modal.div--5" className="border-t border-divisor pt-3">
                <p data-gc="servidor.invite-modal.p--3" className="mb-2 text-sm font-medium text-ink">
                  Ou envie um link de convite para um amigo:
                </p>
                <FieldWithAction data-gc="servidor.invite-modal.field-with-action"
                  readOnly
                  value={link ? (hidden ? MASK : link) : "Gerando…"}
                  onFocus={() => setRevealed(true)}
                  title={hidden ? "Escondido pelo modo streamer — clique para ver" : undefined}
                  action={
                    <Button data-gc="servidor.invite-modal.button--2" size="sm" onClick={() => void copy()} disabled={!link}>
                      {copied ? <Check data-gc="servidor.invite-modal.check--2" size={14} /> : <Copy data-gc="servidor.invite-modal.copy" size={14} />}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  }
                />

                <p data-gc="servidor.invite-modal.p--4" className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-faint">
                  <span data-gc="servidor.invite-modal.span">
                    {expiresAt
                      ? `Seu link de convite expira em ${formatTimestamp(expiresAt)}.`
                      : "Seu link de convite não expira."}
                    {options.maxUses ? ` Vale ${options.maxUses} uso(s).` : ""}
                  </span>

                  <button data-gc="servidor.invite-modal.button--3"
                    type="button"
                    onClick={() => setView("opcoes")}
                    className="text-brand transition hover:underline"
                  >
                    Editar link de convite
                  </button>
                </p>
              </div>
                </DialogBody>
                </>
              ),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p data-gc="servidor.invite-modal.p--5" className="px-2 py-8 text-center text-sm text-ink-muted">{children}</p>
);
