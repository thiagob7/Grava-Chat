import React from "react";

import { cn } from "~/lib/utils";

/*
  O "não tem nada aqui" das telas de configuração.

  Sem caixa tracejada em volta: a tela vazia já é o espaço, e a moldura só
  deixava a mensagem com cara de campo de soltar arquivo.
*/
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => (
  <div data-gc="ui.empty-state.div" className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
    <span data-gc="ui.empty-state.span" className="text-ink-muted [&_svg]:size-10" aria-hidden>
      {icon}
    </span>
    <p data-gc="ui.empty-state.p" className="mt-4 text-base font-semibold text-ink">{title}</p>
    {description && <p data-gc="ui.empty-state.p--2" className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p>}
    {action && <div data-gc="ui.empty-state.div--2" className="mt-5">{action}</div>}
  </div>
);
