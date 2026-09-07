import { PONTE_DE_TEMA, nomesDeclaradosNoTema } from "~/features/configuracoes/lib/ponte-de-tema";
import { TOKENS_DERIVADOS } from "~/features/configuracoes/lib/cores-mae";

/*
  O que um tema declara, e o que disso chega na tela.

  O irmão deste arquivo, `compatibilidade-do-tema.ts`, faz a mesma pergunta
  para as CLASSES que o tema mira. Só que a maioria dos temas da comunidade
  não mira classe nenhuma: eles declaram variável e contam que o app inteiro
  leia. Sem esta contagem, "importei e não mudou nada" não tinha resposta —
  a pessoa via o CSS aplicado e a tela igual, sem saber onde parou.

  São três destinos possíveis para cada variável que o tema declara:

  - `traduzidos`  a ponte leva a um token que o app lê. Vira cor na tela.
  - `deduzidos`   ninguém declarou, mas as cores-mãe geram a partir do que foi
                  declarado — é o `completarComDerivacao`.
  - `ignorados`   o tema declarou e ninguém lê. É a lista de trabalho da ponte.

  O que interessa é o terceiro. Ele é curto, é nominal, e responde "por que o
  meu tema não pegou" sem ninguém precisar abrir o inspetor.
*/

export interface CompatibilidadeDeTokens {
  /// Declarados pelo tema que a ponte leva a um token nosso.
  traduzidos: string[];
  /// Nossos tokens que saem por derivação, sem o tema ter falado deles.
  deduzidos: string[];
  /// Declarados pelo tema que não chegam a lugar nenhum.
  ignorados: string[];
}

/*
  Variáveis que o tema define para uso próprio, não para o app.

  Um tema da comunidade declara `--primary-theme-accent` e seis tons dela, e depois usa
  esses nomes nas próprias regras. Contar isso como "ignorado" seria mentira:
  o valor É usado, só que dentro do tema. O sinal é o tema referenciar o
  mesmo nome com `var()` em algum lugar.
*/
const usadaPeloProprioTema = (css: string, nome: string) =>
  css.includes(`var(${nome}`) || css.includes(`var( ${nome}`);

export function conferirTokens(css: string): CompatibilidadeDeTokens {
  const declarados = nomesDeclaradosNoTema(css);

  const traduzidos: string[] = [];
  const ignorados: string[] = [];
  const destinos = new Set<string>();

  for (const nome of [...declarados].sort()) {
    const alvos = PONTE_DE_TEMA[nome];

    if (alvos) {
      traduzidos.push(nome);
      for (const alvo of alvos) destinos.add(alvo);
      continue;
    }

    if (!usadaPeloProprioTema(css, nome)) ignorados.push(nome);
  }

  /*
    Derivado é o que as cores-mãe preenchem e o tema não pediu. Se ele mesmo
    já mandou o valor, não é dedução — é o que ele disse.
  */
  const deduzidos = [...TOKENS_DERIVADOS]
    .filter((token) => !destinos.has(token))
    .sort();

  return { traduzidos, deduzidos, ignorados };
}
