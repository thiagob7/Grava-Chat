import React from "react";
import { Apple, Download, Loader2, Monitor, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { ehDesktop } from "~/lib/desktop";
import { useAtualizacao } from "~/hooks/use-atualizacao";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";

/*
  Onde mora o instalador: a página de releases do repositório. `latest` sempre
  aponta pra versão mais nova, então este link não precisa ser trocado a cada
  publicação — só a release nova é que sai.
*/
const BASE = "https://github.com/thiagob7/Grava-Chat/releases/latest/download";

/// `latest/download/<nome>` serve sempre o arquivo da versão mais nova, desde
/// que o nome não mude — por isso o `artifactName` fixo no electron-builder.
const MAC = `${BASE}/gravae-chat-mac.dmg`;
const WINDOWS = `${BASE}/gravae-chat-win.exe`;

/*
  Qual sistema a pessoa está usando agora. Serve só pra ordenar os cartões — o
  de baixo continua acessível, porque é comum baixar num computador pra instalar
  noutro. Esconder o outro sistema seria decidir demais por quem está lendo.
*/
function ehWindows(): boolean {
  if (typeof navigator === "undefined") return false;

  return /win/i.test(navigator.userAgent);
}

export const AplicativoSection: React.FC = () => (
  <div>
    {/*
      No aplicativo instalado, a atualização vem PRIMEIRO.

      Quem já baixou não precisa dos links de download — precisa saber em que
      versão está e ter como instalar a nova. Antes isso só existia no botão
      pontilhado do trilho, que aparece apenas quando já há novidade detectada:
      sem novidade, não havia como conferir a versão nem pedir pra procurar, e
      quem dispensava a faixa flutuante ficava sem caminho nenhum.
    */}
    {ehDesktop() && <Atualizacao />}

    <Secao
      id="baixar"
      titulo="Aplicativo de desktop"
      detalhe="A mesma conta e as mesmas conversas, numa janela só. Push-to-talk global e compartilhamento de tela funcionam melhor por aqui do que no navegador."
    >
    <div className={cn("flex flex-col gap-3", ehWindows() && "flex-col-reverse")}>
      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Apple size={16} /> macOS — Intel e Apple Silicon
        </p>

        <Button asChild className="mt-3 w-full">
          <a href={MAC}>
            <Download size={16} /> Baixar
          </a>
        </Button>

        {/*
          Este aviso não é detalhe: sem conta de desenvolvedor da Apple o app
          não é notarizado, e o macOS recusa a primeira abertura com uma
          mensagem que parece "app quebrado". Quem lê isto antes não desinstala
          achando que é.
        */}
        <p className="mt-3 text-xs text-ink-faint">
          Na primeira vez: <b>Ajustes do Sistema → Privacidade e Segurança →
          Abrir Assim Mesmo</b>.
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

        {/* Mesma história do macOS, outro guardião: sem certificado de
            assinatura o SmartScreen barra a primeira execução. */}
        <p className="mt-3 text-xs text-ink-faint">
          Se o Windows avisar, clique em <b>Mais informações → Executar assim
          mesmo</b>.
        </p>
      </div>
    </div>
    </Secao>
  </div>
);

/*
  A versão instalada e o caminho até a próxima.

  Os três botões nunca aparecem juntos porque cada fase tem UMA ação sensata:
  procurar quando não se sabe, baixar quando há novidade, instalar quando o
  arquivo já está no disco. Mostrar os três com dois apagados faria a pessoa
  ler três coisas pra descobrir qual vale.
*/
const Atualizacao: React.FC = () => {
  const { estado, ponte, baixando, pronta } = useAtualizacao();

  if (!ponte) {
    /// Aplicativo anterior à v0.2.0: a ponte não tem esta parte. Dizer isso é
    /// melhor que esconder — é justamente quem mais precisa atualizar.
    return (
      <Secao id="atualizacao" titulo="Atualização">
        <p className="text-sm text-ink-muted">
          Esta versão do aplicativo não sabe se atualizar sozinha. Baixe o instalador mais novo
          abaixo e instale por cima.
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
            {pronta
              ? `Versão ${estado?.disponivel} pronta para instalar`
              : baixando
                ? `Baixando a versão ${estado?.disponivel}…`
                : temNovidade
                  ? `Saiu a versão ${estado?.disponivel}`
                  : estado?.fase === "procurando"
                    ? "Procurando…"
                    : "Você está em dia"}
          </p>

          <p className="mt-0.5 text-xs text-ink-faint">
            {pronta
              ? "O aplicativo fecha, troca a versão e reabre sozinho. Sai da chamada se você estiver em uma."
              : estado?.fase === "erro"
                ? (estado.erro ?? "Não consegui falar com o servidor de versões.")
                : "O aplicativo procura sozinho na abertura e a cada seis horas."}
          </p>

          {baixando && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-trilho">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.round((estado?.progresso ?? 0) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {pronta ? (
          <Button onClick={() => void ponte.instalar()}>
            <RefreshCw size={16} /> Instalar e reiniciar
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
