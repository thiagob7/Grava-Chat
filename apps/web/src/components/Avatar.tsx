import React, { useEffect, useState } from "react";
import type { PresenceStatus } from "@gravae/shared";

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
  /** anel verde de "está falando", em volta da foto */
  speaking?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  id,
  name,
  url,
  size = 40,
  status,
  speaking,
  className,
}) => {
  const [falhou, setFalhou] = useState(false);

  // troca de usuário reaproveita o componente: sem isso, um erro anterior
  // esconderia a foto do próximo
  useEffect(() => setFalhou(false), [url]);

  const mostrarImagem = Boolean(url) && !falhou;

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full transition-shadow duration-100",
        /**
         * Anel por box-shadow, não por borda: borda muda o tamanho da caixa e
         * faria a lista inteira tremer a cada palavra. A sombra fica por fora
         * sem ocupar espaço no layout.
         */
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
          /**
           * Sem isto o Google devolve 403 para a foto de perfil: o
           * lh3.googleusercontent.com recusa requisições que mandam Referer de
           * outra origem, e o navegador cai no texto alternativo — foi o "Thi"
           * aparecendo por baixo da imagem.
           */
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className="size-full rounded-full bg-surface-3 object-cover"
        />
      ) : (
        // Fallback é a inicial, nunca o alt do <img>: alt vaza como texto solto
        // e estoura o layout do círculo.
        <div
          className="flex size-full select-none items-center justify-center rounded-full font-semibold text-white"
          style={{ backgroundColor: avatarColor(id), fontSize: size * 0.38 }}
          aria-label={name}
        >
          {initials(name)}
        </div>
      )}

      {status && (
        // A borda na cor do fundo cria o "recorte" do indicador, igual ao Discord.
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-[3px] border-surface-1",
            STATUS_COLOR[status],
          )}
          style={{ width: size * 0.35, height: size * 0.35 }}
        />
      )}
    </div>
  );
};
