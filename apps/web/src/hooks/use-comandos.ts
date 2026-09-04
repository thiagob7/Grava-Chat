import { useCallback, useMemo } from "react";
import type { ComandoDisponivel } from "@gravae/shared";

import { useFindComandos } from "~/@core/application/queries/comando/use-find-comandos";

export function detectarComando(texto: string, cursor: number) {
  if (!texto.startsWith("/")) return null;

  const ate = texto.slice(0, cursor);
  if (ate.includes(" ")) return null;

  return { termo: ate.slice(1) };
}

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

      return comandos
        .filter((c) => !alvo || c.nome.includes(alvo) || c.descricao.toLowerCase().includes(alvo))
        .sort((a, b) => Number(b.nome.startsWith(alvo)) - Number(a.nome.startsWith(alvo)))
        .slice(0, 10);
    },
    [comandos],
  );

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

      const faltando = comando.opcoes.filter((o) => o.obrigatoria && !opcoes[o.nome]);

      return { comando, opcoes, faltando };
    },
    [comandos],
  );

  const algum = useMemo(() => comandos.length > 0, [comandos]);

  return { filtrar, analisar, algum };
}
