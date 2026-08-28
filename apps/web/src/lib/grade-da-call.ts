/**
 * Como a grade da chamada se organiza: quantos quadros, quais, e em quantas
 * colunas.
 *
 * Duas decisões moram aqui, e as duas eram problema.
 *
 * A primeira: quem transmite ocupa DOIS quadros, não um. Antes a transmissão
 * era desenhada por cima do quadro da pessoa, e o avatar dela sumia atrás do
 * botão "Assistir" — você deixava de ver quem estava na chamada justamente
 * quando alguém abria uma live. Agora a pessoa continua no lugar dela e a
 * transmissão ganha um quadro ao lado.
 *
 * A segunda: o número de colunas era no máximo três, o que virava cinco
 * fileiras de quadros com quinze pessoas e estourava a altura da tela.
 *
 * O módulo é genérico de propósito — não conhece `VoiceTile` nem o store — pra
 * que a regra tenha teste sem precisar de uma sala do LiveKit no ar.
 */

export interface ParticipanteDaGrade {
  identity: string;
  transmitindo: boolean;
}

export type TipoDeQuadro = "pessoa" | "tela";

export interface QuadroDaGrade<T> {
  /// chave estável de React — a mesma pessoa aparece em dois quadros
  key: string;
  tipo: TipoDeQuadro;
  de: T;
}

/**
 * A transmissão entra logo depois da pessoa que a abriu, e não no fim da lista:
 * é assim que se lê "esta live é dele" sem precisar de legenda.
 */
export function montarGrade<T extends ParticipanteDaGrade>(participantes: T[]): QuadroDaGrade<T>[] {
  return participantes.flatMap((de) => {
    const pessoa: QuadroDaGrade<T> = { key: de.identity, tipo: "pessoa", de };

    if (!de.transmitindo) return [pessoa];

    return [pessoa, { key: `${de.identity}:tela`, tipo: "tela", de } satisfies QuadroDaGrade<T>];
  });
}

export interface FormatoDaGrade {
  colunas: number;
  /*
    Modo denso: quadros e avatares menores.

    Existe porque numa chamada grande a informação que importa é QUEM está lá,
    não o tamanho da carinha de cada um. Sem isso, dezesseis quadros em tamanho
    normal exigem rolagem — e rolar uma chamada é perder a noção de quem está
    presente, que é a única coisa que a grade precisa entregar.
  */
  denso: boolean;
}

const LIMITE_DENSO = 9;

export function formatoDaGrade(quadros: number): FormatoDaGrade {
  const colunas =
    quadros <= 1 ? 1 : quadros <= 4 ? 2 : quadros <= 9 ? 3 : quadros <= 16 ? 4 : 5;

  return { colunas, denso: quadros > LIMITE_DENSO };
}

/**
 * O modo foco: um quadro grande e o resto numa faixa embaixo.
 *
 * É o que o Discord faz quando você clica num card, e resolve um problema real
 * da grade igualitária: com quatro pessoas, todo mundo ocupa o mesmo espaço
 * mesmo quando só uma delas interessa naquele momento — a que está com a câmera
 * aberta, ou a que está falando.
 *
 * Separar aqui em vez de no componente é o que permite testar a regra que
 * importa: o quadro focado sai da faixa, e a faixa preserva a ordem original.
 */
export interface GradeEmFoco<T> {
  destaque: QuadroDaGrade<T>;
  faixa: QuadroDaGrade<T>[];
}

export function focar<T>(
  quadros: QuadroDaGrade<T>[],
  chaveFocada: string | null,
): GradeEmFoco<T> | null {
  if (!chaveFocada) return null;

  const destaque = quadros.find((q) => q.key === chaveFocada);
  /*
    Foco em quadro que não existe mais — a pessoa saiu da chamada, ou encerrou a
    transmissão — devolve `null` pra grade voltar ao normal. Sem isso a tela
    ficaria presa num destaque vazio.
  */
  if (!destaque) return null;

  return { destaque, faixa: quadros.filter((q) => q.key !== chaveFocada) };
}
