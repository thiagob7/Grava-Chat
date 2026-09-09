export type TipoDeAviso = "note" | "tip" | "important" | "warning" | "caution";

export type PedacoDeTexto =
  | { tipo: "texto"; texto: string }
  | { tipo: "citacao"; texto: string }
  | { tipo: "aviso"; aviso: TipoDeAviso; texto: string };

const TIPOS = new Set<string>(["note", "tip", "important", "warning", "caution"]);

const CITACAO = /^\s{0,3}>\s?(.*)$/;
const CABECALHO = /^\[!([a-zA-Z]+)\]\s*$/;

function ehTipo(nome: string): nome is TipoDeAviso {
  return TIPOS.has(nome);
}

export function partirEmAvisos(conteudo: string): PedacoDeTexto[] {
  const linhas = conteudo.split("\n");
  const pedacos: PedacoDeTexto[] = [];

  let soltas: string[] = [];
  let bloco: string[] | null = null;

  const fecharTexto = () => {
    if (!soltas.length) return;
    pedacos.push({ tipo: "texto", texto: soltas.join("\n") });
    soltas = [];
  };

  const fecharBloco = () => {
    if (!bloco) return;

    const [primeira, ...resto] = bloco;
    const cabecalho = CABECALHO.exec(primeira ?? "");
    const tipo = cabecalho?.[1]?.toLowerCase() ?? "";

    if (cabecalho && ehTipo(tipo)) {
      pedacos.push({ tipo: "aviso", aviso: tipo, texto: resto.join("\n").trim() });
    } else {
      pedacos.push({ tipo: "citacao", texto: bloco.join("\n").trim() });
    }

    bloco = null;
  };

  for (const linha of linhas) {
    const citada = CITACAO.exec(linha);

    if (citada) {
      fecharTexto();
      bloco ??= [];
      bloco.push(citada[1] ?? "");
      continue;
    }

    fecharBloco();
    soltas.push(linha);
  }

  fecharBloco();
  fecharTexto();

  return pedacos.filter((p) => p.tipo !== "texto" || p.texto.trim() !== "");
}

export const ROTULO_DO_AVISO: Record<TipoDeAviso, string> = {
  note: "Nota",
  tip: "Dica",
  important: "Importante",
  warning: "Atenção",
  caution: "Cuidado",
};
