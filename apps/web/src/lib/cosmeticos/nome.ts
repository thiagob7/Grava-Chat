/**
 * Como o nome de uma pessoa é pintado, com a hierarquia do servidor intacta.
 *
 * A regra de precedência é a decisão mais importante da leva inteira:
 *
 * > A cor **sólida** do cargo vence a do usuário. O **efeito** é do usuário — e
 * > quando ele não escolheu cor, o efeito usa a cor do cargo como cor 1.
 *
 * Sem ela, no primeiro dia todo mundo escolhe a própria cor e a hierarquia do
 * servidor — quem é moderador, quem é dono — some da tela. Com ela, o enfeite é
 * do usuário e a identidade do cargo continua de pé.
 */
import type { EfeitoDeNome, EstiloDeNome } from "@gravae/shared";

import { legivel } from "./contraste";
import { variaveisDoEnfeite, type EstiloCss } from "./estilos";
import { familiaDaFonte } from "./fontes";

export interface Enfeite {
  className?: string;
  style?: EstiloCss;
}

/**
 * Os efeitos que pintam o texto com `background-clip: text`.
 *
 * O Chrome desliga o antialiasing subpixel em qualquer elemento assim, e a 14px
 * o nome fica visivelmente mais fino que os vizinhos da mesma linha. Não tem
 * conserto — dá pra escolher onde pagar, e o preço não vale numa lista de cem
 * nomes. Em tamanho `sm` estes caem pra cor sólida.
 */
const RECORTAM_O_TEXTO = new Set<EfeitoDeNome>(["gradiente", "brilho"]);

export interface EntradaDoNome {
  /** o que a pessoa escolheu; `null` para quem nunca mexeu */
  estilo?: EstiloDeNome | null;
  /** cor do cargo mais alto que tem cor, ou `null` */
  corDoCargo?: string | null;
  /** `sm` (chat, listas) recusa os efeitos que recortam o texto */
  tamanho?: "sm" | "md";
  /** só o cartão de perfil e o editor animam; ver `estilos.ts` */
  animar?: boolean;
  /** contra qual fundo medir o contraste, quando não for o mais escuro do tema */
  fundo?: string;
}

/**
 * Devolve `{}` quando não há nada a aplicar — e é isso que faz a Fase 0 ser
 * invisível: sem enfeite e sem cargo colorido, o `<span>` sai sem `class` e sem
 * `style`, exatamente o texto solto que estava lá antes.
 */
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
    /**
     * Cargo vence quando a escolha foi mesmo "sem efeito" — a cor chapada é o
     * sinal de hierarquia. Mas quando somos NÓS que rebaixamos um gradiente por
     * causa do tamanho, a cor de quem escolheu sobrevive: o rebaixamento é uma
     * limitação de renderização, não uma opinião sobre quem manda.
     */
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
      // sem cor escolhida, o efeito herda a do cargo — hierarquia sobrevive ao enfeite
      cor1: legivelOuNada(corDoUsuario ?? corDoCargo, fundo),
      cor2: legivelOuNada(estilo?.cor2, fundo),
      fonte,
      animar,
    }),
  };
}

const legivelOuNada = (cor: string | null | undefined, fundo?: string) =>
  cor ? legivel(cor, fundo) : null;
