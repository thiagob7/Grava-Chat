import { env } from "~/env.js";

const ADDRESS = "https://api.resend.com/emails";

export const mail = {
  on: () => Boolean(env.RESEND_API_KEY),

  async send(toward: string, subject: string, text: string, html?: string) {
    if (!mail.on()) throw new Error("correio desligado: falta RESEND_API_KEY");

    const reply = await fetch(ADDRESS, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_SENDER,
        to: [toward],
        subject: subject,
        text: text,
        ...(html ? { html } : {}),
      }),
    });

    if (!reply.ok) {
      throw new Error(`correio: o Resend recusou (${reply.status}) ${await reply.text()}`);
    }
  },
};
