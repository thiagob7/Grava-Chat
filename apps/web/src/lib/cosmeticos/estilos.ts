/**
 * A ponte entre "o que a pessoa escolheu" e "o que o navegador desenha".
 *
 * Duas regras mandam neste arquivo:
 *
 * 1. **Classe estática, valor em custom property.** O Tailwind 4 só gera classe
 *    que existe escrita no código-fonte — `bg-[${cor}]` montado em runtime não
 *    produz CSS nenhum. Então a classe é fixa (`gc-nome--gradiente`, escrita em
 *    `styles/cosmeticos.css`) e tudo que varia viaja em `--gc-cor-1`,
 *    `--gc-cor-2`, `--gc-fonte`, `--gc-vel`.
 *
 * 2. **O id nunca é interpolado sem passar pelo enum.** O nome da classe é
 *    montado a partir de um id que veio do banco; com `z.string()` livre isso
 *    seria injeção de seletor. O `z.enum` do shared fecha o conjunto, e o
 *    `VAZIOS` cuida do "sem enfeite".
 *
 * Efeito colateral bom: a prévia do editor chama exatamente estas funções, com
 * o rascunho no lugar do perfil salvo. Não existe caminho onde prévia e render
 * real possam divergir.
 */
import type { CSSProperties } from "react";

import { VAZIOS } from "./catalogo";

/**
 * `style` com custom property dentro.
 *
 * O `CSSProperties` do React não aceita chave `--alguma-coisa` sem isto, e a
 * saída de um `as CSSProperties` cru esconderia erro de digitação de verdade.
 */
export type EstiloCss = CSSProperties & Record<`--${string}`, string | number | undefined>;

/** Animação parada. Em lista, TODO enfeite anda com isto. */
export const PARADO = "0s";

/**
 * `gc-<familia>--<id>`, ou `null` quando a escolha é "nenhum".
 *
 * Devolver `null` em vez de uma classe vazia é o que garante a promessa da
 * Fase 0: sem enfeite, o elemento sai da árvore com exatamente as mesmas
 * classes de antes.
 */
export function classeDoEnfeite(familia: string, id: string | null | undefined): string | null {
  if (!id || VAZIOS.has(id)) return null;

  return `gc-${familia}--${id}`;
}

interface Variaveis {
  cor1?: string | null;
  cor2?: string | null;
  fonte?: string | null;
  /**
   * Animação só no cartão de perfil e no editor.
   *
   * Cem membros na lista, cada um com um efeito animado, engasga a rolagem — e
   * o custo é pago por quem só queria ler quem está online. Mesma classe, com
   * `--gc-vel: 0s`.
   */
  animar?: boolean;
  /** velocidade base do efeito; só vale quando `animar` */
  velocidade?: string;
}

/**
 * Monta o `style`, deixando de fora toda propriedade que não foi escolhida.
 *
 * Chave ausente é diferente de chave `undefined` aqui: o objeto vira o `style`
 * de um elemento, e propriedade a menos é uma linha a menos no atributo. Com
 * tudo vazio, o retorno é `undefined` — nem `style` o elemento ganha.
 */
export function variaveisDoEnfeite(v: Variaveis): EstiloCss | undefined {
  const estilo: EstiloCss = {};

  if (v.cor1) estilo["--gc-cor-1"] = v.cor1;
  if (v.cor2) estilo["--gc-cor-2"] = v.cor2;
  if (v.fonte) estilo["--gc-fonte"] = v.fonte;

  // sempre explícito: o padrão do CSS é parado, mas o cartão de perfil precisa
  // dizer "aqui pode andar" sem depender de herança de quem o embrulha
  if (v.animar) estilo["--gc-vel"] = v.velocidade ?? "4s";

  return Object.keys(estilo).length > 0 ? estilo : undefined;
}
