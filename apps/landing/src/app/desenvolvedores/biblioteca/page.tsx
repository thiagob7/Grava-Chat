import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { Code } from "~/components/docs/Codigo";

export const metadata: Metadata = {
  title: "Biblioteca — Documentação do Gravaê",
  description:
    "O cliente oficial em JavaScript: cabeçalho, formato de erro e reenvio resolvidos, com os tipos do próprio servidor.",
};

export default function Library() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Biblioteca" />
        <Title call="Dá para falar com a API só com fetch. A biblioteca existe para você não reescrever as três coisas que todo mundo erra.">
          Biblioteca
        </Title>
      </header>

      <Section id="o-que-resolve" title="O que ela resolve">
        <p>
          O cabeçalho de autenticação em toda chamada. O formato do erro, que vem
          com <code>message</code> e às vezes <code>issues</code>, e que ninguém
          lembra de ler. E a decisão de insistir: <code>429</code> e{" "}
          <code>5xx</code> passam sozinhos e valem nova tentativa;{" "}
          <code>403</code> não muda até alguém mexer no cargo do bot.
        </p>

        <p>
          Fora isso, ela é fina de propósito. Os tipos vêm do mesmo pacote que o
          servidor usa para validar, então não existe cópia de tipo que possa
          envelhecer em silêncio.
        </p>
      </Section>

      <Section id="instalar" title="Instalando">
        <Code>{`yarn add @gravae/bot`}</Code>
      </Section>

      <Section id="primeiro" title="O primeiro bot, inteiro">
        <Code>{`import { Gravae } from "@gravae/bot";

const bot = new Gravae({ token: process.env.GRAVAE_BOT_TOKEN! });

const eu = await bot.eu();
console.log("sou", eu.displayName);

bot.ao("message:created", async (mensagem) => {
  if (mensagem.author.id === eu.id) return;
  if (mensagem.content !== "!ping") return;

  await bot.enviar(mensagem.channelId, "pong");
});`}</Code>

        <Notice>
          <strong>Sempre ignore as próprias mensagens.</strong> Sem a primeira
          linha do ouvinte, um bot que responde a tudo responde a si mesmo, para
          sempre, e leva o canal junto.
        </Notice>

        <p>
          O bot não precisa se inscrever em canal nenhum: ao conectar, ele já
          recebe tudo o que o cargo dele alcança.
        </p>
      </Section>

      <Section id="erros" title="Erros">
        <p>
          Toda falha vira um <code>ErroDaApi</code>, com <code>status</code>,{" "}
          <code>message</code> e, quando for validação, <code>issues</code>.
        </p>

        <Code>{`import { ErroDaApi } from "@gravae/bot";

try {
  await bot.banir(servidor, alguem, { reason: "spam" });
} catch (erro) {
  if (erro instanceof ErroDaApi && erro.status === 403) {
    console.log("o cargo do bot está abaixo do dessa pessoa");
    return;
  }

  throw erro;
}`}</Code>

        <p>
          Reenvio já vem ligado, com espera crescente e teto de oito segundos.
          Para desligar, passe <code>tentativas: 0</code> ao construir.
        </p>
      </Section>

      <Section id="o-que-tem" title="O que ela cobre">
        <p>
          Identidade, servidores, canais, membros, cargos, moderação, expressões,
          mensagens e comandos de barra. O que não tiver atalho ainda continua
          alcançável pelo caminho de baixo, que aceita qualquer rota:
        </p>

        <Code>{`const auditoria = await bot.rest.pedir("GET", "/bot/servidores/ID/auditoria");`}</Code>
      </Section>

      <Ahead href="/desenvolvedores/comunidade" />
    </article>
  );
}
