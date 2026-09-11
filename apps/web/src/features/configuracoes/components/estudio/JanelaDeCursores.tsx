import React, { Suspense } from "react";

import { FloatingWindow } from "~/components/ui/floating-window";
import { useCursorsWindow } from "~/features/configuracoes/stores/janela-de-cursores";

/*
  Os 48 desenhos dos conjuntos viram data URI no pacote, uns 250 KB. Carregados
  junto do app, todo mundo pagaria por eles — inclusive quem nunca abre esta
  tela. Sob demanda, quem paga é quem entra.
*/
const CursorsSection = React.lazy(() =>
  import("~/features/configuracoes/components/CursoresSection").then((m) => ({
    default: m.CursorsSection,
  })),
);

export const CursorsWindow: React.FC = () => {
  const isOpen = useCursorsWindow((s) => s.isOpen);
  const close = useCursorsWindow((s) => s.close);

  return (
    <FloatingWindow data-gc="configuracoes.estudio.janela-de-cursores.floating-window.close" id="cursores" title="Cursores" open={isOpen} onClose={close}>
      <div data-gc="configuracoes.estudio.janela-de-cursores.div" className="min-h-0 flex-1 overflow-y-auto p-5">
        <Suspense fallback={<Loading data-gc="configuracoes.estudio.janela-de-cursores.loading" />}>
          <CursorsSection data-gc="configuracoes.estudio.janela-de-cursores.cursors-section" />
        </Suspense>
      </div>
    </FloatingWindow>
  );
};

const Loading: React.FC = () => (
  <p data-gc="configuracoes.estudio.janela-de-cursores.p" className="p-4 text-sm text-ink-faint">Carregando os cursores…</p>
);
