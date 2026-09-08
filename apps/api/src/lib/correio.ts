import { env } from "~/env.js";

/*
  O correio da casa.

  Um provedor só, o Resend, e por HTTP puro: mandar e-mail é um POST com
  JSON, e uma biblioteca inteira para isso seria peso sem troco. Sem chave
  configurada o correio se declara desligado, e quem chama decide o que
  fazer — fingir que mandou seria pior do que dizer que não dá.
*/
const ENDERECO = "https://api.resend.com/emails";

export const correio = {
  ligado: () => Boolean(env.RESEND_API_KEY),

  async enviar(para: string, assunto: string, texto: string, html?: string) {
    if (!correio.ligado()) throw new Error("correio desligado: falta RESEND_API_KEY");

    const resposta = await fetch(ENDERECO, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_REMETENTE,
        to: [para],
        subject: assunto,
        text: texto,
        ...(html ? { html } : {}),
      }),
    });

    if (!resposta.ok) {
      throw new Error(`correio: o Resend recusou (${resposta.status}) ${await resposta.text()}`);
    }
  },
};
