import React from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { CartaoDaTransmissao } from "~/features/voz/components/CartaoDaTransmissao";
import { UserPanel } from "~/features/perfil/components/UserPanel";
import { VoicePanel } from "~/features/voz/components/VoicePanel";
import { flx } from "~/lib/compat-fluxer";

interface RodapeDaBarraProps {
  user?: SelfUserModel | null;
  guildId?: string;
  onLogout: () => void;
  accountChannelId?: string | null;
}

export const RodapeDaBarra: React.FC<RodapeDaBarraProps> = ({
  user,
  guildId,
  onLogout,
  accountChannelId,
}) => (
  <>
    <div data-gc="app.rodape-da-barra.div"
      {...flx(
        "areaDoUsuario",
        "area-do-usuario relative z-30 -ml-[var(--layout-guild-list-width)] bg-surface-1 pb-2",
      )}
    >
      <CartaoDaTransmissao data-gc="app.rodape-da-barra.cartao-da-transmissao" className="mx-2 mb-2" />

      <div data-gc="app.rodape-da-barra.div--2"
        {...flx(
          "cartaoDoUsuario",
          "mx-2 rounded-lg bg-painel p-2 shadow-lg shadow-black/30 [--gc-recorte:var(--color-painel)]",
        )}
      >
        <VoicePanel data-gc="app.rodape-da-barra.voice-panel" accountChannelId={accountChannelId} />
        {user && <UserPanel data-gc="app.rodape-da-barra.user-panel.on-logout" user={user} guildId={guildId} onLogout={onLogout} />}
      </div>
    </div>
  </>
);
