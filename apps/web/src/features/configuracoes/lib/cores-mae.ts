import Color from "color";

import mapa from "~/features/configuracoes/lib/cores-mae.json";

export interface FilhaDeCor {
  nome: string;
  dL: number;
  razaoC: number;
  dH: number;
  alfa: number | null;
  espelha?: boolean;
  contraste?: boolean;
  ancora?: boolean;
  L?: number;
}

export interface FamiliaDeCor {
  rotulo: string;
  dica: string;
  mae: string;
  padrao: string;
  filhas: FilhaDeCor[];
}

export const CORES_MAE = mapa as Record<string, FamiliaDeCor>;

export const MAES = Object.keys(CORES_MAE);

const PISO_DE_CROMA = 3;
const TETO_DE_CROMA = 132;

const MEIO = 50;

type Cor = ReturnType<typeof Color>;

const entre = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function escrever(cor: Cor, alfa: number | null): string {
  if (alfa === null) return cor.hex().toLowerCase();

  const [r = 0, g = 0, b = 0] = cor.rgb().array().map(Math.round);
  return `rgb(${r} ${g} ${b} / ${alfa})`;
}

function escalar(dL: number, inverte: boolean, maeL: number, padraoL: number) {
  const alvo = inverte ? -dL : dL;
  const espacoNovo = alvo > 0 ? 100 - maeL : maeL;
  const espacoBase = dL > 0 ? 100 - padraoL : padraoL;

  return maeL + alvo * (espacoNovo / Math.max(espacoBase, 1));
}

export function derivar(
  id: string,
  escolhida: string,
  fator = 1,
): Record<string, string> {
  const familia = CORES_MAE[id];
  if (!familia) return {};

  let mae: Cor;
  try {
    mae = Color(escolhida);
  } catch {
    return {};
  }

  const [maeL = 0, maeC = 0, maeH = 0] = mae.lch().array();
  const [padraoL = 0] = Color(familia.padrao).lch().array();

  const virou = maeL > MEIO !== padraoL > MEIO;

  const saida: Record<string, string> = {
    [familia.mae]: escrever(
      Color.lch(maeL, entre(maeC * fator, 0, TETO_DE_CROMA), maeH),
      mae.alpha() < 1 ? Number(mae.alpha().toFixed(4)) : null,
    ),
  };

  for (const filha of familia.filhas) {
    const inverte =
      !filha.ancora &&
      (Boolean(filha.espelha) || Boolean(filha.contraste)) &&
      virou;

    const L =
      filha.L === undefined
        ? escalar(filha.dL, inverte, maeL, padraoL)
        : inverte
          ? 100 - filha.L
          : filha.L;

    const C = Math.max(maeC, PISO_DE_CROMA) * filha.razaoC * fator;
    const H = (((maeH + filha.dH) % 360) + 360) % 360;

    saida[filha.nome] = escrever(
      Color.lch(entre(L, 0, 100), entre(C, 0, TETO_DE_CROMA), H),
      filha.alfa,
    );
  }

  return saida;
}

export const TOKENS_DERIVADOS = new Set(
  Object.values(CORES_MAE).flatMap((f) => [
    f.mae,
    ...f.filhas.map((c) => c.nome),
  ]),
);

export function montarTema(
  coresMae: Record<string, string>,
  saturacao: number,
  manuais: Record<string, string>,
): Record<string, string> {
  const derivadas: Record<string, string> = {};

  for (const [id, cor] of Object.entries(coresMae)) {
    Object.assign(derivadas, derivar(id, cor, saturacao));
  }

  return { ...derivadas, ...manuais };
}

export function completarComDerivacao(
  traduzidos: Record<string, string>,
  saturacao = 1,
): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const id of MAES) {
    const familia = CORES_MAE[id];
    const cor = familia && traduzidos[familia.mae];
    if (!cor) continue;

    for (const [nome, valor] of Object.entries(derivar(id, cor, saturacao))) {
      if (nome in traduzidos) continue;
      saida[nome] = valor;
    }
  }

  return saida;
}
