import type { Metadata } from "next";

import { Code } from "~/components/docs/Codigo";
import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Bot de moderação — Documentação do Gravaê",
  description: "Expulsar, banir, castigar e mexer em cargos pela API de bots do Gravaê.",
};

export default function Moderation() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Bot de moderação" />
        <Title call="Tudo que a tela de moderação faz, um bot também faz — pelas mesmas rotas e com as mesmas travas. Convide o bot com os cargos certos e ele já pode.">
          Bot de moderação
        </Title>
      </header>

      <Section id="castigo" title="Castigar">
        <p>
          O castigo é a punição do dia a dia: a pessoa continua no servidor e para de escrever e de
          falar por um tempo. Vai em minutos, até 28 dias.
        </p>

        <Code>{`curl -X PUT ${API}/bot/servidores/$SERVIDOR/castigos/$PESSOA \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"minutos":10,"reason":"spam de link"}'`}</Code>

        <p>
          Mandar <code>minutos: 0</code> solta na hora. Precisa de{" "}
          <code>MODERATE_MEMBERS</code>.
        </p>
      </Section>

      <Section id="expulsar-banir" title="Expulsar e banir">
        <p>
          Expulsar tira do servidor, e a pessoa volta com um convite novo. Banir tira e impede de
          voltar — nem com convite novo.
        </p>

        <Code>{`curl -X DELETE ${API}/bot/servidores/$SERVIDOR/membros/$PESSOA \\
  -H "Authorization: Bot $GRAVAE_TOKEN"

curl -X PUT ${API}/bot/servidores/$SERVIDOR/banimentos/$PESSOA \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"reason":"conta descartável","apagarHoras":24}'`}</Code>

        <p>
          O <code>apagarHoras</code> limpa junto o que a pessoa escreveu nas últimas N horas, até
          uma semana. É o que você quer quando o motivo do banimento foi justamente o que ela
          escreveu.
        </p>
      </Section>

      <Section id="cargos" title="Dar e tirar cargos">
        <p>
          A rota de cargos do membro <strong className="text-ink">substitui a lista inteira</strong>,
          igual à de comandos. Leia os cargos atuais, mexa na lista, mande de volta:
        </p>

        <Code legenda="bot.js">{`const membros = await api(\`/bot/servidores/\${servidor}/membros\`);
const membro = membros.find((m) => m.userId === pessoa);

await api(\`/bot/servidores/\${servidor}/membros/\${pessoa}/cargos\`, {
  method: "PUT",
  body: JSON.stringify({ roleIds: [...membro.roleIds, cargoDeVerificado] }),
});`}</Code>

        <p>
          Mandar só o cargo novo tira todos os outros. É o erro mais comum de bot de verificação, e
          o servidor não tem como adivinhar que você não queria isso.
        </p>
      </Section>

      <Section id="travas" title="O que o servidor não deixa">
        <Notice>
          O bot não escapa da hierarquia. Ele não expulsa, não bane, não castiga e não mexe nos
          cargos de quem está num cargo acima do dele — nem com <code>ADMINISTRATOR</code> em
          quem está acima. E o dono do servidor não é tocável por ninguém.
        </Notice>

        <p>
          Isso significa que o cargo do bot importa tanto quanto as permissões dele. Um bot com{" "}
          <code>BAN_MEMBERS</code> num cargo lá embaixo não bane quase ninguém. Peça a quem convida
          para deixar o cargo do bot acima de quem ele precisa moderar.
        </p>
        <p>
          As recusas voltam como <code>403</code> com o motivo em português. Vale mostrar esse
          motivo para quem chamou o comando, em vez de um &ldquo;deu erro&rdquo; genérico: quase
          sempre a resposta é acionável.
        </p>
      </Section>

      <Section id="auditoria" title="Ler o registro de auditoria">
        <p>
          Todo ato de moderação — o do bot inclusive — entra no registro do servidor. Um bot com{" "}
          <code>VIEW_AUDIT_LOG</code> lê e pode, por exemplo, espelhar num canal de logs:
        </p>

        <Code>{`curl "${API}/bot/servidores/$SERVIDOR/auditoria?limit=20" \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Code>

        <p>
          Filtra por <code>actorId</code> e por <code>action</code>, e pagina com{" "}
          <code>before</code>.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/moderacao" />
    </article>
  );
}
