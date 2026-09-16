import type { Metadata } from "next";

import { Footer } from "~/components/Rodape";
import { Header } from "~/components/Cabecalho";
import { BRAND, OPERATOR, SUPPORT } from "~/lib/brand";

export const metadata: Metadata = {
  title: `Privacidade — ${BRAND}`,
  description: `O que o ${BRAND} guarda, por quanto tempo, com quem divide e como você pede para apagar.`,
  alternates: { canonical: "/privacidade" },
};

const UPDATED = "16 de setembro de 2026";

export default function Privacy() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-bold">Privacidade</h1>
        <p className="mt-3 text-sm text-ink-faint">Em vigor desde {UPDATED}.</p>

        <p className="mt-8 text-sm leading-relaxed text-ink-muted">
          Resumo, para não depender de ler tudo: guardamos o mínimo para o
          aplicativo funcionar, não vendemos seus dados, não há anúncio, e o
          número do seu cartão nunca passa por nós.
        </p>

        <div className="mt-12 space-y-10">
          <Section title="Quem cuida dos dados">
            <p>
              O {BRAND} é operado por {OPERATOR}, no Brasil, que responde pelo
              tratamento dos dados descritos aqui. Para qualquer pedido sobre
              seus dados, escreva para {SUPPORT}.
            </p>
          </Section>

          <Section title="O que guardamos">
            <ul className="mt-3 space-y-2">
              <li>
                <strong className="font-semibold text-ink">Da sua conta</strong>:
                e-mail, nome de exibição, foto, e a senha guardada apenas como
                resumo cifrado. Se entrar com Google, recebemos de lá o e-mail e
                o nome.
              </li>
              <li>
                <strong className="font-semibold text-ink">Do que você envia</strong>:
                mensagens, imagens e arquivos, para entregar a quem você mandou.
              </li>
              <li>
                <strong className="font-semibold text-ink">De uso</strong>:
                endereço IP, data e hora de acesso e registros de erro, usados
                para segurança e para achar defeito.
              </li>
              <li>
                <strong className="font-semibold text-ink">De pagamento</strong>,
                se comprar o Infinity: identificador da compra, valor e data. O
                número do cartão vai direto para a Stripe e não chega até nós.
              </li>
            </ul>
            <p className="mt-3">
              A conversa não é criptografada de ponta a ponta: para entregar sua
              mensagem, o servidor precisa guardá-la. Quem administra o serviço
              tem acesso técnico ao banco, e só o usa para manter o sistema de
              pé ou responder a ordem judicial.
            </p>
          </Section>

          <Section title="Por que guardamos">
            <p>
              Para executar o contrato com você — entregar as mensagens, manter
              a conta, cobrar o plano —, para cumprir obrigação legal, como
              guardar registro de acesso pelo prazo do Marco Civil da Internet,
              e pelo legítimo interesse de manter o serviço seguro contra abuso.
            </p>
          </Section>

          <Section title="Com quem dividimos">
            <p>
              Só com quem é necessário para o serviço existir, e cada um vê
              apenas a sua parte:
            </p>
            <ul className="mt-3 space-y-2">
              <li>Stripe e Mercado Pago — pagamento do Infinity;</li>
              <li>MongoDB Atlas — banco de dados, em região do Brasil;</li>
              <li>Cloudflare R2 — armazenamento dos anexos;</li>
              <li>Oracle Cloud — servidores da aplicação e das chamadas;</li>
              <li>Vercel — entrega do site e do aplicativo no navegador;</li>
              <li>Google — apenas se você escolher entrar com a conta Google.</li>
            </ul>
            <p className="mt-3">
              Não vendemos, alugamos nem trocamos dados com anunciante nenhum.
              Podemos entregar dados a autoridade quando houver ordem legal.
            </p>
          </Section>

          <Section title="Por quanto tempo">
            <p>
              Enquanto sua conta existir. Apagou a conta, apagamos seus dados
              pessoais e seu conteúdo, salvo o que a lei manda guardar — como os
              registros de acesso, por seis meses — e o que é preciso para prova
              fiscal de uma compra. Cópia de segurança do banco é guardada
              cifrada por 30 dias e depois se perde sozinha.
            </p>
          </Section>

          <Section title="Seus direitos">
            <p>
              Pela LGPD você pode pedir confirmação de que tratamos seus dados,
              acesso a eles, correção do que estiver errado, cópia para levar
              embora, e a exclusão. Escreva para {SUPPORT} e respondemos em até
              15 dias. Apagar a conta pelo próprio aplicativo já faz a maior
              parte disso na hora.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              Usamos apenas o necessário para manter você conectado e lembrar
              preferências como o tema. Não há cookie de publicidade nem de
              rastreamento de terceiros.
            </p>
          </Section>

          <Section title="Crianças">
            <p>
              O serviço não é para menores de 13 anos. Se soubermos de uma conta
              dessas, ela é encerrada e os dados apagados.
            </p>
          </Section>

          <Section title="Mudanças">
            <p>
              Se esta política mudar de forma relevante, avisamos dentro do
              aplicativo antes de a versão nova passar a valer.
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
