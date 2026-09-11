export type HasSearch = "link" | "imagem" | "video" | "som" | "arquivo" | "anexo";

export interface SearchParsed {
  term: string;
  from?: string;
  in?: string;
  mentions?: string;
  has?: HasSearch;
  before?: string;
  after?: string;
  on?: string;
  pinned?: boolean;
  authorType?: "usuario" | "bot";
  sort?: "recente" | "antiga";
}

export const SEARCH_FILTERS: { key: string; hint: string }[] = [
  { key: "from", hint: "um usuário" },
  { key: "in", hint: "um canal" },
  { key: "has", hint: "link, imagem, vídeo, som, arquivo" },
  { key: "mentions", hint: "um usuário" },
  { key: "before", hint: "uma data, AAAA-MM-DD" },
  { key: "on", hint: "uma data, AAAA-MM-DD" },
  { key: "after", hint: "uma data, AAAA-MM-DD" },
  { key: "pinned", hint: "verdadeiro ou falso" },
  { key: "author-type", hint: "usuário ou bot" },
  { key: "sort", hint: "recente ou antiga" },
];

const HAS: Record<string, HasSearch> = {
  link: "link",
  links: "link",
  imagem: "imagem",
  image: "imagem",
  imagens: "imagem",
  video: "video",
  vídeo: "video",
  som: "som",
  audio: "som",
  áudio: "som",
  arquivo: "arquivo",
  file: "arquivo",
  anexo: "anexo",
  attachment: "anexo",
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function day(value: string): string | undefined {
  return DAY.test(value) ? value : undefined;
}

export function parseSearch(text: string): SearchParsed {
  const output: SearchParsed = { term: "" };
  const leftovers: string[] = [];

  for (const piece of text.trim().split(/\s+/).filter(Boolean)) {
    const m = /^([a-z-]+):(.+)$/i.exec(piece);
    if (!m) {
      leftovers.push(piece);
      continue;
    }

    const key = m[1]!.toLowerCase();
    const value = m[2]!;
    const name = value.replace(/^[@#]/, "");
    const down = value.toLowerCase();

    if (key === "from") output.from = name;
    else if (key === "in") output.in = name;
    else if (key === "mentions") output.mentions = name;
    else if (key === "has" && HAS[down]) output.has = HAS[down];
    else if (key === "before") output.before = day(value);
    else if (key === "after") output.after = day(value);
    else if (key === "on" || key === "during") output.on = day(value);
    else if (key === "pinned") output.pinned = ["true", "verdadeiro", "sim", "yes"].includes(down) ? true : ["false", "falso", "nao", "não", "no"].includes(down) ? false : undefined;
    else if (key === "author-type") output.authorType = ["bot", "app", "webhook"].includes(down) ? "bot" : ["usuario", "usuário", "user"].includes(down) ? "usuario" : undefined;
    else if (key === "sort" || key === "order") output.sort = ["antiga", "asc", "old", "oldest"].includes(down) ? "antiga" : ["recente", "desc", "new", "newest"].includes(down) ? "recente" : undefined;
    else leftovers.push(piece);
  }

  output.term = leftovers.join(" ");
  return output;
}

export function hasSearch(b: SearchParsed): boolean {
  return (
    b.term.length >= 2 ||
    Boolean(b.from || b.in || b.mentions || b.has || b.before || b.after || b.on || b.authorType) ||
    b.pinned !== undefined
  );
}
