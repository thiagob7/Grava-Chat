import React from "react";
import { Apple, Download, Loader2, Monitor, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ehDesktop } from "~/lib/desktop";
import { useAtualizacao } from "~/hooks/use-atualizacao";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";

const BASE = "https://github.com/thiagob7/Grava-Chat/releases/latest/download";

const MAC = `${BASE}/gravae-chat-mac.dmg`;
const WINDOWS = `${BASE}/gravae-chat-win.exe`;

function ehWindows(): boolean {
  if (typeof navigator === "undefined") return false;

  return /win/i.test(navigator.userAgent);
}

export const AplicativoSection: React.FC = () => (
  <div>
    {ehDesktop() && <Atualizacao />}

    <Secao
      id="baixar"
      titulo="Aplicativo de desktop"
      detalhe="A mesma conta e as mesmas conversas, numa janela só. Push-to-talk global e compartilhamento de tela funcionam melhor por aqui do que no navegador."
    >
      <div
        className={cn("flex flex-col gap-3", ehWindows() && "flex-col-reverse")}
      >
        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Apple size={16} /> macOS — Intel e Apple Silicon
          </p>

          <Button asChild className="mt-3 w-full">
            <a href={MAC}>
              <Download size={16} /> Baixar
            </a>
          </Button>

          <p className="mt-3 text-xs text-ink-faint">
            Na primeira vez:{" "}
            <b>
              Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo
            </b>
            .
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface-2 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Monitor size={16} /> Windows — 64 bits
          </p>

          <Button asChild className="mt-3 w-full">
            <a href={WINDOWS}>
              <Download size={16} /> Baixar
            </a>
          </Button>

          <p className="mt-3 text-xs text-ink-faint">
            Se o Windows avisar, clique em{" "}
            <b>Mais informações → Executar assim mesmo</b>.
          </p>
        </div>
      </div>
    </Secao>
  </div>
);

const Atualizacao: React.FC = () => {
  const { estado, ponte, baixando, pronta, instalando } = useAtualizacao();

  if (!ponte) {
    return (
      <Secao id="atualizacao" titulo="Atualização">
        <p className="text-sm text-ink-muted">
          Esta versão do aplicativo não sabe se atualizar sozinha. Baixe o
          instalador mais novo abaixo e instale por cima.
        </p>
      </Secao>
    );
  }

  const temNovidade = Boolean(estado?.disponivel);

  return (
    <Secao
      id="atualizacao"
      titulo="Atualização"
      detalhe={estado ? `Você está na versão ${estado.atual}.` : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
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

          <p
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
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-trilho">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.round((estado?.progresso ?? 0) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {instalando ? (
          <Button variant="surface" disabled>
            <Loader2 size={16} className="animate-spin" /> Instalando
          </Button>
        ) : pronta ? (
          <Button onClick={() => void ponte.instalar()}>
            <RefreshCw size={16} />{" "}
            {estado?.erro ? "Tentar de novo" : "Instalar e reiniciar"}
          </Button>
        ) : baixando ? (
          <Button variant="surface" disabled>
            <Loader2 size={16} className="animate-spin" /> Baixando
          </Button>
        ) : temNovidade ? (
          <Button onClick={() => void ponte.baixar()}>
            <Download size={16} /> Baixar
          </Button>
        ) : (
          <Button
            variant="surface"
            disabled={estado?.fase === "procurando"}
            onClick={() => void ponte.procurar()}
          >
            <RefreshCw size={16} /> Procurar
          </Button>
        )}
      </div>
    </Secao>
  );
};
