import type { Metadata } from "next";
import { Apple, Globe, Monitor } from "lucide-react";

import { Header } from "~/components/Cabecalho";
import { Footer } from "~/components/Rodape";
import { VersionPublished } from "~/components/VersaoPublicada";
import { LINK_MAC, LINK_RELEASES, LINK_WINDOWS } from "~/lib/release";

export const metadata: Metadata = {
  title: "Baixar o Gravaê",
  description: "O Gravaê para macOS e Windows, ou direto no navegador.",
};

const APP = "https://gravae-chat.vercel.app";

export default function Download() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-center text-4xl font-bold">Baixar o Gravaê</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-ink-muted">
          O aplicativo dá push-to-talk que funciona com a janela atrás, escolha
          de qual tela transmitir e aviso no Dock. O resto é igual ao navegador.
        </p>

        <p className="mt-3 text-center text-xs text-ink-faint">
          <VersionPublished />
        </p>

        <div className="mt-12 space-y-4">
          <Choice
            icon={<Apple size={22} />}
            title="macOS"
            detail="Intel e Apple Silicon no mesmo arquivo · macOS 11+"
            href={LINK_MAC}
            action="Baixar .dmg"
            notice="Na primeira vez, o macOS avisa que não conseguiu verificar o desenvolvedor: Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo. Só uma vez."
          />

          <Choice
            icon={<Monitor size={22} />}
            title="Windows"
            detail="64 bits · Windows 10 ou mais novo"
            href={LINK_WINDOWS}
            action="Baixar .exe"
            notice="Se o Windows avisar, clique em Mais informações → Executar assim mesmo. É porque o instalador não tem certificado pago."
          />

          <Choice
            icon={<Globe size={22} />}
            title="Navegador"
            detail="Funciona sem instalar nada, em qualquer sistema"
            href={APP}
            action="Abrir o Gravaê"
          />
        </div>

        <p className="mt-10 text-center text-sm text-ink-muted">
          Ainda não há aplicativo para Linux nem para celular. No Linux e no
          celular, o Gravaê roda no navegador.
        </p>

        <p className="mt-4 text-center text-sm">
          <a
            href={LINK_RELEASES}
            target="_blank"
            rel="noreferrer"
            className="text-brand underline-offset-4 hover:underline"
          >
            Ver todas as versões e o que mudou em cada uma
          </a>
        </p>

        <div className="mt-12 rounded-xl border border-line bg-surface-1 p-6">
          <h2 className="text-base font-semibold">Depois de instalar, ele se cuida</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            O aplicativo procura versão nova sozinho, baixa em segundo plano e
            avisa quando estiver pronta. Você clica em reiniciar e pronto — não
            precisa voltar aqui.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

const Choice = ({
  icon,
  title,
  detail,
  href,
  action,
  notice,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  href: string;
  action: string;
  notice?: string;
}) => (
  <div className="rounded-xl border border-line bg-surface-1 p-6">
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
      </div>

      <a
        href={href}
        className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {action}
      </a>
    </div>

    {notice && <p className="mt-4 text-xs leading-relaxed text-ink-faint">{notice}</p>}
  </div>
);
