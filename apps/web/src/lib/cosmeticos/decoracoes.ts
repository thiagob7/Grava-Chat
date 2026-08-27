import type { Decoracao } from "@gravae/shared";

import coroaUrl from "~/assets/decoracoes/coroa.svg?url";
import runasUrl from "~/assets/decoracoes/runas.svg?url";
import loureiroUrl from "~/assets/decoracoes/loureiro.svg?url";

/*
  As decorações que NÃO são CSS.

  São duas famílias, e a diferença é só o formato do arquivo:

  - LOTTIE  vetor animado quadro a quadro (`aro`, `alada`, `gelo`). Pesa mais e
            precisa do player, mas anima de verdade.
  - IMAGEM  um arquivo só, desenhado (`coroa`, `runas`, `loureiro`). SVG anima
            sozinho: dentro de um `<img>` o navegador roda SMIL e CSS internos,
            só barra script — então nenhuma delas precisa do player. É também o
            formato em que vem toda
            arte de terceiro — os packs de `avatar frame` do itch.io e do
            CraftPix, ou o que um ilustrador entrega. SVG ou PNG, tanto faz.

  A terceira família, a de classe CSS, mora no `cosmeticos.css` e é resolvida
  pelo `classeDoEnfeite`. Quem decide entre as três é o `Avatar`.
*/

interface Lottie {
  arquivo: () => Promise<{ default: unknown }>;
  folga: string;
  segmento?: [number, number];
}

interface Imagem {
  /// A URL que o Vite gera no build. Importar com `?url` não baixa o arquivo:
  /// só resolve o caminho, e a imagem só é buscada quando alguém a usa.
  url: string;
  folga: string;
}

const LOTTIES: Partial<Record<Decoracao, Lottie>> = {
  aro: { arquivo: () => import("~/assets/decoracoes/aro.json"), folga: "-16%" },
  alada: {
    arquivo: () => import("~/assets/decoracoes/alada.json"),
    folga: "-24%",
  },
  /// Mesma folga do `aro`: os dois desenham o anel a 84 de raio num quadro de
  /// 200, então ocupam o mesmo lugar em volta do retrato. O halo do gelo vai
  /// até a borda do quadro de propósito — é ele que sobra pra fora.
  gelo: { arquivo: () => import("~/assets/decoracoes/gelo.json"), folga: "-16%" },
};

const IMAGENS: Partial<Record<Decoracao, Imagem>> = {
  coroa: { url: coroaUrl, folga: "-16%" },
  runas: { url: runasUrl, folga: "-16%" },
  /// As folhas do louro escapam do anel pros dois lados; sem folga maior elas
  /// batem na borda do quadro e ficam cortadas.
  loureiro: { url: loureiroUrl, folga: "-22%" },
};

export const ehLottie = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in LOTTIES);

export const ehImagem = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in IMAGENS);

/// O que o `Avatar` pergunta: isto vem de arquivo, ou é classe CSS?
export const ehDeArquivo = (decoracao: Decoracao | null | undefined): boolean =>
  ehLottie(decoracao) || ehImagem(decoracao);

export async function carregarDecoracao(
  decoracao: Decoracao,
): Promise<unknown | null> {
  const lottie = LOTTIES[decoracao];
  if (!lottie) return null;

  return (await lottie.arquivo()).default;
}

export const imagemDaDecoracao = (decoracao: Decoracao): string | null =>
  IMAGENS[decoracao]?.url ?? null;

export const folgaDaDecoracao = (decoracao: Decoracao): string =>
  LOTTIES[decoracao]?.folga ?? IMAGENS[decoracao]?.folga ?? "-16%";

export const segmentoDaDecoracao = (
  decoracao: Decoracao,
): [number, number] | undefined => LOTTIES[decoracao]?.segmento;
