import { dunas } from "~/features/tema/lib/fundos/dunas";
import { estrelas } from "~/features/tema/lib/fundos/estrelas";
import { facetas } from "~/features/tema/lib/fundos/facetas";
import { favos } from "~/features/tema/lib/fundos/favos";
import { fitas } from "~/features/tema/lib/fundos/fitas";
import { fogos } from "~/features/tema/lib/fundos/fogos";
import { labirinto } from "~/features/tema/lib/fundos/labirinto";
import { nebulosa } from "~/features/tema/lib/fundos/nebulosa";
import { neve } from "~/features/tema/lib/fundos/neve";
import { ondas } from "~/features/tema/lib/fundos/ondas";
import { velas } from "~/features/tema/lib/fundos/velas";
import type { Motor } from "~/features/tema/lib/fundos/tipos";

export type { Motor, Palco } from "~/features/tema/lib/fundos/tipos";

/*
  A lista fechada é a segurança do arranjo: um tema escolhe pelo nome, e
  nome que não está aqui não liga nada. Não há caminho de um `.css` para
  código que não passe por esta tabela.
*/
export const MOTORES: Record<string, () => Motor> = {
  dunas,
  estrelas,
  facetas,
  favos,
  fitas,
  fogos,
  labirinto,
  nebulosa,
  neve,
  ondas,
  velas,
};

export const OQUEFAZ: Record<string, string> = {
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

export const NOME_DA_VARIAVEL = "--gc-fundo";

/*
  Onde o motor pinta. Atrás é o certo para quase tudo, e exige superfícies
  translúcidas para aparecer. Na frente serve ao que cai sobre a cena — neve,
  chuva, folha — e funciona mesmo com painel fechado.

  Fogo na frente foi justamente o que deu errado antes: faísca passando por
  cima da conversa cansa em dois minutos.
*/
export const NOME_DA_CAMADA = "--gc-fundo-camada";

export function camadaPedidaPeloTema(): "frente" | "fundo" {
  if (typeof document === "undefined") return "fundo";

  const pedido = getComputedStyle(document.documentElement)
    .getPropertyValue(NOME_DA_CAMADA)
    .trim()
    .replace(/^["']|["']$/g, "");

  return pedido === "frente" ? "frente" : "fundo";
}

export function motorPedidoPeloTema(): string | null {
  if (typeof document === "undefined") return null;

  const pedido = getComputedStyle(document.documentElement)
    .getPropertyValue(NOME_DA_VARIAVEL)
    .trim()
    .replace(/^["']|["']$/g, "");

  return pedido && pedido in MOTORES ? pedido : null;
}
