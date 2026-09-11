import React, { useState } from "react";
import { useNavigate } from "react-router";

import { useGuildPreview } from "~/@core/application/queries/guild/use-guild-preview";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { avatarColor } from "~/lib/format";

interface ServerTagProps {
  tag?: { guildId: string; tag: string; tagIcon: string | null } | null;
  interactive?: boolean;
}

const SEAL = "flex shrink-0 items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-10 font-semibold uppercase text-brand";

export const ServerTag: React.FC<ServerTagProps> = ({ tag, interactive = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!tag) return null;

  if (!interactive) {
    return (
      <span data-gc="perfil.server-tag.span" title={`Etiqueta de servidor: ${tag.tag}`} className={SEAL}>
        {tag.tagIcon} {tag.tag}
      </span>
    );
  }

  return (
    <Popover data-gc="perfil.server-tag.popover.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger data-gc="perfil.server-tag.popover-trigger" asChild>
        <button data-gc="perfil.server-tag.button"
          title={`Etiqueta de servidor: ${tag.tag}`}
          className={`${SEAL} transition hover:bg-brand/30`}
        >
          {tag.tagIcon} {tag.tag}
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="perfil.server-tag.popover-content" side="bottom" align="start" className="w-72 overflow-hidden p-0">
        {isOpen && <ServerCard data-gc="perfil.server-tag.server-card" guildId={tag.guildId} onIr={() => setIsOpen(false)} />}
      </PopoverContent>
    </Popover>
  );
};

const ServerCard: React.FC<{ guildId: string; onIr: () => void }> = ({ guildId, onIr }) => {
  const navigate = useNavigate();
  const { data: server, isLoading } = useGuildPreview(guildId);

  if (isLoading || !server) {
    return <div data-gc="perfil.server-tag.div" className="p-6 text-sm text-ink-faint">Carregando…</div>;
  }

  return (
    <>
      <div data-gc="perfil.server-tag.div--2"
        className="h-16 overflow-hidden"
        style={server.bannerUrl ? undefined : { backgroundColor: avatarColor(server.id) }}
      >
        {server.bannerUrl && (
          <img data-gc="perfil.server-tag.img" src={server.bannerUrl} alt="" className="size-full object-cover" />
        )}
      </div>

      <div data-gc="perfil.server-tag.div--3" className="px-4 pb-4">
        <div data-gc="perfil.server-tag.div--4" className="-mt-8 mb-2 size-16 overflow-hidden rounded-2xl bg-surface-3 ring-4 ring-surface-0">
          {server.iconUrl ? (
            <img data-gc="perfil.server-tag.img--2" src={server.iconUrl} alt="" className="size-full object-cover" />
          ) : (
            <span data-gc="perfil.server-tag.span--2" className="flex size-full items-center justify-center text-xl font-bold">
              {server.name.slice(0, 2)}
            </span>
          )}
        </div>

        <p data-gc="perfil.server-tag.p" className="flex items-center gap-1.5 font-bold leading-tight">
          <span data-gc="perfil.server-tag.span--3" className="min-w-0 truncate">{server.name}</span>
          <span data-gc="perfil.server-tag.span--4" className={SEAL}>
            {server.tagIcon} {server.tag}
          </span>
        </p>

        <p data-gc="perfil.server-tag.p--2" className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
          <span data-gc="perfil.server-tag.span--5" className="flex items-center gap-1">
            <span data-gc="perfil.server-tag.span--6" className="size-2 rounded-full bg-online" />
            {server.onlineCount} online
          </span>
          <span data-gc="perfil.server-tag.span--7" className="flex items-center gap-1">
            <span data-gc="perfil.server-tag.span--8" className="size-2 rounded-full bg-ink-faint" />
            {server.memberCount} {server.memberCount === 1 ? "membro" : "membros"}
          </span>
        </p>

        <p data-gc="perfil.server-tag.p--3" className="mt-1 text-xs text-ink-faint">
          Desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(
            new Date(server.createdAt),
          )}
        </p>

        {server.description && (
          <p data-gc="perfil.server-tag.p--4" className="mt-3 whitespace-pre-wrap text-sm text-ink-muted">{server.description}</p>
        )}

        {server.amMember ? (
          <Button data-gc="perfil.server-tag.button--2"
            variant="success"
            className="mt-4 w-full"
            onClick={() => {
              onIr();
              navigate(`/channels/${server.id}`);
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
