export type NoticeKind = "note" | "tip" | "important" | "warning" | "caution";

export type TextPiece =
  | { kind: "texto"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "notice"; notice: NoticeKind; text: string }
  | { kind: "titulo"; level: 1 | 2 | 3; text: string }
  | { kind: "lista"; ordered: boolean; items: string[] };

const KINDS = new Set<string>(["note", "tip", "important", "warning", "caution"]);

const QUOTE = /^\s{0,3}>\s?(.*)$/;
const HEADER = /^\[!([a-zA-Z]+)\]\s*$/;

/*
  Título e lista pedem o espaço depois do sinal, e é isso que separa um título
  de uma mensagem que começa com `#canal` ou de uma conta que abre com `-1`.
  Três níveis bastam: a partir do quarto, o tamanho já não muda nada na tela.
*/
const TITLE = /^\s{0,3}(#{1,3})\s+(.+)$/;
const BULLET = /^\s{0,3}[-*]\s+(.+)$/;
const NUMBER = /^\s{0,3}\d{1,3}[.)]\s+(.+)$/;

function isKind(name: string): name is NoticeKind {
  return KINDS.has(name);
}

export function fromNotices(content: string): TextPiece[] {
  const lines = content.split("\n");
  const pieces: TextPiece[] = [];

  let loose: string[] = [];
  let block: string[] | null = null;
  let items: { ordered: boolean; lines: string[] } | null = null;

  const closeText = () => {
    if (!loose.length) return;
    pieces.push({ kind: "texto", text: loose.join("\n") });
    loose = [];
  };

  const closeList = () => {
    if (!items) return;

    pieces.push({ kind: "lista", ordered: items.ordered, items: items.lines });
    items = null;
  };

  const closeBlock = () => {
    if (!block) return;

    const [first, ...rest] = block;
    const header = HEADER.exec(first ?? "");
    const kind = header?.[1]?.toLowerCase() ?? "";

    if (header && isKind(kind)) {
      pieces.push({ kind: "notice", notice: kind, text: rest.join("\n").trim() });
    } else {
      pieces.push({ kind: "quote", text: block.join("\n").trim() });
    }

    block = null;
  };

  for (const line of lines) {
    const quoted = QUOTE.exec(line);

    if (quoted) {
      closeText();
      closeList();
      block ??= [];
      block.push(quoted[1] ?? "");
      continue;
    }

    closeBlock();

    const title = TITLE.exec(line);

    if (title) {
      closeText();
      closeList();
      pieces.push({
        kind: "titulo",
        level: title[1]!.length as 1 | 2 | 3,
        text: title[2]!,
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBER.exec(line);

    if (bullet || numbered) {
      closeText();
      const ordered = Boolean(numbered);

      /* Trocar de marcador começa lista nova: hífen e número não se misturam. */
      if (items && items.ordered !== ordered) closeList();

      items ??= { ordered, lines: [] };
      items.lines.push((bullet?.[1] ?? numbered?.[1])!);
      continue;
    }

    closeList();
    loose.push(line);
  }

  closeBlock();
  closeList();
  closeText();

  return pieces.filter((p) => p.kind !== "texto" || p.text.trim() !== "");
}

export const NOTICE_LABEL: Record<NoticeKind, string> = {
  note: "Nota",
  tip: "Dica",
  important: "Importante",
  warning: "Atenção",
  caution: "Cuidado",
};
