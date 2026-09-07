/*
  Os avisos do markdown — `> [!NOTE]` e os quatro irmãos.

  É a forma do GitHub, e é a que a referência usa: uma citação cujo primeiro
  conteúdo é `[!TIPO]` deixa de ser citação e vira um bloco com cor e título
  próprios. Os temas miram os seis nomes (`alert` mais um por tipo), e sem a
  peça eles não tinham onde pousar — o texto saía cru, com o `>` e os colchetes
  à mostra.

  Aqui só o recorte: o que é citação, o que é aviso, e o que sobrou de texto. O
  desenho fica no componente, e o conteúdo de dentro volta a passar pelo mesmo
  caminho de sempre — menção, emoji e link continuam valendo dentro de um aviso.
*/

export type TipoDeAviso = "note" | "tip" | "important" | "warning" | "caution";

export type PedacoDeTexto =
  | { tipo: "texto"; texto: string }
  | { tipo: "citacao"; texto: string }
  | { tipo: "aviso"; aviso: TipoDeAviso; texto: string };

const TIPOS = new Set<string>(["note", "tip", "important", "warning", "caution"]);

/// `>` com espaço opcional, como no GitHub: `>x` também é citação.
const CITACAO = /^\s{0,3}>\s?(.*)$/;
const CABECALHO = /^\[!([a-zA-Z]+)\]\s*$/;

function ehTipo(nome: string): nome is TipoDeAviso {
  return TIPOS.has(nome);
}

/*
  Junta as linhas seguidas que começam com `>` e decide o que o bloco é. Linha
  em branco encerra o bloco — duas citações separadas por uma linha vazia são
  duas citações, e não uma.
*/
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

/// O rótulo que vai no topo do bloco. A referência escreve o nome do tipo.
export const ROTULO_DO_AVISO: Record<TipoDeAviso, string> = {
  note: "Nota",
  tip: "Dica",
  important: "Importante",
  warning: "Atenção",
  caution: "Cuidado",
};
