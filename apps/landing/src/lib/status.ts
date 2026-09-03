/*
  O que a página de status lê, e de onde.

  O endereço é o da API na Oracle, e não uma variável de build: a página é
  estática e pode ser servida de qualquer lugar, então amarrar o endereço a uma
  variável de ambiente do build significaria que uma cópia servida de outro
  lugar apontaria para o vazio. É um endereço público de um serviço público.
*/
const API = "https://gravaechat-api.duckdns.org/api";

export const PECAS = ["api", "banco", "cache", "sfu"] as const;
export type Peca = (typeof PECAS)[number];

/// O nome que a pessoa lê. "sfu" é jargão; "servidor de voz" é o que ele faz.
export const NOMES: Record<Peca, string> = {
  api: "API",
  banco: "Banco de dados",
  cache: "Cache",
  sfu: "Servidor de voz",
};

export interface Medida {
  peca: Peca;
  estado: "up" | "down";
  ms: number;
}

export interface DiaDaJanela {
  dia: string;
  /// `null` quando não houve medição nenhuma naquele dia — ver `Barra`.
  uptime: number | null;
}

export interface Status {
  pecas: readonly Peca[];
  agora: Medida[];
  janela: Record<Peca, DiaDaJanela[]>;
  dias: number;
  em: string;
}

/**
 * Busca o status, e trata a falha como resposta.
 *
 * **Isto é a medição ao vivo.** A página mora na Vercel e a API na Oracle: se a
 * Oracle inteira apagar, quem grava o histórico apaga junto e a página não teria
 * como saber de nada — mostraria "sem dados", que é o pior texto possível na
 * hora em que alguém abre uma página de status.
 *
 * Aqui a própria falha do `fetch` é o dado: se ele não volta, a API está fora
 * do ar, e é isso que a página diz. O histórico daquele período fica com
 * buraco, e o buraco é honesto — ninguém estava lá para medir.
 */
export async function buscarStatus(): Promise<Status | null> {
  /*
    Oito segundos, e depois desiste.

    Servidor fora do ar nem sempre recusa a conexão: quando a máquina trava, o
    `fetch` fica pendurado para sempre — e a página, que espera em silêncio,
    ficaria eternamente no esqueleto de carregamento. Um esqueleto que nunca
    vira nada é a pior resposta possível aqui, porque não diz nem "está no ar"
    nem "está fora": só faz a pessoa esperar.

    Com o prazo, o pendurado vira erro, o erro vira "fora do ar", e a próxima
    rodada de 30 segundos volta a perguntar.
  */
  const resposta = await fetch(`${API}/publico/status`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!resposta.ok) return null;

  return (await resposta.json()) as Status;
}
