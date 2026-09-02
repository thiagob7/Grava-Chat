import React from "react";
import { Apple, Download, Monitor } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

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
  <div className="max-w-xl space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Aplicativo de desktop</h2>
      <p className="mt-1 text-sm text-ink-muted">
        A mesma conta e as mesmas conversas, numa janela só. Push-to-talk global
        e compartilhamento de tela funcionam melhor por aqui do que no navegador.
      </p>
    </div>

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

  </div>
);
