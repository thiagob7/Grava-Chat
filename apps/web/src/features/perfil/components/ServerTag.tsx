import React, { useState } from "react";
import { useNavigate } from "react-router";

import { useGuildPreview } from "~/@core/application/queries/guild/use-guild-preview";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { avatarColor } from "~/lib/format";

interface ServerTagProps {
  etiqueta?: { guildId: string; tag: string; tagIcon: string | null } | null;
  interativo?: boolean;
}

const SELO = "flex shrink-0 items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-10 font-semibold uppercase text-brand";

export const ServerTag: React.FC<ServerTagProps> = ({ etiqueta, interativo = true }) => {
  const [aberto, setAberto] = useState(false);
  if (!etiqueta) return null;

  if (!interativo) {
    return (
      <span data-gc="perfil.server-tag.span" title={`Etiqueta de servidor: ${etiqueta.tag}`} className={SELO}>
        {etiqueta.tagIcon} {etiqueta.tag}
      </span>
    );
  }

  return (
    <Popover data-gc="perfil.server-tag.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="perfil.server-tag.popover-trigger" asChild>
        <button data-gc="perfil.server-tag.button"
          title={`Etiqueta de servidor: ${etiqueta.tag}`}
          className={`${SELO} transition hover:bg-brand/30`}
        >
          {etiqueta.tagIcon} {etiqueta.tag}
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="perfil.server-tag.popover-content" side="bottom" align="start" className="w-72 overflow-hidden p-0">
        {aberto && <CartaoDoServidor data-gc="perfil.server-tag.cartao-do-servidor" guildId={etiqueta.guildId} onIr={() => setAberto(false)} />}
      </PopoverContent>
    </Popover>
  );
};

const CartaoDoServidor: React.FC<{ guildId: string; onIr: () => void }> = ({ guildId, onIr }) => {
  const navigate = useNavigate();
  const { data: servidor, isLoading } = useGuildPreview(guildId);

  if (isLoading || !servidor) {
    return <div data-gc="perfil.server-tag.div" className="p-6 text-sm text-ink-faint">Carregando…</div>;
  }

  return (
    <>
      <div data-gc="perfil.server-tag.div--2"
        className="h-16 overflow-hidden"
        style={servidor.bannerUrl ? undefined : { backgroundColor: avatarColor(servidor.id) }}
      >
        {servidor.bannerUrl && (
          <img data-gc="perfil.server-tag.img" src={servidor.bannerUrl} alt="" className="size-full object-cover" />
        )}
      </div>

      <div data-gc="perfil.server-tag.div--3" className="px-4 pb-4">
        <div data-gc="perfil.server-tag.div--4" className="-mt-8 mb-2 size-16 overflow-hidden rounded-2xl bg-surface-3 ring-4 ring-surface-0">
          {servidor.iconUrl ? (
            <img data-gc="perfil.server-tag.img--2" src={servidor.iconUrl} alt="" className="size-full object-cover" />
          ) : (
            <span data-gc="perfil.server-tag.span--2" className="flex size-full items-center justify-center text-xl font-bold">
              {servidor.name.slice(0, 2)}
            </span>
          )}
        </div>

        <p data-gc="perfil.server-tag.p" className="flex items-center gap-1.5 font-bold leading-tight">
          <span data-gc="perfil.server-tag.span--3" className="min-w-0 truncate">{servidor.name}</span>
          <span data-gc="perfil.server-tag.span--4" className={SELO}>
            {servidor.tagIcon} {servidor.tag}
          </span>
        </p>

        <p data-gc="perfil.server-tag.p--2" className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
          <span data-gc="perfil.server-tag.span--5" className="flex items-center gap-1">
            <span data-gc="perfil.server-tag.span--6" className="size-2 rounded-full bg-online" />
            {servidor.onlineCount} online
          </span>
          <span data-gc="perfil.server-tag.span--7" className="flex items-center gap-1">
            <span data-gc="perfil.server-tag.span--8" className="size-2 rounded-full bg-ink-faint" />
            {servidor.memberCount} {servidor.memberCount === 1 ? "membro" : "membros"}
          </span>
        </p>

        <p data-gc="perfil.server-tag.p--3" className="mt-1 text-xs text-ink-faint">
          Desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
            new Date(servidor.createdAt),
          )}
        </p>

        {servidor.description && (
          <p data-gc="perfil.server-tag.p--4" className="mt-3 whitespace-pre-wrap text-sm text-ink-muted">{servidor.description}</p>
        )}

        {servidor.souMembro ? (
          <Button data-gc="perfil.server-tag.button--2"
            variant="success"
            className="mt-4 w-full"
            onClick={() => {
              onIr();
              navigate(`/channels/${servidor.id}`);
            }}
          >
            Ir para o servidor
          </Button>
        ) : (
          <p data-gc="perfil.server-tag.p--5" className="mt-4 text-center text-xs text-ink-faint">
            Você precisa de um convite para entrar
          </p>
        )}
      </div>
    </>
  );
};
