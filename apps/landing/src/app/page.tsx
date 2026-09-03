import {
  Cast,
  Hash,
  Mic,
  Server,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { BotoesDeDownload } from "~/components/BotoesDeDownload";
import { Cabecalho } from "~/components/Cabecalho";
import { PalcoDoApp } from "~/components/PalcoDoApp";
import { Rodape } from "~/components/Rodape";
import { VersaoPublicada } from "~/components/VersaoPublicada";

/*
  Só entra aqui o que o Gravaê JÁ faz.

  A tentação de uma página dessas é anunciar o roteiro: app de celular, região
  de voz nos seis continentes, trinta idiomas. Quem baixa por causa disso abre
  o app e descobre que não existe — e a primeira impressão que sobra não é
  "faltou", é "mentiram". Cada linha abaixo corresponde a algo que está no
  código hoje.
*/
const RECURSOS: { icone: LucideIcon; titulo: string; itens: string[] }[] = [
  {
    icone: Hash,
    titulo: "Conversa",
    itens: [
      "Servidores com canais de texto e de voz",
      "Conversas privadas entre duas pessoas",
      "Anexos, imagens, GIFs e prévia de links",
      "Reações, respostas e mensagens fixadas",
    ],
  },
  {
    icone: Mic,
    titulo: "Voz",
    itens: [
      "Chamada em grupo no canal, ou direto no privado",
      "Supressão de ruído que roda no seu aparelho",
      "Push-to-talk que funciona com o app em segundo plano",
      "Volume por pessoa, e silenciar só pra você",
    ],
  },
  {
    icone: Cast,
    titulo: "Vídeo e tela",
    itens: [
      "Câmera na chamada, com grade ou destaque",
      "Transmissão de tela ou de uma janela só",
      "Janelinha flutuante pra continuar assistindo",
      "Som do sistema junto com a tela",
    ],
  },
  {
    icone: ShieldCheck,
    titulo: "Moderação",
    itens: [
      "Cargos com permissões por canal",
      "Expulsar, banir e castigo temporário",
      "Registro de auditoria do que foi feito",
      "Filtro automático de conteúdo",
    ],
  },
  {
    icone: Sparkles,
    titulo: "Do seu jeito",
    itens: [
      "Perfil com foto, faixa e enfeites",
      "Emojis e figurinhas do servidor",
      "Temas e cor de destaque",
      "Bots por webhook",
    ],
  },
  {
    icone: Server,
    titulo: "Nosso, de verdade",
    itens: [
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
      <Cabecalho />

      <main>
        <section className="relative overflow-hidden px-6 pb-8 pt-20 text-center sm:pt-24">
          <div className="mx-auto max-w-3xl">
            {/*
              A tarja em vez da linha solta de antes.

              A bolinha verde não é enfeite: é a mesma cor de "no ar" da página
              de status, e dizer que o serviço está de pé logo antes do botão de
              baixar responde a pergunta que todo mundo faz sem escrever.
            */}
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
              <BotoesDeDownload />
            </div>

            <p className="mt-4 text-xs text-ink-faint">
              <VersaoPublicada /> · Windows e macOS
            </p>
          </div>

          <PalcoDoApp />

          {/*
            O brilho vermelho atrás do título fica ATRÁS do conteúdo e sem
            captura de clique: é decoração, e decoração que rouba o clique do
            botão de baixar seria um autogol.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]"
          />

          {/* A grade vive ABAIXO do brilho (`-z-20` contra `-z-10`): por cima
              dele, os fios cortariam o borrão e ele deixaria de parecer luz. */}
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
              {RECURSOS.map(({ icone: Icone, titulo, itens }) => (
                <div key={titulo} className="rounded-xl border border-line bg-surface-2 p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Icone size={20} />
                  </span>

                  <h3 className="mt-4 text-base font-semibold">{titulo}</h3>

                  <ul className="mt-3 space-y-2">
                    {itens.map((item) => (
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
              <BotoesDeDownload />
            </div>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
