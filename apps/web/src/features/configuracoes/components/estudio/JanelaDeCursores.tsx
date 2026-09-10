import React, { Suspense } from "react";

import { FloatingWindow } from "~/components/ui/floating-window";
import { useJanelaDeCursores } from "~/features/configuracoes/stores/janela-de-cursores";

/*
  Os 48 desenhos dos conjuntos viram data URI no pacote, uns 250 KB. Carregados
  junto do app, todo mundo pagaria por eles — inclusive quem nunca abre esta
  tela. Sob demanda, quem paga é quem entra.
*/
const CursoresSection = React.lazy(() =>
  import("~/features/configuracoes/components/CursoresSection").then((m) => ({
    default: m.CursoresSection,
  })),
);

export const JanelaDeCursores: React.FC = () => {
  const aberto = useJanelaDeCursores((s) => s.aberto);
  const fechar = useJanelaDeCursores((s) => s.fechar);

  return (
    <FloatingWindow data-gc="configuracoes.estudio.janela-de-cursores.floating-window.fechar" id="cursores" title="Cursores" open={aberto} onClose={fechar}>
      <div data-gc="configuracoes.estudio.janela-de-cursores.div" className="min-h-0 flex-1 overflow-y-auto p-5">
        <Suspense fallback={<Carregando data-gc="configuracoes.estudio.janela-de-cursores.carregando" />}>
          <CursoresSection data-gc="configuracoes.estudio.janela-de-cursores.cursores-section" />
        </Suspense>
      </div>
    </FloatingWindow>
  );
};

const Carregando: React.FC = () => (
  <p data-gc="configuracoes.estudio.janela-de-cursores.p" className="p-4 text-sm text-ink-faint">Carregando os cursores…</p>
);
