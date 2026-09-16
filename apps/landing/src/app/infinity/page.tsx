import type { Metadata } from "next";
import { Check, CreditCard, Gift, Minus, QrCode } from "lucide-react";

import { Footer } from "~/components/Rodape";
import { Header } from "~/components/Cabecalho";
import { BRAND } from "~/lib/brand";

const APP = "https://gravae-chat.vercel.app";

export const metadata: Metadata = {
  title: `Infinity — o plano pago do ${BRAND}`,
  description:
    "R$ 18,00 por mês ou R$ 185,00 por ano. Anexos de 500 MB, tela em 1080p60, cores do aplicativo e mais. Cartão ou Pix, com sete dias para desistir.",
  alternates: { canonical: "/infinity" },
};

const COMPARISON: { feature: string; free: string | false; infinity: string | true }[] = [
  { feature: "Mensagem", free: "2.000 caracteres", infinity: "4.000 caracteres" },
  { feature: "Cada anexo", free: "25 MB", infinity: "500 MB" },
  { feature: "Envio por hora", free: "500 MB", infinity: "5 GB" },
  { feature: "Transmissão de tela", free: "até 720p, 30 quadros", infinity: "até 1080p, 60 quadros" },
  { feature: "Comunidades ao mesmo tempo", free: "100", infinity: "200" },
  { feature: "Mensagens salvas", free: "50", infinity: "300" },
  { feature: "Etiqueta própria ao lado do nome", free: false, infinity: true },
  { feature: "Perfil diferente em cada comunidade", free: false, infinity: true },
  { feature: "Selo no perfil", free: false, infinity: true },
  { feature: "Foto de perfil animada", free: false, infinity: true },
  { feature: "Emojis e figurinhas em qualquer lugar", free: false, infinity: true },
  { feature: "Cores do aplicativo do seu jeito", free: false, infinity: true },
  { feature: "Novidades antes de todo mundo", free: false, infinity: true },
];

export default function Infinity() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand">Infinity</p>

        <h1 className="mt-3 text-center text-4xl font-bold">O plano pago do {BRAND}</h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-ink-muted">
          O {BRAND} é de graça e continua sendo. O Infinity é para quem quer
          mandar arquivo grande, transmitir tela em 1080p e deixar o aplicativo
          com a cara que quiser — e ajuda a pagar o servidor.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Price period="Por mês" amount="R$ 18,00" detail="Cobrado todo mês, cancela quando quiser." />
          <Price
            period="Por ano"
            amount="R$ 185,00"
            detail="Sai R$ 15,42 por mês — R$ 31,00 a menos que pagar mês a mês."
            highlight
          />
        </div>

        <h2 className="mt-20 text-2xl font-bold">O que muda</h2>

        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-1 text-left">
                <th className="px-4 py-3 font-semibold">Recurso</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Grátis</th>
                <th className="px-4 py-3 font-semibold text-brand">Infinity</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">{row.feature}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.free === false ? <Minus size={16} className="text-ink-faint" /> : row.free}
                  </td>
                  <td className="px-4 py-3">
                    {row.infinity === true ? <Check size={16} className="text-brand" /> : row.infinity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-20 text-2xl font-bold">Como pagar</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Way
            icon={<CreditCard size={22} />}
            title="Cartão"
            text="Renova sozinho, todo mês ou todo ano, até você cancelar. O cartão é digitado dentro da própria Stripe — nós não guardamos o número."
          />
          <Way
            icon={<QrCode size={22} />}
            title="Pix"
            text="Você paga o período de uma vez: 30 ou 365 dias. Não renova sozinho e não guarda nada seu; quando acabar, é só pagar de novo se quiser."
          />
        </div>

        <div className="mt-4 flex gap-4 rounded-xl border border-line bg-surface-1 px-5 py-4">
          <span className="mt-0.5 text-brand">
            <Gift size={22} />
          </span>
          <p className="text-sm leading-relaxed text-ink-muted">
            Dá para comprar de presente. Sai um link que a pessoa abre e ativa
            na conta dela, sem precisar pagar nada. Presente já resgatado não
            volta atrás.
          </p>
        </div>

        <h2 className="mt-20 text-2xl font-bold">Cancelar e receber de volta</h2>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-muted">
          <p>
            <strong className="font-semibold text-ink">Cancelar:</strong> no
            aplicativo, em Configurações → Infinity. O plano segue valendo até o
            fim do período que você já pagou, e depois simplesmente não renova.
            Ninguém precisa falar com suporte para cancelar.
          </p>
          <p>
            <strong className="font-semibold text-ink">Desistir:</strong> dentro
            de <strong className="font-semibold text-ink">7 dias</strong> do
            pagamento, o botão de reembolso devolve o valor inteiro pelo mesmo
            caminho que ele entrou. Depois desse prazo, o período já pago
            continua valendo até o fim.
          </p>
          <p>
            O que você já tinha antes do Infinity continua seu se o plano
            acabar: nada é apagado. O que passa a valer de novo são os limites
            do grátis, daquele momento em diante.
          </p>
        </div>

        <div className="mt-16 rounded-xl border border-brand/30 bg-brand/[0.07] px-6 py-8 text-center">
          <p className="text-sm text-ink-muted">O Infinity se compra dentro do aplicativo.</p>
          <a
            href={`${APP}/dm/infinity`}
            className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Abrir o {BRAND}
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}

const Price = ({
  period,
  amount,
  detail,
  highlight = false,
}: {
  period: string;
  amount: string;
  detail: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-xl border px-6 py-7 ${
      highlight ? "border-brand/40 bg-brand/[0.07]" : "border-line bg-surface-1"
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{period}</p>
    <p className="mt-2 text-3xl font-bold">{amount}</p>
    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{detail}</p>
  </div>
);

const Way = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="rounded-xl border border-line bg-surface-1 px-5 py-5">
    <span className="flex size-11 items-center justify-center rounded-lg bg-brand/15 text-brand">{icon}</span>
    <h3 className="mt-4 font-semibold">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
  </div>
);
