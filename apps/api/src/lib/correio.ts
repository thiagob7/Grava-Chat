import { env } from "~/env.js";

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
