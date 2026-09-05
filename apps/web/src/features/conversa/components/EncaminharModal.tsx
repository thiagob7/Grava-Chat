import React, { useMemo, useState } from "react";
import { Hash, Search, Send } from "lucide-react";
import type { Message } from "@gravae/shared";

import { useSendMessage } from "~/@core/application/queries/message/use-send-message";
import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface Destino {
  id: string;
  nome: string;
  avatar?: { id: string; url: string | null };
}

interface EncaminharModalProps {
  aberto: boolean;
  onFechar: () => void;
  mensagem: Message;
  guildId?: string;
}

export const EncaminharModal: React.FC<EncaminharModalProps> = ({
  aberto,
  onFechar,
  mensagem,
  guildId,
}) => {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const [enviandoPara, setEnviandoPara] = useState<string | null>(null);

  const guild = useFindGuild(guildId);
  const dms = useFindDms(aberto);
  const sendMessage = useSendMessage();

  const destinos = useMemo<{ canais: Destino[]; conversas: Destino[] }>(() => {
    const termo = busca.toLowerCase().trim();
    const cabe = (nome: string) => !termo || nome.toLowerCase().includes(termo);

    return {
      canais: (guild.data?.channels ?? [])
        .filter((c) => c.type === "TEXT" && c.id !== mensagem.channelId && cabe(c.name))
        .map((c) => ({ id: c.id, nome: c.name })),

      conversas: (dms.data ?? [])
        .filter((d) => d.id !== mensagem.channelId && cabe(d.user.displayName))
        .map((d) => ({
          id: d.id,
          nome: d.user.displayName,
          avatar: { id: d.user.id, url: d.user.avatarUrl },
        })),
    };
  }, [guild.data, dms.data, busca, mensagem.channelId]);

  const encaminhar = (destino: Destino) => {
    setEnviandoPara(destino.id);

    sendMessage.mutate(
      {
        channelId: destino.id,
        content: mensagem.content || t("conversa.encaminhar.semTexto"),
        nonce: crypto.randomUUID(),
      },
      { onSettled: () => (setEnviandoPara(null), onFechar()) },
    );
  };

  const vazio = !destinos.canais.length && !destinos.conversas.length;

  return (
    <Dialog data-gc="conversa.encaminhar-modal.dialog" open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent data-gc="conversa.encaminhar-modal.dialog-content" className="max-w-md">
        <DialogTitle data-gc="conversa.encaminhar-modal.dialog-title">{t("conversa.encaminhar.titulo")}</DialogTitle>

        <DialogBody data-gc="conversa.encaminhar-modal.dialog-body">
          <div data-gc="conversa.encaminhar-modal.div" className={grupoDeCampo}>
            <Search data-gc="conversa.encaminhar-modal.search" size={14} className="shrink-0 text-ink-faint" />
            <input data-gc="conversa.encaminhar-modal.input"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t("conversa.encaminhar.paraOnde")}
              className={campoNu}
            />
          </div>

          <p data-gc="conversa.encaminhar-modal.p" className="mt-3 line-clamp-2 rounded bg-surface-0 px-3 py-2 text-xs text-ink-faint">
            {mensagem.content || t("conversa.encaminhar.semTexto")}
          </p>

          <div data-gc="conversa.encaminhar-modal.div--2" className="mt-3 max-h-64 space-y-3 overflow-y-auto">
            {vazio && (
              <p data-gc="conversa.encaminhar-modal.p--2" className="py-8 text-center text-sm text-ink-faint">
                {t("conversa.encaminhar.nenhumLugar")}
              </p>
            )}

            <Grupo data-gc="conversa.encaminhar-modal.grupo.encaminhar"
              titulo={t("conversa.encaminhar.canais")}
              itens={destinos.canais}
              enviandoPara={enviandoPara}
              onEscolher={encaminhar}
            />
            <Grupo data-gc="conversa.encaminhar-modal.grupo.encaminhar--2"
              titulo={t("conversa.encaminhar.conversas")}
              itens={destinos.conversas}
              enviandoPara={enviandoPara}
              onEscolher={encaminhar}
            />
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const Grupo: React.FC<{
  titulo: string;
  itens: Destino[];
  enviandoPara: string | null;
  onEscolher: (d: Destino) => void;
}> = ({ titulo, itens, enviandoPara, onEscolher }) => {
  if (!itens.length) return null;

  return (
    <section data-gc="conversa.encaminhar-modal.section">
      <h4 data-gc="conversa.encaminhar-modal.h4" className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {titulo}
      </h4>

      {itens.map((destino) => (
        <button data-gc="conversa.encaminhar-modal.button"
          key={destino.id}
          disabled={enviandoPara !== null}
          onClick={() => onEscolher(destino)}
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
            "hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {destino.avatar ? (
            <Avatar data-gc="conversa.encaminhar-modal.avatar"
              id={destino.avatar.id}
              name={destino.nome}
              url={destino.avatar.url}
              size={20}
            />
          ) : (
            <Hash data-gc="conversa.encaminhar-modal.hash" size={16} className="shrink-0 text-ink-faint" />
          )}

          <span data-gc="conversa.encaminhar-modal.span" className="min-w-0 flex-1 truncate">{destino.nome}</span>

          {enviandoPara === destino.id && <Send data-gc="conversa.encaminhar-modal.send" size={14} className="shrink-0 text-brand" />}
        </button>
      ))}
    </section>
  );
};
