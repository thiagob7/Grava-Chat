import { useCallback, useMemo } from "react";
import type { ComandoDisponivel } from "@gravae/shared";

import { useFindComandos } from "~/@core/application/queries/comando/use-find-comandos";

/**
 * A barra só vale no começo da linha.
 *
 * É o que separa "estou escolhendo um comando" de "escrevi uma data" ou "colei
 * um caminho". No meio do texto a barra é só uma barra — e a lista pulando na
 * frente de quem escreve `24/08` seria pior do que não existir.
 *
 * Enquanto não há espaço, o que vem depois da barra é o NOME. Depois do
 * primeiro espaço o comando já foi escolhido e o que se digita são os
 * argumentos, então a lista sai da frente.
 */
export function detectarComando(texto: string, cursor: number) {
  if (!texto.startsWith("/")) return null;

  const ate = texto.slice(0, cursor);
  if (ate.includes(" ")) return null;

  return { termo: ate.slice(1) };
}

/**
 * O que a pessoa escreveu, repartido nas opções que o comando declarou.
 *
 * A regra é posição, e a última leva o resto. É o que faz `/play tim maia
 * azul da cor do mar` funcionar sem ninguém precisar de aspas — e é por isso
 * que o servidor recusa registrar opção obrigatória depois de opcional: numa
 * linha só, não haveria como saber qual valor é de qual.
 */
export function repartir(comando: ComandoDisponivel, resto: string) {
  const opcoes: Record<string, string> = {};
  let sobra = resto.trim();

  comando.opcoes.forEach((opcao, i) => {
    const ultima = i === comando.opcoes.length - 1;

    if (!sobra) return;

    if (ultima) {
      opcoes[opcao.nome] = sobra;
      sobra = "";
      return;
    }

    const espaco = sobra.search(/\s/);

    if (espaco < 0) {
      opcoes[opcao.nome] = sobra;
      sobra = "";
      return;
    }

    opcoes[opcao.nome] = sobra.slice(0, espaco);
    sobra = sobra.slice(espaco).trimStart();
  });

  return opcoes;
}

export function useComandos(guildId: string | undefined) {
  const { data: comandos = [] } = useFindComandos(guildId);

  const filtrar = useCallback(
    (termo: string) => {
      const alvo = termo.toLowerCase();

      /// Quem começa igual vem antes de quem só contém — digitar "pl" tem que
      /// pôr `/play` no topo, e não um `/replay` de outro bot.
      return comandos
        .filter((c) => !alvo || c.nome.includes(alvo) || c.descricao.toLowerCase().includes(alvo))
        .sort((a, b) => Number(b.nome.startsWith(alvo)) - Number(a.nome.startsWith(alvo)))
        .slice(0, 10);
    },
    [comandos],
  );

  /**
   * A linha inteira virando uma invocação, ou `null` se não for uma.
   *
   * `null` não é erro: quem escreve `/me diverti hoje` está conversando, e a
   * mensagem segue como texto, do jeito que sempre seguiu.
   */
  const analisar = useCallback(
    (texto: string) => {
      if (!texto.startsWith("/")) return null;

      const linha = texto.slice(1);
      const espaco = linha.search(/\s/);
      const nome = (espaco < 0 ? linha : linha.slice(0, espaco)).toLowerCase();

      const comando = comandos.find((c) => c.nome === nome);
      if (!comando) return null;

      const resto = espaco < 0 ? "" : linha.slice(espaco + 1);
      const opcoes = repartir(comando, resto);

      /// A que falta, para a dica poder cobrar antes de mandar.
      const faltando = comando.opcoes.filter((o) => o.obrigatoria && !opcoes[o.nome]);

      return { comando, opcoes, faltando };
    },
    [comandos],
  );

  const algum = useMemo(() => comandos.length > 0, [comandos]);

  return { filtrar, analisar, algum };
}
