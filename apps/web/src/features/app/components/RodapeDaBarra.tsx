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

    /*
      A altura vai sem o respiro de baixo.

      Um tema encurta o trilho por este número, para o rodapé caber embaixo. Se
      o respiro entrasse na conta, o trilho subiria 8px a mais do que precisa —
      e é justamente nesse vão que o tema desenha o rótulo "user", que deveria
      montar na borda em vez de flutuar acima dela.
    */
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
        /*
          `w-0 min-w-full` em vez de `w-full`, e não é firula.

          A coluna da esquerda não tem largura fixa: ela nasce da largura do
          trilho mais a lateral. Um filho `w-full` numa coluna assim entra na
          conta com o tamanho do próprio texto — e o texto daqui é o nome do
          canal de voz, que pode ser longo. A coluna crescia junto e empurrava o
          app inteiro para fora da janela.

          Com largura zero ele não entra na conta, e o mínimo o faz desenhar na
          largura da coluna do mesmo jeito.
        */
        "area-do-usuario relative z-30 w-0 min-w-full bg-surface-1 px-2 pb-2",
      )}
    >
      <CartaoDaTransmissao data-gc="app.rodape-da-barra.cartao-da-transmissao" className="mb-2" />

      <div data-gc="app.rodape-da-barra.div--2"
        {...flx(
          "cartaoDoUsuario",
          /*
            Coluna de flex, e não um bloco — é a declaração do
            `UserArea.userAreaInnerWrapper` deles, e ela decide a largura da
            faixa do usuário quando um tema entra.

            O Galaxy manda `display: inline-flex; width: auto` na linha de
            dentro. Num bloco, isso encolhe até o conteúdo: a faixa virava uma
            pílula de 216px perdida no canto. Numa coluna de flex, a linha é
            item e o `stretch` do eixo cruzado a estica; medido no navegador,
            216px viram 260px, que é a largura do trilho mais a lateral menos os
            recuos. É a forma que a foto da referência mostra.

            O recuo lateral saiu daqui e foi para o envoltório de fora, onde o
            deles também está. Sem tema nada muda: o cartão media 296px antes e
            mede 296px agora.
          */
          "flex min-h-[var(--footer-box-height)] w-full flex-col justify-center overflow-hidden rounded-[var(--footer-box-radius)] bg-painel p-2 shadow-lg shadow-sombra [--gc-recorte:var(--color-painel)]",
        )}
      >
        <VoicePanel data-gc="app.rodape-da-barra.voice-panel" accountChannelId={accountChannelId} />
        {user && <UserPanel data-gc="app.rodape-da-barra.user-panel.on-logout" user={user} guildId={guildId} onLogout={onLogout} />}
      </div>
    </div>
    </>
  );
};
