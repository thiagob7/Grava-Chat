import { dunes } from "~/features/tema/lib/fundos/dunas";
import { stars } from "~/features/tema/lib/fundos/estrelas";
import { facets } from "~/features/tema/lib/fundos/facetas";
import { combs } from "~/features/tema/lib/fundos/favos";
import { ribbons } from "~/features/tema/lib/fundos/fitas";
import { fires } from "~/features/tema/lib/fundos/fogos";
import { maze } from "~/features/tema/lib/fundos/labirinto";
import { nebula } from "~/features/tema/lib/fundos/nebulosa";
import { neve } from "~/features/tema/lib/fundos/neve";
import { waves } from "~/features/tema/lib/fundos/ondas";
import { candles } from "~/features/tema/lib/fundos/velas";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

export type { Motor, Stage } from "~/features/tema/lib/fundos/tipos";

/*
  A lista fechada é a segurança do arranjo: um tema escolhe pelo nome, e
  nome que não está aqui não liga nada. Não há caminho de um `.css` para
  código que não passe por esta tabela.
*/
export const ENGINES: Record<string, () => Motor> = {
  dunas: dunes,
  estrelas: stars,
  facetas: facets,
  favos: combs,
  fitas: ribbons,
  fogos: fires,
  labirinto: maze,
  nebulosa: nebula,
  neve,
  ondas: waves,
  velas: candles,
};

export const DOES: Record<string, string> = {
  dunas: "Cristas de areia, uma atrás da outra, andando devagar.",
  estrelas: "Campo de estrelas com paralaxe e umas poucas cintilando.",
  facetas: "Cacos de vidro que mudam de forma e atravessam a tela.",
  favos: "Colmeia quase invisível com pulsos de luz cruzando.",
  fitas: "Fitas de cetim torcendo enquanto atravessam.",
  fogos: "Fogos com física: foguete sobe, abre e as faíscas caem.",
  labirinto: "Corredores que se desenham sozinhos e somem atrás.",
  nebulosa: "Nuvens de cor que se atravessam e nascem uma terceira.",
  neve: "Neve em três profundidades, com rajada de vento.",
  ondas: "Faixas de luz atravessando em compassos que não fecham.",
  velas: "Velas boiando no ar, cada chama tremendo no seu ritmo.",
};

export const VARIABLE_NAME = "--gc-fundo";

/*
  Onde o motor pinta. Atrás é o certo para quase tudo, e exige superfícies
  translúcidas para aparecer. Na frente serve ao que cai sobre a cena — neve,
  chuva, folha — e funciona mesmo com painel fechado.

  Fogo na frente foi justamente o que deu errado antes: faísca passando por
  cima da conversa cansa em dois minutos.
*/
export const LAYER_NAME = "--gc-fundo-camada";

export function layerRequestedByTheme(): "frente" | "fundo" {
  if (typeof document === "undefined") return "fundo";

  const request = getComputedStyle(document.documentElement)
    .getPropertyValue(LAYER_NAME)
    .trim()
    .replace(/^["']|["']$/g, "");

  return request === "frente" ? "frente" : "fundo";
}

export function motorRequestByTheme(): string | null {
  if (typeof document === "undefined") return null;

  const request = getComputedStyle(document.documentElement)
    .getPropertyValue(VARIABLE_NAME)
    .trim()
    .replace(/^["']|["']$/g, "");

  return request && request in ENGINES ? request : null;
}
