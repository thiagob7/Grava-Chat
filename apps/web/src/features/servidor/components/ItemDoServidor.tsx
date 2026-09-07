import React, { useState } from "react";
import { Link } from "react-router";
import { Headphones, MonitorPlay } from "@phosphor-icons/react";
import type { VozNoServidor } from "@gravae/shared";
import { useTranslation } from "react-i18next";

import type { GuildSummaryModel } from "~/@core/domain/models/guild-model";
import { DicaDoServidor } from "~/features/servidor/components/DicaDoServidor";
import { MenuDoServidor } from "~/features/servidor/components/MenuDoServidor";
import type { Destino } from "~/features/servidor/lib/trilho";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";

export const TIPO_DE_ARRASTO = "text/gravae-servidor";

export type ZonaDeSoltar = "antes" | "depois" | "juntar" | null;

/// Onde no item o ponteiro está: no terço de cima, no de baixo, ou no meio.
export function zonaDoPonteiro(e: React.DragEvent<HTMLElement>): ZonaDeSoltar {
  const r = e.currentTarget.getBoundingClientRect();
  const y = (e.clientY - r.top) / r.height;
  return y < 0.3 ? "antes" : y > 0.7 ? "depois" : "juntar";
}

/// A linha que mostra onde o servidor arrastado vai cair.
export const MarcaDeSoltar: React.FC<{ zona: ZonaDeSoltar }> = ({ zona }) =>
  zona === "antes" || zona === "depois" ? (
    <span data-gc="servidor.item-do-servidor.span"
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand",
        zona === "antes" ? "-top-1.5" : "-bottom-1.5",
      )}
    />
  ) : null;

interface ItemDoServidorProps {
  guild: GuildSummaryModel;
  active: boolean;
  naoLidas: number;
  mencoes: number;
  vozes: VozNoServidor[];
  onSelect: (guildId: string) => void;
  onConvidar: () => void;
  /// Sem isto, o item não recebe nada em cima dele (dentro de pasta fechada, por exemplo).
  onSoltar?: (guildId: string, destino: Destino) => void;
  /// Dentro de uma pasta, soltar em cima é "entrar na pasta", não "juntar".
  pastaId?: string;
  compacto?: boolean;
}

export const ItemDoServidor: React.FC<ItemDoServidorProps> = ({
  guild,
  active,
  naoLidas,
  mencoes,
  vozes,
  onSelect,
  onConvidar,
  onSoltar,
  pastaId,
  compacto = false,
}) => {
  const { t } = useTranslation();
  const [zona, setZona] = useState<ZonaDeSoltar>(null);

  const transmitindo = vozes.some((canal) => canal.transmitindo);
  const naChamada = vozes.reduce((total, canal) => total + canal.pessoas.length, 0);
  const temNovidade = !active && naoLidas > 0;

  const arrastando = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.types.includes(TIPO_DE_ARRASTO);

  return (
    <MenuDoServidor data-gc="servidor.item-do-servidor.menu-do-servidor.on-convidar" guild={guild} onConvidar={onConvidar}>
      <div data-gc="servidor.item-do-servidor.div"
        className="group relative flex w-full justify-center"
        onDragOver={(e) => {
          if (!onSoltar || !arrastando(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setZona(zonaDoPonteiro(e));
        }}
        onDragLeave={() => setZona(null)}
        onDrop={(e) => {
          if (!onSoltar) return;
          const arrastado = e.dataTransfer.getData(TIPO_DE_ARRASTO);
          const z = zonaDoPonteiro(e);
          setZona(null);
          if (!arrastado || arrastado === guild.id) return;
          e.preventDefault();
          e.stopPropagation();

          if (pastaId) onSoltar(arrastado, { tipo: "pasta", pastaId });
          else if (z === "juntar") onSoltar(arrastado, { tipo: "juntar", com: guild.id });
          else onSoltar(arrastado, { tipo: z === "antes" ? "antes" : "depois", de: guild.id });
        }}
      >
        <MarcaDeSoltar data-gc="servidor.item-do-servidor.marca-de-soltar" zona={pastaId ? null : zona} />

        <span data-gc="servidor.item-do-servidor.span--2"
          {...flxAttr("pilulaDoServidor")}
          className={cn(
            flxCls("pilulaDoServidor"),
            "absolute left-0 top-1/2 w-1 -translate-y-1/2 transition-all",
            active ? "h-10" : temNovidade ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
          )}
        >
          <span data-gc="servidor.item-do-servidor.span--3"
            {...flxAttr("barraDaPilulaDoServidor")}
            className={cn(flxCls("barraDaPilulaDoServidor"), "block size-full rounded-r-full bg-pilula")}
          />
        </span>

        <DicaDoServidor data-gc="servidor.item-do-servidor.dica-do-servidor" nome={guild.name} verificada={guild.verificada} detectavel={guild.detectavel} vozes={vozes}>
          {/*
            Link, e não botão — a mesma decisão que a referência tomou: um tema
            comum escreve `button { border-radius }`, e os servidores ficam
            com a forma deles. E o link é arrastável: é assim que se arruma o
            trilho, juntando um no outro.
          */}
          <Link data-gc="servidor.item-do-servidor.link"
            to={`/channels/${guild.id}`}
            onClick={() => onSelect(guild.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(TIPO_DE_ARRASTO, guild.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className={cn(
              flxCls("iconeDoServidor"),
              "flex items-center justify-center overflow-hidden font-semibold transition-all duration-200 ease-out active:translate-y-px active:scale-95",
              compacto ? "size-10 text-sm" : "size-[var(--guild-icon-size)]",
              active
                ? cn("rounded-2xl bg-brand", flxCls("iconeDoServidorAtivo"))
                : "rounded-3xl bg-surface-0 hover:rounded-2xl hover:bg-brand",
              zona === "juntar" && !pastaId && "ring-2 ring-brand ring-offset-2 ring-offset-surface-1",
            )}
            style={!active && !guild.iconUrl ? { color: avatarColor(guild.id) } : undefined}
          >
            {guild.iconUrl ? (
              <img data-gc="servidor.item-do-servidor.img" src={guild.iconUrl} alt={guild.name} draggable={false} className="size-full object-cover" />
            ) : (
              initials(guild.name)
            )}
          </Link>
        </DicaDoServidor>

        {naChamada > 0 && (
          <span data-gc="servidor.item-do-servidor.span--4"
            title={transmitindo ? t("servidor.trilho.transmitindo") : t("servidor.trilho.emChamada", { count: naChamada })}
            className="pointer-events-none absolute -top-0.5 right-2 flex size-5 items-center justify-center rounded-full border-2 border-surface-1 bg-surface-0 text-ink"
          >
            {transmitindo ? <MonitorPlay data-gc="servidor.item-do-servidor.monitor-play" size={11} weight="fill" /> : <Headphones data-gc="servidor.item-do-servidor.headphones" size={11} weight="fill" />}
          </span>
        )}

        {mencoes > 0 && (
          <span data-gc="servidor.item-do-servidor.span--5"
            title={`${mencoes} menção${mencoes === 1 ? "" : "ões"} a você`}
            className="pointer-events-none absolute bottom-0 right-3 flex min-w-[20px] items-center justify-center rounded-full border-2 border-surface-1 bg-danger px-1 text-11 font-bold leading-4 text-sobre-marca"
          >
            {mencoes > 99 ? "99+" : mencoes}
          </span>
        )}
      </div>
    </MenuDoServidor>
  );
};
