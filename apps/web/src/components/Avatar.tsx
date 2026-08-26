import React, { useEffect, useState } from "react";
import type { PerfilPublico, PresenceStatus } from "@gravae/shared";

import { DecoracaoAnimada } from "~/components/DecoracaoAnimada";
import { ehAnimada } from "~/lib/cosmeticos/animadas";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/lib/cosmeticos/estilos";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";

const STATUS_COLOR: Record<PresenceStatus, string> = {
  ONLINE: "bg-online",
  IDLE: "bg-idle",
  DND: "bg-dnd",
  OFFLINE: "bg-ink-faint",
};

interface AvatarProps {
  id: string;
  name: string;
  url?: string | null;
  size?: number;
  status?: PresenceStatus;
  speaking?: boolean;
  enfeites?: Pick<PerfilPublico, "decoracao" | "moldura"> | null;
  animar?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  id,
  name,
  url,
  size = 40,
  status,
  speaking,
  enfeites,
  animar = false,
  className,
}) => {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => setFalhou(false), [url]);

  const mostrarImagem = Boolean(url) && !falhou;

  const animada = ehAnimada(enfeites?.decoracao);
  const decoracao = animada
    ? null
    : classeDoEnfeite("decoracao", enfeites?.decoracao);
  const moldura = speaking
    ? null
    : classeDoEnfeite("moldura", enfeites?.moldura);
  const ritmo = variaveisDoEnfeite({ animar, velocidade: "8s" });

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full transition-shadow duration-100",
        speaking && "shadow-[0_0_0_3px_var(--color-online)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {mostrarImagem ? (
        <img
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFalhou(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="size-full rounded-full bg-surface-3 object-cover"
        />
      ) : (
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {moldura && (
        <span
          aria-hidden
          className={cn("gc-camada gc-camada--moldura", moldura)}
          style={ritmo}
        />
      )}
      {decoracao && (
        <span
          aria-hidden
          className={cn("gc-camada", decoracao)}
          style={ritmo}
        />
      )}
      {animada && enfeites?.decoracao && (
        <DecoracaoAnimada decoracao={enfeites.decoracao} animar={animar} />
      )}

      {status && (
        <span
          className={cn("absolute rounded-full", STATUS_COLOR[status])}
          style={{
            ...cantoDoStatus(size),
            borderStyle: "solid",
            borderColor: "var(--gc-recorte, var(--color-surface-1))",
          }}
        />
      )}
    </div>
  );
};

function cantoDoStatus(size: number) {
  const lado = Math.round(size * 0.32);
  const anel = Math.max(1.5, size / 24);
  const distancia = size / 2;
  const canto = size / 2 + distancia / Math.SQRT2 - lado / 2;

  return { width: lado, height: lado, left: canto, top: canto, borderWidth: anel };
}
