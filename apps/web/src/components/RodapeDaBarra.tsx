import React from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { CartaoDaTransmissao } from "~/features/voz/components/CartaoDaTransmissao";
import { UserPanel } from "~/features/perfil/components/UserPanel";
import { VoicePanel } from "~/features/voz/components/VoicePanel";

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
    <div className="relative z-30 -ml-[72px] bg-surface-1 pb-2">
      <CartaoDaTransmissao className="mx-2 mb-2" />

      <div className="mx-2 rounded-lg bg-painel p-2 shadow-lg shadow-black/30 [--gc-recorte:var(--color-painel)]">
        <VoicePanel accountChannelId={accountChannelId} />
        {user && <UserPanel user={user} guildId={guildId} onLogout={onLogout} />}
      </div>
    </div>
  </>
);
