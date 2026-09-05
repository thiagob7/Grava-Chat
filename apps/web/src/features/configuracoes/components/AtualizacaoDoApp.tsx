import React from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useAtualizacao } from "~/features/app/hooks/use-atualizacao";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

export const AtualizacaoDoApp: React.FC = () => {
  const { estado, ponte, baixando, pronta, instalando } = useAtualizacao();

  if (!ponte) {
    return (
      <Secao data-gc="configuracoes.atualizacao-do-app.secao" id="atualizacao" titulo="Atualização">
        <p data-gc="configuracoes.atualizacao-do-app.p" className="text-sm text-ink-muted">
          Esta versão do aplicativo não sabe se atualizar sozinha. Baixe o
          instalador mais novo abaixo e instale por cima.
        </p>
      </Secao>
    );
  }

  const temNovidade = Boolean(estado?.disponivel);

  return (
    <Secao data-gc="configuracoes.atualizacao-do-app.secao--2"
      id="atualizacao"
      titulo="Atualização"
      detalhe={estado ? `Você está na versão ${estado.atual}.` : undefined}
    >
      <div data-gc="configuracoes.atualizacao-do-app.div" className="flex items-start gap-4">
        <div data-gc="configuracoes.atualizacao-do-app.div--2" className="min-w-0 flex-1">
          <p data-gc="configuracoes.atualizacao-do-app.p--2" className="text-sm font-medium">
            {instalando
              ? `Instalando a versão ${estado?.disponivel}…`
              : pronta
                ? `Versão ${estado?.disponivel} pronta para instalar`
                : baixando
                  ? `Baixando a versão ${estado?.disponivel}…`
                  : temNovidade
                    ? `Saiu a versão ${estado?.disponivel}`
                    : estado?.fase === "procurando"
                      ? "Procurando…"
                      : "Você está em dia"}
          </p>

          <p data-gc="configuracoes.atualizacao-do-app.p--3"
            className={cn(
              "mt-0.5 text-xs",
              estado?.erro ? "text-danger" : "text-ink-faint",
            )}
          >
            {estado?.erro
              ? estado.erro
              : instalando
                ? "O aplicativo vai fechar em instantes."
                : pronta
                  ? "O aplicativo fecha, troca a versão e reabre sozinho. Sai da chamada se você estiver em uma."
                  : estado?.fase === "erro"
                    ? "Não consegui falar com o servidor de versões."
                    : "O aplicativo procura sozinho na abertura e a cada seis horas."}
          </p>

          {baixando && (
            <div data-gc="configuracoes.atualizacao-do-app.div--3" className="mt-2 h-1 w-full overflow-hidden rounded-full bg-trilho">
              <div data-gc="configuracoes.atualizacao-do-app.div--4"
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.round((estado?.progresso ?? 0) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {instalando ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button" variant="surface" disabled>
            <Loader2 data-gc="configuracoes.atualizacao-do-app.loader2" size={16} className="animate-spin" /> Instalando
          </Button>
        ) : pronta ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--2" onClick={() => void ponte.instalar()}>
            <RefreshCw data-gc="configuracoes.atualizacao-do-app.refresh-cw" size={16} />{" "}
            {estado?.erro ? "Tentar de novo" : "Instalar e reiniciar"}
          </Button>
        ) : baixando ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--3" variant="surface" disabled>
            <Loader2 data-gc="configuracoes.atualizacao-do-app.loader2--2" size={16} className="animate-spin" /> Baixando
          </Button>
        ) : temNovidade ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--4" onClick={() => void ponte.baixar()}>
            <Download data-gc="configuracoes.atualizacao-do-app.download" size={16} /> Baixar
          </Button>
        ) : (
          <Button data-gc="configuracoes.atualizacao-do-app.button--5"
            variant="surface"
            disabled={estado?.fase === "procurando"}
            onClick={() => void ponte.procurar()}
          >
            <RefreshCw data-gc="configuracoes.atualizacao-do-app.refresh-cw--2" size={16} /> Procurar
          </Button>
        )}
      </div>
    </Secao>
  );
};
