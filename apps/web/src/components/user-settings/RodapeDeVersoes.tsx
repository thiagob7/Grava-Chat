import React, { useEffect, useState } from "react";
import type { VersoesDoAplicativo } from "@gravae/shared";

import { Tooltip } from "~/components/ui/tooltip";
import { copiarTexto } from "~/lib/copiar";
import { desktop } from "~/lib/desktop";
import { useTranslation } from "~/traducao";

/*
  O carimbo do front, plantado no build pelo `vite.config.ts`.

  `declare` e não `import`: ele não existe em arquivo nenhum, é uma constante
  que o Vite substitui por texto na hora de empacotar. Sem esta linha o
  TypeScript não teria onde procurar por ele.
*/
declare const __VERSAO_WEB__: string;

/**
 * As versões do que está rodando, no pé da lateral das configurações.
 *
 * Existe para o dia em que alguém escreve "tá bugado aqui". A primeira
 * pergunta é sempre qual build, e a resposta costuma custar três mensagens —
 * daí ele copiar TUDO de uma vez, e não linha por linha: o que serve ao
 * suporte é o bloco inteiro colado numa mensagem só.
 *
 * No navegador só existe a linha do front. As outras três vêm do processo
 * principal do aplicativo, e fingir que existem — com um "—" ou um "n/d" —
 * seria três linhas de nada ocupando o rodapé de quem abre pelo site.
 */
export const RodapeDeVersoes: React.FC = () => {
  const { t } = useTranslation();
  const [doApp, setDoApp] = useState<VersoesDoAplicativo | null>(null);
  /// O nome vem da ponte, e não de uma chave de tradução: ele é o nome do
  /// aplicativo instalado, que não muda de idioma. Numa instalação renomeada
  /// pelo instalador, a linha diz o nome que a pessoa vê no sistema.
  const nome = desktop()?.nomeNoSistema ?? "Gravaê";
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    /*
      Duas defesas, para duas falhas diferentes — e a primeira faltava.

      1. `pedir` pode ser `undefined`. O aplicativo instalado é mais VELHO que
         este código: o front vem do site a cada abertura, a casca só troca
         quando alguém instala. Numa v0.2.4 o `versoes` não existe na ponte, e
         `ponte.versoes()` estourava na hora, de forma SÍNCRONA — derrubando as
         configurações inteiras por causa de um rodapé. O `catch` de baixo
         nunca via esse erro: quando ele acontece, não chegou a existir
         promessa.

      2. O `catch` cobre o outro caso: a ponte tem o método, mas o canal do
         outro lado rejeita. Aí o rodapé fica só com a linha do front, que é
         degradar direito.
    */
    const pedir = desktop()?.versoes;
    if (!pedir) return;

    let vivo = true;

    void pedir()
      .then((v) => vivo && setDoApp(v))
      .catch(() => undefined);

    return () => {
      vivo = false;
    };
  }, []);

  const linhas = [
    ...(doApp
      ? [
          `${nome} ${doApp.app}`,
          `Electron ${doApp.electron}`,
          `Chromium ${doApp.chrome}`,
          doApp.sistema,
        ]
      : []),
    `Web ${__VERSAO_WEB__}`,
  ];

  const copiar = () => {
    void copiarTexto(linhas.join("\n")).then((deu) => {
      if (!deu) return;

      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    });
  };

  return (
    <Tooltip
      label={t(copiado ? "configuracoes.versoes.copiado" : "configuracoes.versoes.copiar")}
      side="top"
    >
      {/*
        Botão, e não um bloco de texto com `onClick`.

        Quatro linhas de versão não são um controle óbvio; sem o `title`, o
        `aria-label` e o foco do teclado, quem não vê a dica do mouse não tem
        como descobrir que dá pra clicar. E quem navega por teclado não teria
        como chegar nele de jeito nenhum.
      */}
      <button
        type="button"
        onClick={copiar}
        aria-label={t("configuracoes.versoes.copiar")}
        className="mt-1 block w-full rounded-md px-2.5 py-2 text-left text-11 leading-[1.45] text-ink-faint transition hover:bg-hover hover:text-ink-muted"
      >
        {linhas.map((linha) => (
          <span key={linha} className="block tabular-nums">
            {linha}
          </span>
        ))}
      </button>
    </Tooltip>
  );
};
