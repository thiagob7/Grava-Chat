import { adiantaInsistir, ehMotivoDeFalha, type MotivoDeFalha } from "@gravae/shared";

export class ErroDaApi extends Error {
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
  get adiantaInsistir() {
    return this.status === 429 || this.status >= 500;
  }
}

export interface OpcoesDoCliente {
  token: string;
  base?: string;
  /** Quantas vezes repetir quando a falha for passageira. Zero desliga. */
  tentativas?: number;
}

const BASE_PADRAO = "https://gravaechat-api.duckdns.org/api";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Rest {
  private readonly base: string;
  private readonly tentativas: number;

  constructor(private readonly opcoes: OpcoesDoCliente) {
    this.base = (opcoes.base ?? BASE_PADRAO).replace(/\/$/, "");
    this.tentativas = opcoes.tentativas ?? 3;
  }

  async pedir<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    let ultima: ErroDaApi | null = null;

    for (let tentativa = 0; tentativa <= this.tentativas; tentativa++) {
      try {
        return await this.uma<T>(metodo, caminho, corpo);
      } catch (erro) {
        if (!(erro instanceof ErroDaApi) || !erro.adiantaInsistir) throw erro;

        ultima = erro;

        /*
          Espera crescente, com um teto. Sem o teto, uma API fora do ar por
          meia hora vira um bot que dorme meia hora depois que ela volta.
        */
        await esperar(Math.min(2 ** tentativa * 500, 8000));
      }
    }

    throw ultima;
  }

  private async uma<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    const resposta = await fetch(`${this.base}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bot ${this.opcoes.token}`,
        ...(corpo === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    if (resposta.status === 204) return undefined as T;

    const texto = await resposta.text();
    const dados = texto ? (JSON.parse(texto) as unknown) : null;

    if (!resposta.ok) {
      const { message, issues } = (dados ?? {}) as {
        message?: string;
        issues?: { path: string; message: string }[];
      };

      throw new ErroDaApi(resposta.status, message ?? "Erro sem mensagem", issues);
    }

    return dados as T;
  }
}

export const motivoDoErro = (erro: unknown): MotivoDeFalha | null => {
  const motivo = (erro as { motivo?: unknown } | null)?.motivo;
  return ehMotivoDeFalha(motivo) ? motivo : null;
};

export { adiantaInsistir };
