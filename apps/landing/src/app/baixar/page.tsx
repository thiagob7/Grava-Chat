import type { Metadata } from "next";
import { Apple, Globe, Monitor } from "lucide-react";

import { Cabecalho } from "~/components/Cabecalho";
import { Rodape } from "~/components/Rodape";
import { VersaoPublicada } from "~/components/VersaoPublicada";
import { LINK_MAC, LINK_RELEASES, LINK_WINDOWS } from "~/lib/release";

export const metadata: Metadata = {
  title: "Baixar o Gravaê",
  description: "O Gravaê para macOS e Windows, ou direto no navegador.",
};

const APP = "https://gravae-chat.vercel.app";

export default function Baixar() {
  return (
    <>
      <Cabecalho />

      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-center text-4xl font-bold">Baixar o Gravaê</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-ink-muted">
          O aplicativo dá push-to-talk que funciona com a janela atrás, escolha
          de qual tela transmitir e aviso no Dock. O resto é igual ao navegador.
        </p>

        <p className="mt-3 text-center text-xs text-ink-faint">
          <VersaoPublicada />
        </p>

        <div className="mt-12 space-y-4">
          <Opcao
            icone={<Apple size={22} />}
            titulo="macOS"
            detalhe="Intel e Apple Silicon no mesmo arquivo · macOS 11+"
            href={LINK_MAC}
            acao="Baixar .dmg"
            aviso="Na primeira vez, o macOS avisa que não conseguiu verificar o desenvolvedor: Ajustes do Sistema → Privacidade e Segurança → Abrir Assim Mesmo. Só uma vez."
          />

          <Opcao
            icone={<Monitor size={22} />}
            titulo="Windows"
            detalhe="64 bits · Windows 10 ou mais novo"
            href={LINK_WINDOWS}
            acao="Baixar .exe"
            aviso="Se o Windows avisar, clique em Mais informações → Executar assim mesmo. É porque o instalador não tem certificado pago."
          />

          <Opcao
            icone={<Globe size={22} />}
            titulo="Navegador"
            detalhe="Funciona sem instalar nada, em qualquer sistema"
            href={APP}
            acao="Abrir o Gravaê"
          />
        </div>

        {/*
          Linux fica de fora do jeito honesto: dizendo que não existe, em vez de
          um botão que abre uma página vazia. O empacotamento é possível, mas
          ninguém testou — e oferecer um download que não se sabe se abre é pior
          que não oferecer.
        */}
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

      <Rodape />
    </>
  );
}

const Opcao = ({
  icone,
  titulo,
  detalhe,
  href,
  acao,
  aviso,
}: {
  icone: React.ReactNode;
  titulo: string;
  detalhe: string;
  href: string;
  acao: string;
  aviso?: string;
}) => (
  <div className="rounded-xl border border-line bg-surface-1 p-6">
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
        {icone}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{detalhe}</p>
      </div>

      <a
        href={href}
        className="shrink-0 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        {acao}
      </a>
    </div>

    {aviso && <p className="mt-4 text-xs leading-relaxed text-ink-faint">{aviso}</p>}
  </div>
);
