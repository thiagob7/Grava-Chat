export interface Ancora {
  id: string;
  /// Distância do topo da âncora até o topo do painel, em pixels. Negativa
  /// quando ela já subiu além da borda.
  topo: number;
}

export interface Leitura {
  ancoras: Ancora[];
  /// A que distância do topo do painel fica a linha de leitura.
  linha: number;
  /*
    Quanto o painel rola do topo ao fim (`scrollHeight - clientHeight`), e NÃO
    quanto ainda falta rolar.

    A diferença derrubou dois testes na primeira escrita desta função, e é uma
    distinção fácil de perder: as duas medidas valem zero no fim de uma tela
    longa, mas só a TOTAL vale zero numa tela que não rola. Usar a restante
    fazia toda tela marcar a primeira seção assim que chegasse ao fim.
  */
  rolagemTotal: number;
}

/**
 * Qual sub-seção a lateral deve acender.
 *
 * Vale a ÚLTIMA cujo topo já passou da linha de leitura, e não a primeira
 * visível: rolando devagar, as duas aparecem juntas por um bom tempo e a
 * lateral ficaria oscilando entre elas.
 *
 * **Isto é função pura de propósito.** A regra morava dentro do `onScroll` do
 * modal e errou duas vezes, das duas com o mesmo sintoma — o miolo mostrando
 * uma seção e a lateral apontando outra —, e das duas só dava pra ver abrindo
 * a tela certa na altura certa de janela. Fora do componente ela cabe numa
 * tabela de casos.
 */
export function subSecaoAtiva({ ancoras, linha, rolagemTotal }: Leitura): string | null {
  const primeira = ancoras[0]?.id ?? null;
  if (!ancoras.length) return null;

  /*
    Tela que não rola não tem "seção atual" — tem a primeira.

    Sem esta guarda, uma tela curta abria com a última seção marcada para
    sempre: sem rolagem, o painel já está no fim desde o primeiro instante, e
    qualquer regra de "chegou ao fim" dispara de cara. Foi o que acontecia em
    Bate-papo, com Exibição, Entrada e Mídia cabendo juntas na tela.

    Os oito pixels de folga são para a rolagem que existe só no papel — uma
    borda, uma sombra — e que ninguém consegue rolar.
  */
  if (rolagemTotal <= 8) return primeira;

  /*
    Não existe regra de "chegou ao fim", e a falta dela é o conserto.

    Existia uma: no fim da rolagem, valia a última seção. A intenção era boa —
    uma seção curta no pé da página nunca sobe até a linha de leitura, e sem
    ajuda ela seria a única impossível de marcar. Mas a regra confundia "estar
    no fim" com "estar olhando a última", e as duas coisas só coincidem quando
    a última seção enche a tela sozinha.

    Em Minha conta ela quebrava na cara: Dispositivos, Usuários bloqueados,
    Aplicativos autorizados e Sessões cabem TODAS na última tela. Clicar em
    Dispositivos rolava até o fim, a regra disparava, e a lateral pulava para
    Sessões — pulando duas seções e desfazendo o clique.

    A última seção continua alcançável: clicar nela na lateral a marca, e a
    marca do clique só cai quando a pessoa rola por conta própria. O que se
    perde é marcá-la ROLANDO, quando ela é curta demais para chegar à linha —
    e ficar uma seção atrás é bem menos errado que pular três.
  */
  let atual: string | null = null;
  for (const ancora of ancoras) {
    if (ancora.topo <= linha) atual = ancora.id;
  }

  return atual ?? primeira;
}
