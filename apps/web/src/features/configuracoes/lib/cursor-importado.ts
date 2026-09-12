export const CURSOR_ROLES = [
  "padrao",
  "clicavel",
  "texto",
  "bloqueado",
  "arrastar",
  "arrastando",
] as const;

export type CursorRole = (typeof CURSOR_ROLES)[number];

export const ROLES_NAMES: Record<CursorRole, { title: string; where: string }> = {
  padrao: { title: "Padrão", where: "Em qualquer lugar que não seja um dos abaixo." },
  clicavel: { title: "Clicável", where: "Botões, links e tudo que responde ao clique." },
  texto: { title: "Texto", where: "Campos de escrita e texto selecionável." },
  bloqueado: { title: "Bloqueado", where: "Botão desligado, ação que você não pode fazer." },
  arrastar: { title: "Arrastar", where: "O que dá para pegar e mover." },
  arrastando: { title: "Arrastando", where: "Enquanto você segura e move." },
};

export const RESERVE: Record<CursorRole, string> = {
  padrao: "default",
  clicavel: "pointer",
  texto: "text",
  bloqueado: "not-allowed",
  arrastar: "grab",
  arrastando: "grabbing",
};

export interface CursorImported {
  image: string;
  width: number;
  height: number;
  dotX: number;
  dotY: number;
}

/*
  O navegador recusa cursor acima de 128 px, e recusa calado: o tema parece
  quebrado e nada explica por quê. Por isso o limite é nosso, com mensagem.
*/
export const CURSOR_LIMITS = {
  side: 128,
  sideRecommended: 64,
  bytes: 256 * 1024,
};

export class CursorRefused extends Error {}

const KINDS = new Set(["image/png", "image/webp", "image/svg+xml"]);

/*
  GIF entra em `image/gif` e o navegador até aceita, mas só desenha o primeiro
  quadro. Recusar é mais honesto do que entregar um cursor parado para quem
  escolheu um animado.
*/
export async function readCursor(file: File): Promise<CursorImported> {
  if (file.type === "image/gif") {
    throw new CursorRefused("O navegador não anima cursor: só o primeiro quadro apareceria.");
  }

  if (!KINDS.has(file.type)) {
    throw new CursorRefused("Use PNG, WebP ou SVG.");
  }

  if (file.size > CURSOR_LIMITS.bytes) {
    throw new CursorRefused("A imagem passa de 256 KB. Cursor é pequeno; use um arquivo menor.");
  }

  const image = await asDataUri(file);
  const { width, height } = await measure(image);

  if (width > CURSOR_LIMITS.side || height > CURSOR_LIMITS.side) {
    throw new CursorRefused(
      `O navegador ignora cursor acima de ${CURSOR_LIMITS.side} px. Esta tem ${width} por ${height}.`,
    );
  }

  return { image, width, height, dotX: 0, dotY: 0 };
}

/*
  O ponto de clique fica preso perto do canto superior esquerdo. Solto, ele
  vira uma mentira: a pessoa mira na ponta do desenho e acerta outro lugar da
  tela — e num tema que se instala de terceiros isso deixa de ser deselegância
  e vira armadilha.
*/
export const dotAllowed = (value: number, side: number) =>
  Math.max(0, Math.min(Math.round(value), Math.floor(side / 2)));

/*
  A imagem entra crua numa declaração de CSS, então ela precisa ser um endereço
  e nada mais: aspas, barra invertida ou quebra de linha no meio fechariam o
  `url()` e o resto viraria CSS escrito por quem mandou o pacote.

  E há o motivo mais chato: `cursor` é uma propriedade herdada. Valor que o
  navegador não entende não cai na reserva — ele invalida a declaração inteira,
  a propriedade passa a herdar do pai, e o app inteiro fica sem cursor de
  clique. Um campo torto num pacote de cursores não pode ter esse poder.
*/
const ADDRESS = /^(?:data:image\/|https?:\/\/|\/)[^"'\\\s]*$/;

export function asRule(cursor: CursorImported | null, role: CursorRole) {
  if (!cursor || !ADDRESS.test(cursor.image)) return null;

  const x = dotAllowed(cursor.dotX, cursor.width);
  const y = dotAllowed(cursor.dotY, cursor.height);

  return `url("${cursor.image}") ${x} ${y}, ${RESERVE[role]}`;
}

function asDataUri(file: File) {
  return new Promise<string>((resolve, refuse) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => refuse(new CursorRefused("Não consegui ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function measure(dataUri: string) {
  return new Promise<{ width: number; height: number }>((resolve, refuse) => {
    const img = new Image();

    img.onload = () =>
      resolve({
        width: img.naturalWidth || CURSOR_LIMITS.sideRecommended,
        height: img.naturalHeight || CURSOR_LIMITS.sideRecommended,
      });
    img.onerror = () => refuse(new CursorRefused("Esse arquivo não abriu como imagem."));
    img.src = dataUri;
  });
}
