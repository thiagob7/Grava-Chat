export const PAPEIS_DE_CURSOR = [
  "padrao",
  "clicavel",
  "texto",
  "bloqueado",
  "arrastar",
  "arrastando",
] as const;

export type PapelDeCursor = (typeof PAPEIS_DE_CURSOR)[number];

export const NOMES_DOS_PAPEIS: Record<PapelDeCursor, { titulo: string; onde: string }> = {
  padrao: { titulo: "Padrão", onde: "Em qualquer lugar que não seja um dos abaixo." },
  clicavel: { titulo: "Clicável", onde: "Botões, links e tudo que responde ao clique." },
  texto: { titulo: "Texto", onde: "Campos de escrita e texto selecionável." },
  bloqueado: { titulo: "Bloqueado", onde: "Botão desligado, ação que você não pode fazer." },
  arrastar: { titulo: "Arrastar", onde: "O que dá para pegar e mover." },
  arrastando: { titulo: "Arrastando", onde: "Enquanto você segura e move." },
};

export const RESERVA: Record<PapelDeCursor, string> = {
  padrao: "default",
  clicavel: "pointer",
  texto: "text",
  bloqueado: "not-allowed",
  arrastar: "grab",
  arrastando: "grabbing",
};

export interface CursorImportado {
  imagem: string;
  largura: number;
  altura: number;
  pontoX: number;
  pontoY: number;
}

/*
  O navegador recusa cursor acima de 128 px, e recusa calado: o tema parece
  quebrado e nada explica por quê. Por isso o limite é nosso, com mensagem.
*/
export const LIMITES_DO_CURSOR = {
  lado: 128,
  ladoRecomendado: 64,
  bytes: 256 * 1024,
};

export class CursorRecusado extends Error {}

const TIPOS = new Set(["image/png", "image/webp", "image/svg+xml"]);

/*
  GIF entra em `image/gif` e o navegador até aceita, mas só desenha o primeiro
  quadro. Recusar é mais honesto do que entregar um cursor parado para quem
  escolheu um animado.
*/
export async function lerCursor(arquivo: File): Promise<CursorImportado> {
  if (arquivo.type === "image/gif") {
    throw new CursorRecusado("O navegador não anima cursor: só o primeiro quadro apareceria.");
  }

  if (!TIPOS.has(arquivo.type)) {
    throw new CursorRecusado("Use PNG, WebP ou SVG.");
  }

  if (arquivo.size > LIMITES_DO_CURSOR.bytes) {
    throw new CursorRecusado("A imagem passa de 256 KB. Cursor é pequeno; use um arquivo menor.");
  }

  const imagem = await comoDataUri(arquivo);
  const { largura, altura } = await medir(imagem);

  if (largura > LIMITES_DO_CURSOR.lado || altura > LIMITES_DO_CURSOR.lado) {
    throw new CursorRecusado(
      `O navegador ignora cursor acima de ${LIMITES_DO_CURSOR.lado} px. Esta tem ${largura} por ${altura}.`,
    );
  }

  return { imagem, largura, altura, pontoX: 0, pontoY: 0 };
}

/*
  O ponto de clique fica preso perto do canto superior esquerdo. Solto, ele
  vira uma mentira: a pessoa mira na ponta do desenho e acerta outro lugar da
  tela — e num tema que se instala de terceiros isso deixa de ser deselegância
  e vira armadilha.
*/
export const pontoPermitido = (valor: number, lado: number) =>
  Math.max(0, Math.min(Math.round(valor), Math.floor(lado / 2)));

export function comoRegra(cursor: CursorImportado | null, papel: PapelDeCursor) {
  if (!cursor) return null;

  const x = pontoPermitido(cursor.pontoX, cursor.largura);
  const y = pontoPermitido(cursor.pontoY, cursor.altura);

  return `url("${cursor.imagem}") ${x} ${y}, ${RESERVA[papel]}`;
}

function comoDataUri(arquivo: File) {
  return new Promise<string>((resolver, recusar) => {
    const leitor = new FileReader();

    leitor.onload = () => resolver(String(leitor.result));
    leitor.onerror = () => recusar(new CursorRecusado("Não consegui ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

function medir(dataUri: string) {
  return new Promise<{ largura: number; altura: number }>((resolver, recusar) => {
    const img = new Image();

    img.onload = () =>
      resolver({
        largura: img.naturalWidth || LIMITES_DO_CURSOR.ladoRecomendado,
        altura: img.naturalHeight || LIMITES_DO_CURSOR.ladoRecomendado,
      });
    img.onerror = () => recusar(new CursorRecusado("Esse arquivo não abriu como imagem."));
    img.src = dataUri;
  });
}
