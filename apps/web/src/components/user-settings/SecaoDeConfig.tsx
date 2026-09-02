import React from "react";

import { ancora } from "~/components/user-settings/secoes";
import { cn } from "~/lib/utils";

interface SecaoDeConfigProps {
  /// o mesmo id que a lateral usa em `SUBSECOES`
  id: string;
  titulo: string;
  detalhe?: string;
  className?: string;
  children: React.ReactNode;
}

/*
  Uma seção de configuração, com título grande e um fio acima separando da
  anterior.

  O título era uma etiqueta minúscula em CAIXA ALTA e cinza — o tipo de rótulo
  que se lê letra por letra e some no meio dos controles. Numa tela de rolar,
  é justamente o título que precisa ser encontrável de relance, porque é ele
  que diz onde você está.

  `scroll-mt-5` é o que faz a rolagem vinda da lateral parar com respiro em vez
  de colar o título na borda de cima do painel.
*/
export const SecaoDeConfig: React.FC<SecaoDeConfigProps> = ({
  id,
  titulo,
  detalhe,
  className,
  children,
}) => (
  <section
    id={ancora(id)}
    className={cn("scroll-mt-5 border-t border-line pt-8 first:border-t-0 first:pt-0", className)}
  >
    <h3 className="text-lg font-semibold">{titulo}</h3>
    {detalhe && <p className="mt-1 text-sm text-ink-muted">{detalhe}</p>}
    <div className="mt-4">{children}</div>
  </section>
);
