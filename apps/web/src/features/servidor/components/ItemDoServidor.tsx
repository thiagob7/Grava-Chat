import React, { useState } from "react";
import { Link } from "react-router";
import { Headphones, MonitorPlay } from "@phosphor-icons/react";
import type { VoiceServer } from "@gravae/shared";
import { useTranslation } from "react-i18next";

import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { ServerHint } from "~/features/servidor/components/DicaDoServidor";
import { ServerMenu } from "~/features/servidor/components/MenuDoServidor";
import type { Destination } from "~/features/servidor/lib/trilho";
import { avatarColor, initials } from "~/lib/format";
import { serverMuted, useNotices } from "~/stores/notificacoes";
import { cn } from "~/lib/utils";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";

export const DRAG_KIND = "text/gravae-servidor";

export type DropZone = "antes" | "depois" | "juntar" | null;

export function pointerZone(e: React.DragEvent<HTMLElement>): DropZone {
  const r = e.currentTarget.getBoundingClientRect();
  const y = (e.clientY - r.top) / r.height;
  return y < 0.3 ? "antes" : y > 0.7 ? "depois" : "juntar";
}

export const DropBrand: React.FC<{ zone: DropZone }> = ({ zone }) =>
  zone === "antes" || zone === "depois" ? (
    <span data-gc="servidor.item-do-servidor.span"
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand",
        zone === "antes" ? "-top-1.5" : "-bottom-1.5",
      )}
    />
  ) : null;

interface ServerPropsItem {
  guild: GuildSummaryModel;
  active: boolean;
  notRead: number;
  mentions: number;
  voices: VoiceServer[];
  onSelect: (guildId: string) => void;
  onInvite: () => void;
  onDrop?: (guildId: string, destination: Destination) => void;
  folderId?: string;
  compact?: boolean;
}

export const ServerItem: React.FC<ServerPropsItem> = ({
  guild,
  active,
  notRead,
  mentions,
  voices,
  onSelect,
  onInvite,
  onDrop,
  folderId,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [zone, setZone] = useState<DropZone>(null);

  const broadcasting = voices.some((channel) => channel.broadcasting);
  const inCall = voices.reduce((total, channel) => total + channel.people.length, 0);
  const muted = useNotices((s) => serverMuted(s, guild.id));
  const hasNews = !active && notRead > 0 && !muted;

  const dragging = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.types.includes(DRAG_KIND);

  return (
    <ServerMenu data-gc="servidor.item-do-servidor.server-menu.on-invite" guild={guild} onInvite={onInvite}>
      <div data-gc="servidor.item-do-servidor.div"
        className="group/servidor relative flex w-full justify-center"
        onDragOver={(e) => {
          if (!onDrop || !dragging(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setZone(pointerZone(e));
        }}
        onDragLeave={() => setZone(null)}
        onDrop={(e) => {
          if (!onDrop) return;
          const dragged = e.dataTransfer.getData(DRAG_KIND);
          const z = pointerZone(e);
          setZone(null);
          if (!dragged || dragged === guild.id) return;
          e.preventDefault();
          e.stopPropagation();

          if (folderId) onDrop(dragged, { kind: "pasta", folderId });
          else if (z === "juntar") onDrop(dragged, { kind: "juntar", having: guild.id });
          else onDrop(dragged, { kind: z === "antes" ? "antes" : "depois", de: guild.id });
        }}
      >
        <DropBrand data-gc="servidor.item-do-servidor.drop-brand" zone={folderId ? null : zone} />

        <span data-gc="servidor.item-do-servidor.span--2"
          {...flxAttr("serverPill")}
          className={cn(
            flxCls("serverPill"),
            "absolute left-0 top-1/2 w-1 -translate-y-1/2 transition-all",
            active
              ? "h-10"
              : hasNews
                ? "h-2 group-hover/servidor:h-5"
                : "h-0 group-hover/servidor:h-5",
          )}
        >
          <span data-gc="servidor.item-do-servidor.span--3"
            {...flxAttr("pillServerBar")}
            className={cn(flxCls("pillServerBar"), "block size-full rounded-r-full bg-pilula")}
          />
        </span>

        <ServerHint data-gc="servidor.item-do-servidor.server-hint" name={guild.name} verified={guild.verified} detectable={guild.detectable} voices={voices}>
          <Link data-gc="servidor.item-do-servidor.link"
            to={`/channels/${guild.id}`}
            onClick={() => onSelect(guild.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_KIND, guild.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className={cn(
              flxCls("serverIcon"),
              "flex items-center justify-center overflow-hidden font-semibold transition-all duration-200 ease-out active:translate-y-px active:scale-95",
              compact ? "size-10 text-sm" : "size-[var(--guild-icon-size)]",
              active
                ? cn("rounded-2xl bg-brand", flxCls("serverActiveIcon"))
                : "rounded-3xl bg-surface-0 hover:rounded-2xl hover:bg-brand",
              zone === "juntar" && !folderId && "ring-2 ring-brand ring-offset-2 ring-offset-surface-1",
              muted && !active && "opacity-60",
            )}
            style={!active && !guild.iconUrl ? { color: avatarColor(guild.id) } : undefined}
          >
            {guild.iconUrl ? (
              <img data-gc="servidor.item-do-servidor.img" src={guild.iconUrl} alt={guild.name} draggable={false} className="size-full object-cover" />
            ) : (
              initials(guild.name)
            )}
          </Link>
        </ServerHint>

        {inCall > 0 && (
          <span data-gc="servidor.item-do-servidor.span--4"
            title={broadcasting ? t("servidor.trilho.transmitindo") : t("servidor.trilho.emChamada", { count: inCall })}
            className="pointer-events-none absolute -top-0.5 right-2 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-surface-0 text-ink"
          >
            {broadcasting ? <MonitorPlay data-gc="servidor.item-do-servidor.monitor-play" size={11} weight="fill" /> : <Headphones data-gc="servidor.item-do-servidor.headphones" size={11} weight="fill" />}
          </span>
        )}

        {mentions > 0 && (
          <span data-gc="servidor.item-do-servidor.span--5"
            title={`${mentions} menção${mentions === 1 ? "" : "ões"} a você`}
            className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-sobre-marca"
          >
            {mentions > 99 ? "99+" : mentions}
          </span>
        )}
      </div>
    </ServerMenu>
  );
};
