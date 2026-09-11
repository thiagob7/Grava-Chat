import {
  Cast,
  Hash,
  Mic,
  Server,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { DownloadButtons } from "~/components/BotoesDeDownload";
import { Header } from "~/components/Cabecalho";
import { AppStage } from "~/components/PalcoDoApp";
import { Footer } from "~/components/Rodape";
import { VersionPublished } from "~/components/VersaoPublicada";

const RESOURCES: { icon: LucideIcon; title: string; items: string[] }[] = [
  {
    icon: Hash,
    title: "Conversa",
    items: [
      "Servidores com canais de texto e de voz",
      "Conversas privadas entre duas pessoas",
      "Anexos, imagens, GIFs e prévia de links",
      "Reações, respostas e mensagens fixadas",
    ],
  },
  {
    icon: Mic,
    title: "Voz",
    items: [
      "Chamada em grupo no canal, ou direto no privado",
      "Supressão de ruído que roda no seu aparelho",
      "Push-to-talk que funciona com o app em segundo plano",
      "Volume por pessoa, e silenciar só pra você",
    ],
  },
  {
    icon: Cast,
    title: "Vídeo e tela",
    items: [
      "Câmera na chamada, com grade ou destaque",
      "Transmissão de tela ou de uma janela só",
      "Janelinha flutuante pra continuar assistindo",
      "Som do sistema junto com a tela",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Moderação",
    items: [
      "Cargos com permissões por canal",
      "Expulsar, banir e castigo temporário",
      "Registro de auditoria do que foi feito",
      "Filtro automático de conteúdo",
    ],
  },
  {
    icon: Sparkles,
    title: "Do seu jeito",
    items: [
      "Perfil com foto, faixa e enfeites",
      "Emojis e figurinhas do servidor",
      "Temas e cor de destaque",
      "Bots por webhook",
    ],
  },
  {
    icon: Server,
    title: "Nosso, de verdade",
    items: [
      "Código aberto, do servidor ao aplicativo",
      "Servidor de voz próprio, não alugado",
      "Sem anúncio e sem venda de dado",
      "O aplicativo se atualiza sozinho",
    ],
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <section className="relative overflow-hidden px-6 pb-8 pt-20 text-center sm:pt-24">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-1 px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="size-1.5 rounded-full bg-online" />
              Feito no Brasil, para conversar
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">
              O lugar dos seus amigos,
              <br />{" "}
              <span className="bg-gradient-to-b from-white to-ink-muted bg-clip-text text-transparent">
                sem alugar de ninguém
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
              Conversa, chamada de voz, vídeo e transmissão de tela. De graça,
              sem anúncio, e com o código todo aberto — inclusive o servidor de
              voz, que é nosso.
            </p>

            <div className="mt-8">
              <DownloadButtons />
            </div>

            <p className="mt-4 text-xs text-ink-faint">
              <VersionPublished /> · Windows e macOS
            </p>
          </div>

          <AppStage />

          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
          />

          <div aria-hidden className="grade-do-heroi pointer-events-none absolute inset-0 -z-20" />
        </section>

        <section id="recursos" className="bg-surface-1 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold">O que ele já faz</h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-ink-muted">
              Tudo aqui está pronto e funcionando hoje. O que ainda não existe
              não está nesta lista.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RESOURCES.map(({ icon: Icon, title, items }) => (
                <div key={title} className="rounded-xl border border-line bg-surface-2 p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Icon size={20} />
                  </span>

                  <h3 className="mt-4 text-base font-semibold">{title}</h3>

                  <ul className="mt-3 space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fundo-da-marca px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-white">Chama a galera</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">
              Instale o aplicativo ou abra no navegador e comece a conversar.
              Criar conta é de graça e nunca pedimos cartão.
            </p>

            <div className="mt-8">
              <DownloadButtons />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
