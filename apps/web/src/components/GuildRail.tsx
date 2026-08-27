import React, { useState } from "react";
import { Plus } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useReadStatesPorServidor } from "~/@core/application/queries/message/use-read-states";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { CreateGuildModal } from "~/components/CreateGuildModal";
import { Tooltip } from "~/components/ui/tooltip";

interface GuildRailProps {
  activeGuildId: string | null;
  onSelect: (guildId: string) => void;
  onOpenFriends: () => void;
  pendingFriendRequests: number;
}

export const GuildRail: React.FC<GuildRailProps> = ({
  activeGuildId,
  onSelect,
  onOpenFriends,
  pendingFriendRequests,
}) => {
  const { data: guilds = [] } = useFindManyGuilds(true);
  const { data: porServidor = {} } = useReadStatesPorServidor(true);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface-0 pb-36 pt-3">
        <div className="group relative flex w-full justify-center">
          <span
            className={cn(
              "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
              activeGuildId === null ? "h-10" : "h-0 group-hover:h-5",
            )}
          />
          <Tooltip label="Amigos e mensagens diretas" side="right">
            <button
              onClick={onOpenFriends}
              className={cn(
                "relative flex size-12 items-center justify-center text-xl font-bold transition-all",
                activeGuildId === null
                  ? "rounded-2xl bg-brand"
                  : "rounded-3xl bg-surface-1 hover:rounded-2xl hover:bg-brand",
              )}
            >
              <img
                src="/brand/logo%20g%20branco.svg"
                alt=""
                className="h-6 w-auto object-contain"
                draggable={false}
              />
              {pendingFriendRequests > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-surface-0 bg-danger text-[10px] font-bold text-white">
                  {pendingFriendRequests}
                </span>
              )}
            </button>
          </Tooltip>
        </div>

        <div className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />

        {guilds.map((guild) => {
          const active = guild.id === activeGuildId;
          const { naoLidas = 0, mencoes = 0 } = porServidor[guild.id] ?? {};

          /*
            A barrinha branca da esquerda diz três coisas com o mesmo traço,
            como no Discord: comprida = servidor aberto, curta e redonda = tem
            mensagem nova, nada = tudo lido. O número vermelho é outra coisa —
            é menção, e menção não se descobre rolando o chat.

            Servidor aberto não mostra a marca de não-lido: você está lendo.
          */
          const temNovidade = !active && naoLidas > 0;

          return (
            <div key={guild.id} className="group relative flex w-full justify-center">
              <span
                className={cn(
                  "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-pilula transition-all",
                  active ? "h-10" : temNovidade ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
                )}
              />
              <Tooltip label={guild.name} side="right">
                <button
                  onClick={() => onSelect(guild.id)}
                  className={cn(
                    "flex size-12 items-center justify-center overflow-hidden font-semibold transition-all",
                    active
                      ? "rounded-2xl bg-brand"
                      : "rounded-3xl bg-surface-1 hover:rounded-2xl hover:bg-brand",
                  )}
                  style={!active && !guild.iconUrl ? { color: avatarColor(guild.id) } : undefined}
                >
                  {guild.iconUrl ? (
                    <img src={guild.iconUrl} alt={guild.name} className="size-full object-cover" />
                  ) : (
                    initials(guild.name)
                  )}
                </button>
              </Tooltip>

              {mencoes > 0 && (
                <span
                  title={`${mencoes} menção${mencoes === 1 ? "" : "ões"} a você`}
                  /*
                    Fora do botão, não dentro: o ícone do servidor tem
                    `overflow-hidden` para recortar a foto no quadrado
                    arredondado, e qualquer selo desenhado lá dentro sumiria
                    junto com o canto.
                  */
                  className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-0 bg-danger px-1 text-[11px] font-bold leading-4 text-white"
                >
                  {mencoes > 99 ? "99+" : mencoes}
                </span>
              )}
            </div>
          );
        })}

        {/*
          Sem este guarda, quem nao tem servidor ve dois tracinhos colados: o
          de cima separa as mensagens da lista, e este separaria a lista do "+"
          — mas nao ha lista nenhuma no meio.
        */}
        {guilds.length > 0 && (
          <div className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />
        )}

        <Tooltip label="Criar servidor" side="right">
          <button
            onClick={() => setCreating(true)}
            className="flex size-12 items-center justify-center rounded-3xl bg-surface-1 text-online transition-all hover:rounded-2xl hover:bg-online hover:text-white"
          >
            <Plus size={24} />
          </button>
        </Tooltip>

      </nav>

      <CreateGuildModal open={creating} onClose={() => setCreating(false)} onCreated={onSelect} />
    </>
  );
};
