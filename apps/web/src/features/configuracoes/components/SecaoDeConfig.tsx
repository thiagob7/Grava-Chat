import React from "react";

import { anchor, type Section } from "~/features/configuracoes/components/secoes";
import { LinkButton } from "~/features/configuracoes/components/BotaoDeLink";
import { cn } from "~/lib/utils";

export const SectionContext = React.createContext<Section | null>(null);

interface ConfigPropsSection {
  id: string;
  title: string;
  detail?: string;
  className?: string;
  children: React.ReactNode;
}

export const ConfigSection: React.FC<ConfigPropsSection> = ({
  id,
  title,
  detail,
  className,
  children,
}) => {
  const currentSection = React.useContext(SectionContext);

  return (
    <section data-gc="configuracoes.secao-de-config.section"
      id={anchor(id)}
      className={cn("scroll-mt-5 mt-10 first:mt-0", className)}
    >
      <h3 data-gc="configuracoes.secao-de-config.h3" className="group/titulo flex items-center gap-1.5 text-lg font-semibold">
        {title}
        {currentSection && (
          <LinkButton data-gc="configuracoes.secao-de-config.link-button" section={currentSection} sub={id} oQue="esta seção" />
        )}
      </h3>
      {detail && <p data-gc="configuracoes.secao-de-config.p" className="mt-1 text-sm text-ink-muted">{detail}</p>}

      <div data-gc="configuracoes.secao-de-config.div" className="mt-3 border-t border-line pt-5">{children}</div>
    </section>
  );
};
