import React from "react";

import { ancora, type Secao } from "~/components/user-settings/secoes";
import { BotaoDeLink } from "~/components/user-settings/BotaoDeLink";
import { cn } from "~/lib/utils";

/*
  De que tela esta seção faz parte.

  Vem por contexto e não por prop porque quem desenha a seção — a tela de
  Aparência, a de Voz — não sabe o próprio nome na navegação: ela é montada
  pelo modal, que é quem sabe. Enfiar o id em cada `<Secao>` seria repetir a
  mesma informação onze vezes, com onze chances de errar.
*/
export const ContextoDaSecao = React.createContext<Secao | null>(null);

interface SecaoDeConfigProps {
  /// o mesmo id que a lateral usa em `SUBSECOES`
  id: string;
  titulo: string;
  detalhe?: string;
  className?: string;
  children: React.ReactNode;
}

/*
  Uma seção de configuração: título grande, descrição e um fio fechando o
  cabeçalho.

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

      {/*
      O fio fica ABAIXO do título, fechando o cabeçalho da seção — e não entre
      uma seção e outra. É a diferença entre "isto começa aqui" e "isto acabou
      ali": com o traço em cima, o título parecia pertencer ao que vinha antes.

      Nenhum fio entre itens. A linha marca seção; um traço a cada interruptor
      transforma a tela numa tabela, e o olho passa a contar linhas em vez de
      ler nomes.
    */}
      <div className="mt-3 border-t border-line pt-5">{children}</div>
    </section>
  );
};
