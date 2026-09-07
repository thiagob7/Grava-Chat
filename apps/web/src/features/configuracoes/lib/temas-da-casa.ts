import { lerCabecalhoDoTema } from "@gravae/shared";

import carvao from "~/features/configuracoes/temas/carvao.css?raw";
import floresta from "~/features/configuracoes/temas/floresta.css?raw";
import manha from "~/features/configuracoes/temas/manha.css?raw";
import nebulosa from "~/features/configuracoes/temas/nebulosa.css?raw";

/*
  Os temas da casa.

  São arquivos de CSS como qualquer tema importado, com uma diferença de
  formato que é a regra: só variáveis, só em `:root`. Nada de mirar classe,
  nada de `!important`. Um tema assim repinta o app inteiro pela cadeia de
  tokens e nunca quebra quando a árvore muda — nem a nossa, nem a de ninguém.

  O teste ao lado trava esse contrato: cada tema declara a paleta inteira, e
  nenhuma variável que o app não lê.
*/
export const AUTOR_DA_CASA = "Gravaê";

export interface TemaDaCasa {
  chave: string;
  nome: string;
  descricao: string;
  css: string;
}

const ARQUIVOS: Record<string, string> = { nebulosa, carvao, manha, floresta };

export const TEMAS_DA_CASA: TemaDaCasa[] = Object.entries(ARQUIVOS).map(([chave, css]) => {
  const cabecalho = lerCabecalhoDoTema(css);

  return { chave, nome: cabecalho.nome ?? "", descricao: cabecalho.descricao ?? "", css };
});
