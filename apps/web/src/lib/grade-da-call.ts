

export interface ParticipanteDaGrade {
  identity: string;
  transmitindo: boolean;
}

export type TipoDeQuadro = "pessoa" | "tela";

export interface QuadroDaGrade<T> {
  key: string;
  tipo: TipoDeQuadro;
  de: T;
}

export function montarGrade<T extends ParticipanteDaGrade>(participantes: T[]): QuadroDaGrade<T>[] {
  return participantes.flatMap((de) => {
    const pessoa: QuadroDaGrade<T> = { key: de.identity, tipo: "pessoa", de };

    if (!de.transmitindo) return [pessoa];

    return [pessoa, { key: `${de.identity}:tela`, tipo: "tela", de } satisfies QuadroDaGrade<T>];
  });
}

export interface FormatoDaGrade {
  colunas: number;
  denso: boolean;
}

const LIMITE_DENSO = 9;

export function formatoDaGrade(quadros: number): FormatoDaGrade {
  const colunas =
    quadros <= 1 ? 1 : quadros <= 4 ? 2 : quadros <= 9 ? 3 : quadros <= 16 ? 4 : 5;

  return { colunas, denso: quadros > LIMITE_DENSO };
}

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
  if (!destaque) return null;

  return { destaque, faixa: quadros.filter((q) => q.key !== chaveFocada) };
}
