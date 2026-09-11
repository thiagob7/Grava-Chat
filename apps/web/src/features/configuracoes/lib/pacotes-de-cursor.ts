import {
  CURSOR_ROLES,
  type CursorImported,
  type CursorRole,
} from "~/features/configuracoes/lib/cursor-importado";

/*
  As imagens são varridas da pasta em vez de importadas uma a uma. São oito
  conjuntos de seis papéis: escrever 48 linhas de importação, e mantê-las em
  ordem, seria o tipo de trabalho que a máquina faz sem errar e a gente não.

  O `eager` é de propósito: o painel mostra todos os conjuntos lado a lado, e
  carregar sob demanda só adiaria a mesma busca para o instante em que a tela
  abre.
*/
const FILES = import.meta.glob<string>("../../../assets/cursores/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const image = (packet: string, role: CursorRole) => {
  const path = `../../../assets/cursores/${packet}/${role}.png`;
  const url = FILES[path];

  if (!url) throw new Error(`cursor ausente: ${packet}/${role}`);

  return url;
};

/*
  Cada ponto de clique foi MEDIDO no desenho: é o meio da primeira linha com
  pixel opaco, que numa seta ou numa mão apontando é a ponta. Chutar aqui é o
  que faz um cursor bonito clicar dois centímetros ao lado do que a pessoa viu.

  Duas exceções, ambas de propósito. O cursor de texto usa o centro, porque a
  barra vertical não tem ponta. E as duas mãos de arrastar usam o centro
  também: elas se revezam no mesmo gesto, e pontos diferentes fariam o ponteiro
  pular no instante em que a mão fecha.
*/
type Dot = readonly [number, number];
type Points = Record<CursorRole, Dot>;

const COMMON = {
  texto: [31, 32],
  bloqueado: [7, 2],
  arrastar: [32, 32],
  arrastando: [32, 32],
} as const;

const POINTS: Record<string, Points> = {
  outline: { padrao: [21, 12], clicavel: [19, 4], ...COMMON },
  solid: { padrao: [21, 12], clicavel: [19, 8], ...COMMON },
  thin: { padrao: [10, 4], clicavel: [18, 8], ...COMMON },
  "solido-fino": { padrao: [10, 8], clicavel: [18, 12], ...COMMON },
  small: { padrao: [19, 12], clicavel: [22, 10], ...COMMON },
  fiction: { padrao: [11, 6], clicavel: [18, 8], ...COMMON },
  drawing: { padrao: [13, 4], clicavel: [19, 4], ...COMMON },
  gauntlet: { padrao: [8, 2], clicavel: [8, 2], ...COMMON },
};

const SIDE = 64;

export interface CursorPacket {
  id: string;
  name: string;
  detail: string;
  cursors: Record<CursorRole, CursorImported>;
}

const build = (id: string): Record<CursorRole, CursorImported> =>
  Object.fromEntries(
    CURSOR_ROLES.map((role) => [
      role,
      {
        image: image(id, role),
        width: SIDE,
        height: SIDE,
        dotX: POINTS[id]![role][0],
        dotY: POINTS[id]![role][1],
      } satisfies CursorImported,
    ]),
  ) as Record<CursorRole, CursorImported>;

const DESCRIPTIONS: [string, string, string][] = [
  ["contorno", "Contorno", "Traço marcado. Some menos sobre imagem e vídeo."],
  ["solido", "Sólido", "Sem contorno, mais perto do cursor do sistema."],
  ["fino", "Fino", "Traço leve e ponta pequena."],
  ["solido-fino", "Fino sólido", "O fino sem contorno, para telas claras."],
  ["pequeno", "Pequeno", "Desenho compacto, ocupa menos da tela."],
  ["ficcao", "Ficção", "Ponta angular, de painel de nave."],
  ["desenho", "Desenho", "Contorno grosso, de animação."],
  ["manopla", "Manopla", "Mão fechada de armadura. Para servidor de jogo."],
];

export const CURSOR_PACKETS: CursorPacket[] = DESCRIPTIONS.map(
  ([id, name, detail]) => ({ id, name, detail, cursors: build(id) }),
);
