import React from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { UserPanel } from "~/components/UserPanel";
import { VoicePanel } from "~/components/VoicePanel";

interface RodapeDaBarraProps {
  user?: SelfUserModel | null;
  onLogout: () => void;
  accountChannelId?: string | null;
  onMoveHere?: (channelId: string) => void;
}

/** A chamada e o seu usuário num cartão flutuante só, no pé da barra lateral. */
export const RodapeDaBarra: React.FC<RodapeDaBarraProps> = ({
  user,
  onLogout,
  accountChannelId,
  onMoveHere,
}) => (
  <div className="relative z-30 -ml-16 mb-2 mr-2 rounded-lg bg-surface-2 p-2 shadow-lg shadow-black/30 ring-1 ring-white/[0.04] [--gc-recorte:var(--color-surface-2)]">
    <VoicePanel accountChannelId={accountChannelId} onMoveHere={onMoveHere} />
    {user && <UserPanel user={user} onLogout={onLogout} />}
  </div>
);
