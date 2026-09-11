import React, { useEffect, useRef } from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { BroadcastCard } from "~/features/voz/components/CartaoDaTransmissao";
import { UserPanel } from "~/features/perfil/components/UserPanel";
import { VoicePanel } from "~/features/voz/components/VoicePanel";
import { flx } from "~/lib/compat-de-tema";

interface BarPropsFooter {
  user?: SelfUserModel | null;
  guildId?: string;
  onLogout: () => void;
  accountChannelId?: string | null;
}

function useFooterHeight() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = box.current;
    if (!target || typeof ResizeObserver === "undefined") return;

    const root = document.documentElement;

    const observer = new ResizeObserver(() => {
      const breath = Number.parseFloat(getComputedStyle(target).paddingBottom) || 0;

      root.style.setProperty(
        "--footer-box-height",
        `${Math.round(target.offsetHeight - breath)}px`,
      );
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--footer-box-height");
    };
  }, []);

  return box;
}

export const BarFooter: React.FC<BarPropsFooter> = ({
  user,
  guildId,
  onLogout,
  accountChannelId,
}) => {
  const box = useFooterHeight();

  return (
  <>
    <div data-gc="app.rodape-da-barra.div"
      ref={box}
      data-gc-usuario={user?.id}
      {...flx(
        "userArea",
        "area-do-usuario relative z-30 w-0 min-w-full bg-surface-1 px-2 pb-2",
      )}
    >
      <BroadcastCard data-gc="app.rodape-da-barra.broadcast-card" className="mb-2" />

      <div data-gc="app.rodape-da-barra.div--2"
        data-gc-usuario={user?.id}
        {...flx(
          "userCard",
          "flex min-h-[var(--user-card-min-height)] w-full flex-col justify-center overflow-hidden rounded-[var(--footer-box-radius)] bg-painel p-2 shadow-lg shadow-sombra [--gc-recorte:var(--color-painel)]",
        )}
      >
        <VoicePanel data-gc="app.rodape-da-barra.voice-panel" accountChannelId={accountChannelId} />
        {user && <UserPanel data-gc="app.rodape-da-barra.user-panel.on-logout" user={user} guildId={guildId} onLogout={onLogout} />}
      </div>
    </div>
    </>
  );
};
