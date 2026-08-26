import type { EfeitoDeNome, EstiloDeNome } from "@gravae/shared";

import { legivel } from "./contraste";
import { variaveisDoEnfeite, type EstiloCss } from "./estilos";
import { familiaDaFonte } from "./fontes";

export interface Enfeite {
  className?: string;
  style?: EstiloCss;
}

const RECORTAM_O_TEXTO = new Set<EfeitoDeNome>(["gradiente", "brilho"]);

export interface EntradaDoNome {
  estilo?: EstiloDeNome | null;
  corDoCargo?: string | null;
  tamanho?: "sm" | "md";
  animar?: boolean;
  fundo?: string;
}

export function estiloDoNome({
  estilo,
  corDoCargo,
  tamanho = "sm",
  animar = false,
  fundo,
}: EntradaDoNome): Enfeite {
  const pedido = estilo?.efeito ?? "solido";
  const rebaixado = RECORTAM_O_TEXTO.has(pedido) && tamanho === "sm";
  const efeito = rebaixado ? "solido" : pedido;

  const corDoUsuario = estilo?.cor ?? null;
  const fonte = familiaDaFonte(estilo?.fonte);
  const classes: string[] = [];

  if (fonte) classes.push("gc-fonte");

  if (efeito === "solido") {
    const cor = rebaixado ? (corDoUsuario ?? corDoCargo) : (corDoCargo ?? corDoUsuario);

    const style: EstiloCss = {
      ...(cor ? { color: legivel(cor, fundo) } : null),
      ...variaveisDoEnfeite({ fonte }),
    };

    return {
      className: classes.join(" ") || undefined,
      style: Object.keys(style).length > 0 ? style : undefined,
    };
  }

  classes.push(`gc-nome--${efeito}`);

  return {
    className: classes.join(" "),
    style: variaveisDoEnfeite({
      cor1: legivelOuNada(corDoUsuario ?? corDoCargo, fundo),
      cor2: legivelOuNada(estilo?.cor2, fundo),
      fonte,
      animar,
    }),
  };
}

const legivelOuNada = (cor: string | null | undefined, fundo?: string) =>
  cor ? legivel(cor, fundo) : null;
