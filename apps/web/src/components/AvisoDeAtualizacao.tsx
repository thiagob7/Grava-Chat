import React from "react";
import { Download, RotateCw, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useAtualizacao } from "~/hooks/use-atualizacao";
import { cn } from "~/lib/utils";

/*
  A faixa que avisa que saiu versão nova do aplicativo.

  Ela mora AQUI, no site, e não numa janela nativa: o site se atualiza sozinho,
  então o texto e o desenho disto podem melhorar sem obrigar ninguém a instalar
  de novo. Na casca fica só o motor — checar, baixar e trocar o app —, que é o
  que o site não tem como fazer.

  O aplicativo baixa sozinho assim que encontra versão nova, então na prática
  esta faixa aparece direto em "pronta": clicou, reinicia, acabou.
*/
export const AvisoDeAtualizacao: React.FC = () => {
  const { estado, ponte, temNovidade, baixando, pronta } = useAtualizacao();

  if (!estado || !temNovidade) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 flex justify-center",
        /// abaixo da faixa de título do aplicativo, que tem 32px
        "top-10",
      )}
    >
      <div className="flex items-center gap-3 rounded-full bg-surface-0 py-1.5 pl-4 pr-1.5 text-xs shadow-lg ring-1 ring-line">
        <span className="flex items-center gap-2">
          <Sparkles size={14} className="text-brand" />
          {pronta ? (
            <>
              Versão <b>{estado.disponivel}</b> pronta para instalar
            </>
          ) : baixando ? (
            <>Baixando a versão {estado.disponivel}… {Math.round(estado.progresso * 100)}%</>
          ) : (
            <>
              Saiu a versão <b>{estado.disponivel}</b>
            </>
          )}
        </span>

        {baixando ? (
          <span className="h-1 w-24 overflow-hidden rounded-full bg-surface-3">
            <span
              className="block h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.round(estado.progresso * 100)}%` }}
            />
          </span>
        ) : pronta ? (
          <Button size="sm" onClick={() => void ponte?.instalar()}>
            <RotateCw size={13} /> Reiniciar agora
          </Button>
        ) : (
          <Button variant="surface" size="sm" onClick={() => void ponte?.baixar()}>
            <Download size={13} /> Baixar
          </Button>
        )}
      </div>
    </div>
  );
};
