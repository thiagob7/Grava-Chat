export type NoticeKind = "note" | "tip" | "important" | "warning" | "caution";

export type TextPiece =
  | { kind: "texto"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "notice"; notice: NoticeKind; text: string };

const KINDS = new Set<string>(["note", "tip", "important", "warning", "caution"]);

const QUOTE = /^\s{0,3}>\s?(.*)$/;
const HEADER = /^\[!([a-zA-Z]+)\]\s*$/;

function isKind(name: string): name is NoticeKind {
  return KINDS.has(name);
}

export function fromNotices(content: string): TextPiece[] {
  const lines = content.split("\n");
  const pieces: TextPiece[] = [];

  let loose: string[] = [];
  let block: string[] | null = null;

  const closeText = () => {
    if (!loose.length) return;
    pieces.push({ kind: "texto", text: loose.join("\n") });
    loose = [];
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
      block ??= [];
      block.push(quoted[1] ?? "");
      continue;
    }

    closeBlock();
    loose.push(line);
  }

  closeBlock();
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
