import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { openDm } from "~/@core/application/requests/friend/open-dm";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Avatar } from "~/components/Avatar";
import { useAparencia } from "~/stores/aparencia";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CampoComAcao, Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface InviteModalProps {
  open: boolean;
  guildId: string | undefined;
  guildName?: string;
  onClose: () => void;
}

type Envio = "enviando" | "enviado" | "erro";

const MASCARA = "••••••••••••••••••••••••••";

export const InviteModal: React.FC<InviteModalProps> = ({ open, guildId, guildName, onClose }) => {
  const createInvite = useCreateInvite();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revelado, setRevelado] = useState(false);
  const prefs = useAparencia();

  /// O link é o que dá acesso ao servidor. Numa live, ele vale um convite
  /// aberto para qualquer um que leia a tela.
  const escondido = !revelado && prefs.modoStreamer && prefs.streamerEscondeConvites;
  const [busca, setBusca] = useState("");
  const [envios, setEnvios] = useState<Record<string, Envio>>({});

  const { data: amizades, isLoading } = useFindFriends(open);

  const { mutateAsync } = createInvite;

  useEffect(() => {
    if (!open || !guildId) return;

    setLink(null);
    setCopied(false);
    setBusca("");
    setEnvios({});

    void mutateAsync({ guildId })
      .then((invite) => setLink(`${window.location.origin}/invite/${invite.code}`))
      .catch(() => undefined);
  }, [open, guildId, mutateAsync]);

  const amigos = useMemo(() => {
    const aceitos = (amizades ?? []).filter((a) => a.status === "ACCEPTED");
    const termo = busca.trim().toLowerCase();
    if (!termo) return aceitos;

    return aceitos.filter(
      (a) =>
        a.user.displayName.toLowerCase().includes(termo) ||
        a.user.username.toLowerCase().includes(termo),
    );
  }, [amizades, busca]);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const convidar = async (userId: string) => {
    if (!link) return;

    setEnvios((atual) => ({ ...atual, [userId]: "enviando" }));

    try {
      const canal = await openDm(userId);
      await sendMessage({ channelId: canal.id, content: link, nonce: crypto.randomUUID() });

      setEnvios((atual) => ({ ...atual, [userId]: "enviado" }));
    } catch {
      setEnvios((atual) => ({ ...atual, [userId]: "erro" }));
      toast.error("Não deu pra mandar o convite. Tente de novo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar amigos {guildName ? `para ${guildName}` : ""}</DialogTitle>
          <DialogDescription>
            Quem você escolher recebe o link numa conversa privada.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar amigos"
              className="pl-9"
            />
          </div>

          <div className="h-64 space-y-0.5 overflow-y-auto pr-1">
            {isLoading && <Vazio>Carregando…</Vazio>}

            {!isLoading && !amigos.length && (
              <Vazio>
                {busca.trim()
                  ? "Nenhum amigo com esse nome."
                  : "Você ainda não tem amigos adicionados. Use o link ali embaixo."}
              </Vazio>
            )}

            {amigos.map(({ user }) => {
              const estado = envios[user.id];

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-2.5 rounded px-2 py-1.5 transition hover:bg-surface-3"
                >
                  <Avatar id={user.id} name={user.displayName} url={user.avatarUrl} size={32} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.displayName}</p>
                    <p className="truncate text-xs text-ink-faint">{user.username}</p>
                  </div>

                  <Button
                    size="sm"
                    variant={estado === "enviado" ? "ghost" : "surface"}
                    disabled={!link || estado === "enviando" || estado === "enviado"}
                    onClick={() => void convidar(user.id)}
                    className={cn(estado === "enviado" && "text-online")}
                  >
                    {estado === "enviado" ? (
                      <>
                        <Check size={14} /> Enviado
                      </>
                    ) : estado === "enviando" ? (
                      "Enviando…"
                    ) : estado === "erro" ? (
                      "Tentar de novo"
                    ) : (
                      "Convidar"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-divisor pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Ou mande o link
            </p>
            <CampoComAcao
              readOnly
              value={link ? (escondido ? MASCARA : link) : "Gerando…"}
              onFocus={() => setRevelado(true)}
              title={escondido ? "Escondido pelo modo streamer — clique para ver" : undefined}
              acao={
                <Button size="sm" onClick={() => void copy()} disabled={!link}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              }
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const Vazio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-2 py-8 text-center text-sm text-ink-muted">{children}</p>
);
