import { helpsInsist, isFailureReason, type FailureReason } from "@gravae/shared";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ErroDaApi";
  }

  /*
    A pergunta que todo cliente faz e quase nenhum responde direito. Insistir em
    403 não muda nada até alguém mexer no cargo do bot; insistir em 429 e 5xx
    resolve sozinho.
  */
  get helpsInsist() {
    return this.status === 429 || this.status >= 500;
  }
}

export interface ClientOptions {
  token: string;
  base?: string;
  /** Quantas vezes repetir quando a falha for passageira. Zero desliga. */
  attempts?: number;
}

const DEFAULT_BASE = "https://gravaechat-api.duckdns.org/api";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Rest {
  private readonly base: string;
  private readonly attempts: number;

  constructor(private readonly options: ClientOptions) {
    this.base = (options.base ?? DEFAULT_BASE).replace(/\/$/, "");
    this.attempts = options.attempts ?? 3;
  }

  async askFor<T>(method: string, path: string, body?: unknown): Promise<T> {
    let last: ApiError | null = null;

    for (let attempt = 0; attempt <= this.attempts; attempt++) {
      try {
        return await this.uma<T>(method, path, body);
      } catch (error) {
        if (!(error instanceof ApiError) || !error.helpsInsist) throw error;

        last = error;

        /*
          Espera crescente, com um teto. Sem o teto, uma API fora do ar por
          meia hora vira um bot que dorme meia hora depois que ela volta.
        */
        await wait(Math.min(2 ** attempt * 500, 8000));
      }
    }

    throw last;
  }

  private async uma<T>(method: string, path: string, body?: unknown): Promise<T> {
    const reply = await fetch(`${this.base}${path}`, {
      method: method,
      headers: {
        Authorization: `Bot ${this.options.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (reply.status === 204) return undefined as T;

    const text = await reply.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!reply.ok) {
      const { message, issues } = (data ?? {}) as {
        message?: string;
        issues?: { path: string; message: string }[];
      };

      throw new ApiError(reply.status, message ?? "Erro sem mensagem", issues);
    }

    return data as T;
  }
}

export const errorReason = (error: unknown): FailureReason | null => {
  const reason = (error as { reason?: unknown } | null)?.reason;
  return isFailureReason(reason) ? reason : null;
};

export { helpsInsist };
