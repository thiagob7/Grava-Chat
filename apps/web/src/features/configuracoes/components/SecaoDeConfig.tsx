import React from "react";

import { ancora, type Secao } from "~/features/configuracoes/components/secoes";
import { BotaoDeLink } from "~/features/configuracoes/components/BotaoDeLink";
import { cn } from "~/lib/utils";

export const ContextoDaSecao = React.createContext<Secao | null>(null);

interface SecaoDeConfigProps {
  id: string;
  titulo: string;
  detalhe?: string;
  className?: string;
  children: React.ReactNode;
}

export const SecaoDeConfig: React.FC<SecaoDeConfigProps> = ({
  id,
  titulo,
  detalhe,
  className,
  children,
}) => {
  const secaoAtual = React.useContext(ContextoDaSecao);

  return (
    <section data-gc="configuracoes.secao-de-config.section"
      id={ancora(id)}
      className={cn("scroll-mt-5 mt-10 first:mt-0", className)}
    >
      <h3 data-gc="configuracoes.secao-de-config.h3" className="group/titulo flex items-center gap-1.5 text-lg font-semibold">
        {titulo}
        {secaoAtual && (
          <BotaoDeLink data-gc="configuracoes.secao-de-config.botao-de-link" secao={secaoAtual} sub={id} oQue="esta seção" />
        )}
      </h3>
      {detalhe && <p data-gc="configuracoes.secao-de-config.p" className="mt-1 text-sm text-ink-muted">{detalhe}</p>}

      <div data-gc="configuracoes.secao-de-config.div" className="mt-3 border-t border-line pt-5">{children}</div>
    </section>
  );
};
