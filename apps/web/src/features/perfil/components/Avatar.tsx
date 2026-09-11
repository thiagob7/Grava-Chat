import React, { useEffect, useState } from "react";
import type { ProfilePublic, PresenceStatus } from "@gravae/shared";

import { FileDecoration } from "~/features/perfil/components/DecoracaoDeArquivo";
import { StatusIcon } from "~/features/perfil/components/IconeDeStatus";
import { isFile, decorationSlack } from "~/features/perfil/lib/decoracoes";
import { charmClass, charmVariables } from "~/features/perfil/lib/estilos";
import { avatarColor, initials } from "~/lib/format";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

interface AvatarProps {
  id: string;
  name: string;
  url?: string | null;
  size?: number;
  status?: PresenceStatus;
  inVoice?: boolean;
  speaking?: boolean;
  charms?: Pick<ProfilePublic, "decoration" | "frame"> | null;
  animate?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  id,
  name,
  url,
  size = 40,
  status,
  inVoice,
  speaking,
  charms,
  animate = false,
  className,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  const showImage = Boolean(url) && !failed;

  const seal = status || inVoice ? statusCorner(size) : null;

  const gap = (slack: number) => {
    if (!seal) return undefined;

    const hole = `radial-gradient(circle ${seal.radius}px at ${seal.center.x + slack}px ${seal.center.y + slack}px, transparent ${seal.radius}px, #000 ${seal.radius + 0.5}px)`;
    return { WebkitMaskImage: hole, maskImage: hole } as React.CSSProperties;
  };

  const layerCrop = gap(size * 0.16);
  const fileCrop = charms?.decoration
    ? gap(-(parseFloat(decorationSlack(charms.decoration)) / 100) * size)
    : undefined;

  const fromFile = isFile(charms?.decoration);
  const decoration = fromFile
    ? null
    : charmClass("decoracao", charms?.decoration);
  const pace = charmVariables({ animate, speed: "8s" });

  return (
    <div data-gc="perfil.avatar.div"
      className={cn(
        flxCls("avatarFrame"),
        "avatar relative shrink-0 rounded-full transition-shadow duration-100",
        flxCls("avatar"),
        speaking && "shadow-[0_0_0_3px_var(--color-online)]",
        className,
      )}
      style={{ width: size, height: size }}
      data-flx-status={status ? String(status).toLowerCase() : "offline"}
      {...flxAttr("avatar")}
    >
      {showImage ? (
        <img data-gc="perfil.avatar.img"
          src={url!}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          style={gap(0)}
          className="size-full rounded-full bg-surface-3 object-cover"
          {...flxAttr("avatarImage")}
        />
      ) : (
        <div data-gc="perfil.avatar.div--2"
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-sobre-marca"
          style={{ ...gap(0), backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {decoration && (
        <span data-gc="perfil.avatar.span"
          aria-hidden
          className={cn("gc-camada", decoration)}
          style={{ ...pace, ...layerCrop }}
        />
      )}
      {fromFile && charms?.decoration && (
        <FileDecoration data-gc="perfil.avatar.file-decoration"
          decoration={charms.decoration}
          animate={animate}
          crop={fileCrop}
        />
      )}

      {seal && (
        <span data-gc="perfil.avatar.span--2"
          className="absolute"
          style={{ left: seal.left, top: seal.top }}
          {...flxAttr("statusDot")}
        >
          <StatusIcon data-gc="perfil.avatar.status-icon" kind={inVoice ? "VOZ" : status!} size={seal.side} />
        </span>
      )}
    </div>
  );
};

function statusCorner(size: number) {
  const side = Math.max(8, Math.round(size * 0.22));
  const center = size * 0.82;
  const slack = Math.max(1.25, size * 0.045);

  return {
    side,
    left: center - side / 2,
    top: center - side / 2,
    center: { x: center, y: center },
    radius: side / 2 + slack,
  };
}
