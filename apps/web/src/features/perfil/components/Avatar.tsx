import React, { useEffect, useState } from "react";
import type { PerfilPublico, PresenceStatus } from "@gravae/shared";

import { DecoracaoDeArquivo } from "~/features/perfil/components/DecoracaoDeArquivo";
import { IconeDeStatus } from "~/features/perfil/components/IconeDeStatus";
import { ehDeArquivo, folgaDaDecoracao } from "~/features/perfil/lib/decoracoes";
import { classeDoEnfeite, variaveisDoEnfeite } from "~/features/perfil/lib/estilos";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-fluxer";

interface AvatarProps {
  id: string;
  name: string;
  url?: string | null;
  size?: number;
  status?: PresenceStatus;
  emVoz?: boolean;
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
  emVoz,
  speaking,
  enfeites,
  animar = false,
  className,
}) => {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => setFalhou(false), [url]);

  const mostrarImagem = Boolean(url) && !falhou;

  const selo = status || emVoz ? cantoDoStatus(size) : null;

  const furo = (folga: number) => {
    if (!selo) return undefined;

    const buraco = `radial-gradient(circle ${selo.raio}px at ${selo.centro.x + folga}px ${selo.centro.y + folga}px, transparent ${selo.raio}px, #000 ${selo.raio + 0.5}px)`;
    return { WebkitMaskImage: buraco, maskImage: buraco } as React.CSSProperties;
  };

  const recorteDaCamada = furo(size * 0.16);
  const recorteDeArquivo = enfeites?.decoracao
    ? furo(-(parseFloat(folgaDaDecoracao(enfeites.decoracao)) / 100) * size)
    : undefined;

  const deArquivo = ehDeArquivo(enfeites?.decoracao);
  const decoracao = deArquivo
    ? null
    : classeDoEnfeite("decoracao", enfeites?.decoracao);
  const ritmo = variaveisDoEnfeite({ animar, velocidade: "8s" });

  return (
    <div data-gc="perfil.avatar.div"
      className={cn(
        "avatar relative shrink-0 rounded-full transition-shadow duration-100",
        flxCls("avatar"),
        speaking && "shadow-[0_0_0_3px_var(--color-online)]",
        className,
      )}
      style={{ width: size, height: size }}
      data-flx-status={status ? String(status).toLowerCase() : "offline"}
      {...flxAttr("avatar")}
    >
      {mostrarImagem ? (
        <img data-gc="perfil.avatar.img"
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFalhou(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          style={furo(0)}
          className="size-full rounded-full bg-surface-3 object-cover"
          {...flxAttr("imagemDoAvatar")}
        />
      ) : (
        <div data-gc="perfil.avatar.div--2"
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ ...furo(0), backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {decoracao && (
        <span data-gc="perfil.avatar.span"
          aria-hidden
          className={cn("gc-camada", decoracao)}
          style={{ ...ritmo, ...recorteDaCamada }}
        />
      )}
      {deArquivo && enfeites?.decoracao && (
        <DecoracaoDeArquivo data-gc="perfil.avatar.decoracao-de-arquivo"
          decoracao={enfeites.decoracao}
          animar={animar}
          recorte={recorteDeArquivo}
        />
      )}

      {selo && (
        <span data-gc="perfil.avatar.span--2"
          className="absolute"
          style={{ left: selo.left, top: selo.top }}
          {...flxAttr("bolinhaDeStatus")}
        >
          <IconeDeStatus data-gc="perfil.avatar.icone-de-status" tipo={emVoz ? "VOZ" : status!} tamanho={selo.lado} />
        </span>
      )}
    </div>
  );
};

function cantoDoStatus(size: number) {
  const lado = Math.max(8, Math.round(size * 0.22));
  const centro = size * 0.82;
  const folga = Math.max(1.25, size * 0.045);

  return {
    lado,
    left: centro - lado / 2,
    top: centro - lado / 2,
    centro: { x: centro, y: centro },
    raio: lado / 2 + folga,
  };
}
