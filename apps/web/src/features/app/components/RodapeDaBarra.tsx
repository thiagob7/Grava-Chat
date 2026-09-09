import React, { useEffect, useRef } from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { CartaoDaTransmissao } from "~/features/voz/components/CartaoDaTransmissao";
import { UserPanel } from "~/features/perfil/components/UserPanel";
import { VoicePanel } from "~/features/voz/components/VoicePanel";
import { flx } from "~/lib/compat-de-tema";

interface RodapeDaBarraProps {
  user?: SelfUserModel | null;
  guildId?: string;
  onLogout: () => void;
  accountChannelId?: string | null;
}

function useAlturaDoRodape() {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo || typeof ResizeObserver === "undefined") return;

    const raiz = document.documentElement;

    const observador = new ResizeObserver(() => {
      const respiro = Number.parseFloat(getComputedStyle(alvo).paddingBottom) || 0;

      raiz.style.setProperty(
        "--footer-box-height",
        `${Math.round(alvo.offsetHeight - respiro)}px`,
      );
    });

    observador.observe(alvo);

    return () => {
      observador.disconnect();
      raiz.style.removeProperty("--footer-box-height");
    };
  }, []);

  return caixa;
}

export const RodapeDaBarra: React.FC<RodapeDaBarraProps> = ({
  user,
  guildId,
  onLogout,
  accountChannelId,
}) => {
  const caixa = useAlturaDoRodape();

  return (
  <>
    <div data-gc="app.rodape-da-barra.div"
      ref={caixa}
      {...flx(
        "areaDoUsuario",
        "area-do-usuario relative z-30 w-0 min-w-full bg-surface-1 px-2 pb-2",
      )}
    >
      <CartaoDaTransmissao data-gc="app.rodape-da-barra.cartao-da-transmissao" className="mb-2" />

      <div data-gc="app.rodape-da-barra.div--2"
        {...flx(
          "cartaoDoUsuario",
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
