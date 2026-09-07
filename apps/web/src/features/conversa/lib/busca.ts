/*
  A busca fala por chaves: `from:fulano in:geral has:imagem before:2026-09-01`.
  Aqui o texto vira o que sobra dele (o termo) mais cada chave entendida. Quem
  resolve nome em id é o componente, que conhece o servidor; aqui é só gramática.
*/
export type TemNaBusca = "link" | "imagem" | "video" | "som" | "arquivo" | "anexo";

export interface BuscaInterpretada {
  termo: string;
  from?: string;
  in?: string;
  mentions?: string;
  has?: TemNaBusca;
  before?: string;
  after?: string;
  on?: string;
  pinned?: boolean;
  authorType?: "usuario" | "bot";
  sort?: "recente" | "antiga";
}

export const FILTROS_DE_BUSCA: { chave: string; dica: string }[] = [
  { chave: "from", dica: "um usuário" },
  { chave: "in", dica: "um canal" },
  { chave: "has", dica: "link, imagem, vídeo, som, arquivo" },
  { chave: "mentions", dica: "um usuário" },
  { chave: "before", dica: "uma data, AAAA-MM-DD" },
  { chave: "on", dica: "uma data, AAAA-MM-DD" },
  { chave: "after", dica: "uma data, AAAA-MM-DD" },
  { chave: "pinned", dica: "verdadeiro ou falso" },
  { chave: "author-type", dica: "usuário ou bot" },
  { chave: "sort", dica: "recente ou antiga" },
];

const TEM: Record<string, TemNaBusca> = {
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

const DIA = /^\d{4}-\d{2}-\d{2}$/;

function dia(valor: string): string | undefined {
  return DIA.test(valor) ? valor : undefined;
}

export function interpretarBusca(texto: string): BuscaInterpretada {
  const saida: BuscaInterpretada = { termo: "" };
  const sobras: string[] = [];

  for (const pedaco of texto.trim().split(/\s+/).filter(Boolean)) {
    const m = /^([a-z-]+):(.+)$/i.exec(pedaco);
    if (!m) {
      sobras.push(pedaco);
      continue;
    }

    const chave = m[1]!.toLowerCase();
    const valor = m[2]!;
    const nome = valor.replace(/^[@#]/, "");
    const baixo = valor.toLowerCase();

    if (chave === "from") saida.from = nome;
    else if (chave === "in") saida.in = nome;
    else if (chave === "mentions") saida.mentions = nome;
    else if (chave === "has" && TEM[baixo]) saida.has = TEM[baixo];
    else if (chave === "before") saida.before = dia(valor);
    else if (chave === "after") saida.after = dia(valor);
    else if (chave === "on" || chave === "during") saida.on = dia(valor);
    else if (chave === "pinned") saida.pinned = ["true", "verdadeiro", "sim", "yes"].includes(baixo) ? true : ["false", "falso", "nao", "não", "no"].includes(baixo) ? false : undefined;
    else if (chave === "author-type") saida.authorType = ["bot", "app", "webhook"].includes(baixo) ? "bot" : ["usuario", "usuário", "user"].includes(baixo) ? "usuario" : undefined;
    else if (chave === "sort" || chave === "order") saida.sort = ["antiga", "asc", "old", "oldest"].includes(baixo) ? "antiga" : ["recente", "desc", "new", "newest"].includes(baixo) ? "recente" : undefined;
    else sobras.push(pedaco);
  }

  saida.termo = sobras.join(" ");
  return saida;
}

/// Se há o que procurar: texto de duas letras, ou ao menos um filtro que vale.
export function temOQueBuscar(b: BuscaInterpretada): boolean {
  return (
    b.termo.length >= 2 ||
    Boolean(b.from || b.in || b.mentions || b.has || b.before || b.after || b.on || b.authorType) ||
    b.pinned !== undefined
  );
}
