import type { Metadata } from "next";

import { Codigo } from "~/components/docs/Codigo";
import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Comandos de barra — Documentação do Gravaê",
  description: "Registrar comandos de barra e responder quando alguém chama.",
};

export default function Comandos() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Guias" pagina="Comandos de barra" />
        <Titulo chamada="Comando de barra é como o bot aparece para quem usa o servidor: um nome com descrição, listado na caixa de texto, que chama o seu código.">
          Comandos de barra
        </Titulo>
      </header>

      <Secao id="registrar" titulo="Registre a lista">
        <Codigo>{`curl -X PUT ${API}/bot/comandos \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comandos":[{"nome":"clima","descricao":"O tempo agora"}]}'`}</Codigo>

        <Aviso>
          O <code>PUT</code> <strong className="text-ink">substitui a lista inteira</strong>. Mandar
          só o comando novo apaga todos os outros; mandar um array vazio apaga tudo. Sempre envie a
          lista completa.
        </Aviso>

        <p>
          Registrar é uma vez, não a cada vez que o bot sobe. Rode quando a lista mudar — os
          comandos ficam guardados, e o servidor avisa os aplicativos abertos que a lista mudou.
        </p>
      </Secao>

      <Secao id="responder" titulo="Responda quando chamarem">
        <p>
          Quem chama o comando manda pelo aplicativo; o que chega no seu bot é o evento{" "}
          <code>command:invoked</code>, pela conexão de tempo real:
        </p>

        <Codigo legenda="bot.js">{`socket.on("command:invoked", ({ comando, channelId, opcoes, usuario }) => {
  if (comando !== "clima") return;

  socket.emit("message:send", {
    channelId,
    content: \`\${usuario.displayName}, agora faz 24°C.\`,
  });
});`}</Codigo>

        <p>
          Vem junto o <code>guildId</code>, o <code>messageId</code> de quem chamou, e as{" "}
          <code>opcoes</code> que a pessoa preencheu. Responder é mandar mensagem no{" "}
          <code>channelId</code> que veio no evento — não existe canal escondido de resposta.
        </p>
      </Secao>

      <Secao id="cuidados" titulo="Dois cuidados">
        <p>
          <strong className="text-ink">Responda rápido.</strong> Quem chamou está olhando para a
          tela. Se a sua resposta depende de uma consulta lenta, mande logo uma mensagem dizendo
          que está indo e edite depois — editar mensagem é <code>PATCH</code>.
        </p>
        <p>
          <strong className="text-ink">Confira quem chamou.</strong> O evento diz o usuário e o
          servidor. Se o comando faz algo que nem todo mundo devia fazer, essa conferência é sua —
          o Gravaê garante que a pessoa pode ver o canal, não que ela pode usar o seu comando.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/comandos" />
    </article>
  );
}
