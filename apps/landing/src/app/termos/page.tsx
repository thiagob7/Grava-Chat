import type { Metadata } from "next";

import { Footer } from "~/components/Rodape";
import { Header } from "~/components/Cabecalho";
import { BRAND, OPERATOR, SUPPORT } from "~/lib/brand";

export const metadata: Metadata = {
  title: `Termos de uso — ${BRAND}`,
  description: `As regras de quem usa o ${BRAND}: conta, conduta, plano pago, cancelamento e reembolso.`,
  alternates: { canonical: "/termos" },
};

const UPDATED = "16 de setembro de 2026";

export default function Terms() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-bold">Termos de uso</h1>
        <p className="mt-3 text-sm text-ink-faint">Em vigor desde {UPDATED}.</p>

        <div className="mt-12 space-y-10">
          <Section title="Quem oferece o serviço">
            <p>
              O {BRAND} é um aplicativo de conversa, voz e vídeo operado por{" "}
              {OPERATOR}, no Brasil. Falar com a gente: {SUPPORT}.
            </p>
          </Section>

          <Section title="Quem pode usar">
            <p>
              É preciso ter 13 anos ou mais. Entre 13 e 18, só com a
              concordância de quem responde por você. Uma conta é de uma pessoa:
              não empreste nem venda a sua.
            </p>
          </Section>

          <Section title="Sua conta">
            <p>
              Você é responsável pelo que acontece na sua conta e por manter a
              senha em segredo. Se perceber acesso que não foi seu, avise em{" "}
              {SUPPORT}. Pode apagar sua conta quando quiser, dentro do próprio
              aplicativo.
            </p>
          </Section>

          <Section title="O que não vale fazer">
            <p>Usando o {BRAND}, você concorda em não:</p>
            <ul className="mt-3 space-y-2">
              <li>publicar conteúdo ilegal, de ódio, sexual envolvendo menores ou que incentive violência;</li>
              <li>assediar, ameaçar ou perseguir outras pessoas;</li>
              <li>invadir, sobrecarregar ou tentar quebrar o serviço;</li>
              <li>usar robôs para enviar spam ou burlar limites;</li>
              <li>se passar por outra pessoa.</li>
            </ul>
            <p className="mt-3">
              Quem quebra essas regras pode ter conteúdo removido e a conta
              suspensa ou encerrada. Cada comunidade também tem sua própria
              moderação, com regras próprias que valem dentro dela.
            </p>
          </Section>

          <Section title="O que é seu continua seu">
            <p>
              As mensagens, imagens e arquivos que você envia continuam sendo
              seus. Você só nos dá a permissão necessária para guardá-los e
              exibi-los para quem você mandou — é o que faz o aplicativo
              funcionar. Não vendemos o que você fala nem usamos seu conteúdo
              para anúncio.
            </p>
          </Section>

          <Section title="Plano Infinity">
            <p>
              O {BRAND} é de graça. O Infinity é opcional e custa{" "}
              <strong className="font-semibold text-ink">R$ 18,00 por mês</strong> ou{" "}
              <strong className="font-semibold text-ink">R$ 185,00 por ano</strong>, em reais.
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <strong className="font-semibold text-ink">No cartão</strong>, a
                cobrança se repete a cada período até você cancelar. O pagamento
                é processado pela Stripe; não guardamos o número do cartão.
              </li>
              <li>
                <strong className="font-semibold text-ink">No Pix</strong>, você
                paga um período fechado, de 30 ou 365 dias, que não se renova
                sozinho. O pagamento é processado pelo Mercado Pago.
              </li>
              <li>
                <strong className="font-semibold text-ink">Presente</strong>: dá
                para comprar para outra pessoa, que recebe um código para ativar
                na conta dela.
              </li>
            </ul>
            <p className="mt-3">
              O preço pode mudar no futuro. Se mudar, avisamos antes, e o novo
              valor só vale a partir do período seguinte.
            </p>
          </Section>

          <Section title="Cancelar e receber de volta">
            <p>
              Cancele quando quiser, em Configurações → Infinity, sem falar com
              ninguém. O plano continua valendo até o fim do período já pago e
              depois não renova.
            </p>
            <p className="mt-3">
              Em até <strong className="font-semibold text-ink">7 dias</strong>{" "}
              do pagamento, você pode pedir o dinheiro de volta pelo próprio
              aplicativo e recebe o valor inteiro, pelo mesmo meio em que pagou.
              Passado esse prazo, não há devolução do período em curso — ele
              segue valendo até acabar. Presente que já foi resgatado não é
              reembolsável.
            </p>
            <p className="mt-3">
              Se o plano acabar, nada que você criou é apagado: voltam a valer
              os limites do plano grátis daquele momento em diante.
            </p>
          </Section>

          <Section title="O serviço pode falhar">
            <p>
              O {BRAND} é oferecido como está. Fazemos o possível para manter
              tudo no ar, mas não prometemos funcionamento sem interrupção nem
              nos responsabilizamos por perda de conteúdo causada por falha,
              manutenção ou caso fortuito. Guarde cópia do que for importante
              para você.
            </p>
            <p className="mt-3">
              Nossa responsabilidade, quando houver, fica limitada ao valor que
              você pagou nos 12 meses anteriores ao fato.
            </p>
          </Section>

          <Section title="Encerramento">
            <p>
              Você pode parar de usar quando quiser. Podemos encerrar ou
              suspender contas que quebrem estes termos ou a lei. Se isso
              acontecer com um plano pago em vigor e sem culpa sua, devolvemos a
              parte proporcional que ainda não foi usada.
            </p>
          </Section>

          <Section title="Mudanças nestes termos">
            <p>
              Se algo mudar de forma relevante, avisamos dentro do aplicativo
              com pelo menos 30 dias de antecedência. Continuar usando depois
              disso significa concordar com a versão nova.
            </p>
          </Section>

          <Section title="Lei e foro">
            <p>
              Valem as leis brasileiras, entre elas o Código de Defesa do
              Consumidor e a Lei Geral de Proteção de Dados. Fica eleito o foro
              do domicílio do consumidor para resolver o que não se resolver por
              conversa.
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="mt-3 text-sm leading-relaxed text-ink-muted [&_li]:list-disc [&_ul]:pl-5">{children}</div>
  </section>
);
