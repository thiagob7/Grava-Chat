import React from "react";

import { ancora, type Secao } from "~/components/user-settings/secoes";
import { BotaoDeLink } from "~/components/user-settings/BotaoDeLink";
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
    <section
      id={ancora(id)}
      className={cn("scroll-mt-5 mt-10 first:mt-0", className)}
    >
      <h3 className="group/titulo flex items-center gap-1.5 text-lg font-semibold">
        {titulo}
        {secaoAtual && (
          <BotaoDeLink secao={secaoAtual} sub={id} oQue="esta seção" />
        )}
      </h3>
      {detalhe && <p className="mt-1 text-sm text-ink-muted">{detalhe}</p>}

      <div className="mt-3 border-t border-line pt-5">{children}</div>
    </section>
  );
};
