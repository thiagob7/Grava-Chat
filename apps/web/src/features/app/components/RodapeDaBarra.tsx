import React, { useEffect, useRef } from "react";

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

/*
  Um tema desconta a altura do rodapé para encurtar o trilho e a lateral, e lê
  esse número de `--footer-box-height`. O nosso rodapé cresce com o que tem
  dentro — cartão de transmissão, painel de voz — então um número cravado
  erraria por alguns pixels justo na emenda entre os painéis.

  Aqui ele se mede e conta. Enquanto o rodapé existir, o token diz a verdade.
*/
function useAlturaDoRodape() {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo || typeof ResizeObserver === "undefined") return;

    const raiz = document.documentElement;

    const observador = new ResizeObserver(() => {
      raiz.style.setProperty("--footer-box-height", `${Math.round(alvo.offsetHeight)}px`);
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
        /*
          A margem negativa puxa a esquerda até debaixo do trilho, mas sem uma
          largura própria o bloco só preenchia a lateral — e a borda direita
          parava 72px antes dela. `100%` aqui é a lateral, que carrega a largura
          arrastada de verdade, e não o token, que mente depois do arrasto.
        */
        "area-do-usuario relative z-30 -ml-[var(--layout-guild-list-width)] w-[calc(100%+var(--layout-guild-list-width))] bg-surface-1 pb-2",
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
};
