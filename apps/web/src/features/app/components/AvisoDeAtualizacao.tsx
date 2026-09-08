import React from "react";
import { CircleArrowUp, Download, Loader2, PackageCheck, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useAtualizacao } from "~/features/app/hooks/use-atualizacao";
import { cn } from "~/lib/utils";

export const AvisoDeAtualizacao: React.FC = () => {
  const { estado, ponte, temNovidade, baixando, pronta, instalando } = useAtualizacao();

  if (!estado || !temNovidade) return null;

  /*
    `pointer-events-none` no envoltório: ele atravessa a tela inteira e, sem
    isso, come o clique do cabeçalho atrás dele mesmo sendo invisível. Só a
    pílula recebe o mouse de volta.

    E `regiao-sem-arrasto` na pílula: ela pousa em cima do topo do canal, que é
    área de arrastar a janela — e área de arrastar engole clique. Era por isso
    que o botão "Reiniciar agora" não respondia.
  */
  return (
    <div data-gc="app.aviso-de-atualizacao.div"
      className={cn("pointer-events-none fixed inset-x-0 z-50 flex justify-center", "top-10")}
    >
      <div data-gc="app.aviso-de-atualizacao.div--2" className="regiao-sem-arrasto pointer-events-auto flex items-center gap-3 rounded-full bg-surface-0 py-1.5 pl-4 pr-1.5 text-xs shadow-lg ring-1 ring-line">
        <span data-gc="app.aviso-de-atualizacao.span" className="flex max-w-sm items-center gap-2">
          {estado.erro ? (
            <TriangleAlert data-gc="app.aviso-de-atualizacao.triangle-alert" size={14} className="shrink-0 text-danger" />
          ) : pronta || instalando ? (
            <PackageCheck data-gc="app.aviso-de-atualizacao.package-check" size={14} className="shrink-0 text-online" />
          ) : (
            <CircleArrowUp data-gc="app.aviso-de-atualizacao.circle-arrow-up" size={14} className="shrink-0 text-brand" />
          )}
          {estado.erro ? (
            <span data-gc="app.aviso-de-atualizacao.span--2" className="text-danger">{estado.erro}</span>
          ) : instalando ? (
            <>Instalando a versão {estado.disponivel}…</>
          ) : pronta ? (
            <>
              Versão <b data-gc="app.aviso-de-atualizacao.b">{estado.disponivel}</b> pronta para instalar
            </>
          ) : baixando ? (
            <>Baixando a versão {estado.disponivel}… {Math.round(estado.progresso * 100)}%</>
          ) : (
            <>
              Saiu a versão <b data-gc="app.aviso-de-atualizacao.b--2">{estado.disponivel}</b>
            </>
          )}
        </span>

        {baixando ? (
          <span data-gc="app.aviso-de-atualizacao.span--3" className="h-1 w-24 overflow-hidden rounded-full bg-surface-3">
            <span data-gc="app.aviso-de-atualizacao.span--4"
              className="block h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.round(estado.progresso * 100)}%` }}
            />
          </span>
        ) : instalando ? (
          <Button data-gc="app.aviso-de-atualizacao.button" size="sm" disabled>
            <Loader2 data-gc="app.aviso-de-atualizacao.loader2" size={13} className="animate-spin" /> Instalando…
          </Button>
        ) : pronta ? (
          <Button data-gc="app.aviso-de-atualizacao.button--2" size="sm" onClick={() => void ponte?.instalar()}>
            <RotateCw data-gc="app.aviso-de-atualizacao.rotate-cw" size={13} /> {estado.erro ? "Tentar de novo" : "Reiniciar agora"}
          </Button>
        ) : (
          <Button data-gc="app.aviso-de-atualizacao.button--3" variant="surface" size="sm" onClick={() => void ponte?.baixar()}>
            <Download data-gc="app.aviso-de-atualizacao.download" size={13} /> Baixar
          </Button>
        )}
      </div>
    </div>
  );
};
