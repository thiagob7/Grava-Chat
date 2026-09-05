import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { toast } from "react-toastify";

import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { openDm } from "~/@core/application/requests/friend/open-dm";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Avatar } from "~/features/perfil/components/Avatar";
import { CarrosselDeEtapas } from "~/components/ui/carrossel-de-etapas";
import {
  ConfiguracoesDoConvite,
  type OpcoesDoConvite,
} from "~/features/servidor/components/ConfiguracoesDoConvite";
import { copiarTexto } from "~/lib/copiar";
import { formatTimestamp } from "~/lib/format";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
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

type Etapa = "convidar" | "opcoes";
const ETAPAS: readonly Etapa[] = ["convidar", "opcoes"];

const MASCARA = "••••••••••••••••••••••••••";

export const InviteModal: React.FC<InviteModalProps> = ({ open, guildId, guildName, onClose }) => {
  const createInvite = useCreateInvite();
  const [link, setLink] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [vista, setVista] = useState<Etapa>("convidar");
  const [opcoes, setOpcoes] = useState<OpcoesDoConvite>({
    expiresInHours: null,
    maxUses: null,
  });
  const [revelado, setRevelado] = useState(false);
  const prefs = useAparencia();

  const escondido = !revelado && prefs.modoStreamer && prefs.streamerEscondeConvites;
  const [busca, setBusca] = useState("");
  const [envios, setEnvios] = useState<Record<string, Envio>>({});

  const { data: amizades, isLoading } = useFindFriends(open);

  const { mutateAsync } = createInvite;

  const gerar = useCallback(
    (escolhidas: OpcoesDoConvite) => {
      if (!guildId) return;

      setLink(null);
      setExpiraEm(null);
      setCopied(false);

      void mutateAsync({ guildId, ...escolhidas })
        .then((invite) => {
          setLink(`${window.location.origin}/invite/${invite.code}`);
          setExpiraEm(invite.expiresAt);
          setOpcoes(escolhidas);
          setVista("convidar");
        })
        .catch(() => undefined);
    },
    [guildId, mutateAsync],
  );

  useEffect(() => {
    if (!open || !guildId) return;

    setBusca("");
    setEnvios({});
    setVista("convidar");
    gerar({ expiresInHours: null, maxUses: null });
  }, [open, guildId, gerar]);

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

    if (!(await copiarTexto(link))) {
      toast.error("Não deu pra copiar. Selecione o link e copie na mão.");
      return;
    }

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
    <>
      <Dialog data-gc="servidor.invite-modal.dialog" open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent data-gc="servidor.invite-modal.dialog-content" className="overflow-hidden">
          <CarrosselDeEtapas data-gc="servidor.invite-modal.carrossel-de-etapas"
            etapa={vista}
            etapas={ETAPAS}
            paineis={{
              opcoes: (
                <ConfiguracoesDoConvite data-gc="servidor.invite-modal.configuracoes-do-convite.gerar"
                  atuais={opcoes}
                  gerando={createInvite.isPending}
                  onVoltar={() => setVista("convidar")}
                  onCriar={gerar}
                />
              ),
              convidar: (
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
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar amigos"
                  className="pl-9"
                />
              </div>

              <div data-gc="servidor.invite-modal.div--2" className="cascata h-[25rem] space-y-0.5 overflow-y-auto pr-1">
                {isLoading && <Vazio data-gc="servidor.invite-modal.vazio">Carregando…</Vazio>}

                {!isLoading && !amigos.length && (
                  <Vazio data-gc="servidor.invite-modal.vazio--2">
                    {busca.trim()
                      ? "Nenhum amigo com esse nome."
                      : "Você ainda não tem amigos adicionados. Use o link ali embaixo."}
                  </Vazio>
                )}

                {amigos.map(({ user }) => {
                  const estado = envios[user.id];

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
                        variant={estado === "enviado" ? "ghost" : "outline"}
                        disabled={!link || estado === "enviando" || estado === "enviado"}
                        onClick={() => void convidar(user.id)}
                        className={cn(estado === "enviado" && "text-online")}
                      >
                        {estado === "enviado" ? (
                          <>
                            <Check data-gc="servidor.invite-modal.check" size={14} /> Enviado
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

              <div data-gc="servidor.invite-modal.div--5" className="border-t border-divisor pt-3">
                <p data-gc="servidor.invite-modal.p--3" className="mb-2 text-sm font-medium text-ink">
                  Ou envie um link de convite para um amigo:
                </p>
                <CampoComAcao data-gc="servidor.invite-modal.campo-com-acao"
                  readOnly
                  value={link ? (escondido ? MASCARA : link) : "Gerando…"}
                  onFocus={() => setRevelado(true)}
                  title={escondido ? "Escondido pelo modo streamer — clique para ver" : undefined}
                  acao={
                    <Button data-gc="servidor.invite-modal.button--2" size="sm" onClick={() => void copy()} disabled={!link}>
                      {copied ? <Check data-gc="servidor.invite-modal.check--2" size={14} /> : <Copy data-gc="servidor.invite-modal.copy" size={14} />}
                      {copied ? "Copiado" : "Copiar"}
                    </Button>
                  }
                />

                <p data-gc="servidor.invite-modal.p--4" className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-faint">
                  <span data-gc="servidor.invite-modal.span">
                    {expiraEm
                      ? `Seu link de convite expira em ${formatTimestamp(expiraEm)}.`
                      : "Seu link de convite não expira."}
                    {opcoes.maxUses ? ` Vale ${opcoes.maxUses} uso(s).` : ""}
                  </span>

                  <button data-gc="servidor.invite-modal.button--3"
                    type="button"
                    onClick={() => setVista("opcoes")}
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

const Vazio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p data-gc="servidor.invite-modal.p--5" className="px-2 py-8 text-center text-sm text-ink-muted">{children}</p>
);
