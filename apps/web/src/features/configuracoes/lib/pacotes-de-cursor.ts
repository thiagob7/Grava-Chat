import {
  PAPEIS_DE_CURSOR,
  type CursorImportado,
  type PapelDeCursor,
} from "~/features/configuracoes/lib/cursor-importado";

/*
  As imagens são varridas da pasta em vez de importadas uma a uma. São oito
  conjuntos de seis papéis: escrever 48 linhas de importação, e mantê-las em
  ordem, seria o tipo de trabalho que a máquina faz sem errar e a gente não.

  O `eager` é de propósito: o painel mostra todos os conjuntos lado a lado, e
  carregar sob demanda só adiaria a mesma busca para o instante em que a tela
  abre.
*/
const ARQUIVOS = import.meta.glob<string>("../../../assets/cursores/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

const imagem = (pacote: string, papel: PapelDeCursor) => {
  const caminho = `../../../assets/cursores/${pacote}/${papel}.png`;
  const url = ARQUIVOS[caminho];

  if (!url) throw new Error(`cursor ausente: ${pacote}/${papel}`);

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
type Ponto = readonly [number, number];
type Pontos = Record<PapelDeCursor, Ponto>;

const COMUNS = {
  texto: [31, 32],
  bloqueado: [7, 2],
  arrastar: [32, 32],
  arrastando: [32, 32],
} as const;

const PONTOS: Record<string, Pontos> = {
  contorno: { padrao: [21, 12], clicavel: [19, 4], ...COMUNS },
  solido: { padrao: [21, 12], clicavel: [19, 8], ...COMUNS },
  fino: { padrao: [10, 4], clicavel: [18, 8], ...COMUNS },
  "solido-fino": { padrao: [10, 8], clicavel: [18, 12], ...COMUNS },
  pequeno: { padrao: [19, 12], clicavel: [22, 10], ...COMUNS },
  ficcao: { padrao: [11, 6], clicavel: [18, 8], ...COMUNS },
  desenho: { padrao: [13, 4], clicavel: [19, 4], ...COMUNS },
  manopla: { padrao: [8, 2], clicavel: [8, 2], ...COMUNS },
};

const LADO = 64;

export interface PacoteDeCursor {
  id: string;
  nome: string;
  detalhe: string;
  cursores: Record<PapelDeCursor, CursorImportado>;
}

const montar = (id: string): Record<PapelDeCursor, CursorImportado> =>
  Object.fromEntries(
    PAPEIS_DE_CURSOR.map((papel) => [
      papel,
      {
        imagem: imagem(id, papel),
        largura: LADO,
        altura: LADO,
        pontoX: PONTOS[id]![papel][0],
        pontoY: PONTOS[id]![papel][1],
      } satisfies CursorImportado,
    ]),
  ) as Record<PapelDeCursor, CursorImportado>;

const DESCRICOES: [string, string, string][] = [
  ["contorno", "Contorno", "Traço marcado. Some menos sobre imagem e vídeo."],
  ["solido", "Sólido", "Sem contorno, mais perto do cursor do sistema."],
  ["fino", "Fino", "Traço leve e ponta pequena."],
  ["solido-fino", "Fino sólido", "O fino sem contorno, para telas claras."],
  ["pequeno", "Pequeno", "Desenho compacto, ocupa menos da tela."],
  ["ficcao", "Ficção", "Ponta angular, de painel de nave."],
  ["desenho", "Desenho", "Contorno grosso, de animação."],
  ["manopla", "Manopla", "Mão fechada de armadura. Para servidor de jogo."],
];

export const PACOTES_DE_CURSOR: PacoteDeCursor[] = DESCRICOES.map(
  ([id, nome, detalhe]) => ({ id, nome, detalhe, cursores: montar(id) }),
);
