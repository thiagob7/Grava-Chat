import React from "react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { CartaoDaTransmissao } from "~/components/CartaoDaTransmissao";
import { UserPanel } from "~/components/UserPanel";
import { VoicePanel } from "~/components/VoicePanel";

interface RodapeDaBarraProps {
  user?: SelfUserModel | null;
  /// Nas conversas privadas nao ha servidor — e sem servidor nao ha cargo pra
  /// mostrar no cartao.
  guildId?: string;
  onLogout: () => void;
  accountChannelId?: string | null;
}

/** A chamada e o seu usuário num cartão flutuante só, no pé da barra lateral. */
export const RodapeDaBarra: React.FC<RodapeDaBarraProps> = ({
  user,
  guildId,
  onLogout,
  accountChannelId,
}) => (
  <>
    {/*
      O rodapé cobre o canto inteiro — inclusive os 72px do trilho — mas quem
      pinta é ESTE invólucro, não o cartão.

      É o que resolve as duas coisas de uma vez: o cartão volta a flutuar, com
      margem em todos os lados, e a borda entre o trilho e a lista de canais
      não aparece na tira que sobra embaixo dele, porque o invólucro já cobriu
      aquele pedaço com a cor da barra lateral.
    */}
    <div className="relative z-30 -ml-[72px] bg-surface-1 pb-2">
      <CartaoDaTransmissao className="mx-2 mb-2" />

      <div className="mx-2 rounded-lg bg-painel p-2 shadow-lg shadow-black/30 [--gc-recorte:var(--color-painel)]">
        <VoicePanel accountChannelId={accountChannelId} />
        {user && <UserPanel user={user} guildId={guildId} onLogout={onLogout} />}
      </div>
    </div>
  </>
);
