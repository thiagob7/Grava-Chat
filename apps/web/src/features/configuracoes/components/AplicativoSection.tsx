import React from "react";
import { Apple, Download, Monitor } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

const BASE = "https://github.com/thiagob7/Grava-Chat/releases/latest/download";

const MAC = `${BASE}/gravae-chat-mac.dmg`;
const WINDOWS = `${BASE}/gravae-chat-win.exe`;

function ehWindows(): boolean {
  if (typeof navigator === "undefined") return false;

  return /win/i.test(navigator.userAgent);
}

export const AplicativoSection: React.FC = () => (
  <div>
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
