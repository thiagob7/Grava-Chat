import { ZodError } from "zod";

import { AppError } from "./http.js";

export interface ErrorAnswer {
  status: number;
  body: { message: string; reason?: string; issues?: { path: string; message: string }[] };
  log: boolean;
}

const fromPaymentProvider = (error: unknown) => {
  const type = (error as { type?: unknown }).type;
  return typeof type === "string" && type.startsWith("Stripe");
};

export function errorAnswer(error: unknown): ErrorAnswer {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: { message: error.message, ...(error.reason ? { reason: error.reason } : {}) },
      log: false,
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        message: error.issues[0]?.message ?? "Dados inválidos",
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      log: false,
    };
  }

  if (fromPaymentProvider(error)) {
    return { status: 502, body: { message: "Não deu para falar com o pagamento agora. Tente de novo." }, log: true };
  }

  const status = (error as { statusCode?: number }).statusCode;
  if (status && status < 500) return { status, body: { message: (error as Error).message }, log: false };

  return { status: 500, body: { message: "Erro interno" }, log: true };
}
