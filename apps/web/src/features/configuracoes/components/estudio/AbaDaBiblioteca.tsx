import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Copy,
  Download,
  FolderUp,
  Library,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { comCabecalho, lerCabecalhoDoTema } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { Input, Label, Textarea, campoNu, grupoDeCampo } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useEstudio, type TemaSalvo } from "~/features/configuracoes/stores/estudio";
import { cn } from "~/lib/utils";

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const ancora = document.createElement("a");

  ancora.href = url;
  ancora.download = nome;
  document.body.appendChild(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(url);
}

const semExtensao = (nome: string) => nome.replace(/\.[^.]+$/, "");

/// O arquivo que sai no Exportar: o CSS com o cabeçalho reescrito a partir do
/// que a pessoa preencheu, para o tema se apresentar em qualquer outro app
/// que entenda esse formato.
function arquivoDoTema(tema: TemaSalvo): string {
  return comCabecalho(tema.css, {
    nome: tema.nome,
    descricao: tema.descricao ?? null,
    autor: tema.autor ?? null,
    versao: tema.versao ?? null,
    tags: tema.tags ?? [],
  });
}

export const AbaDaBiblioteca: React.FC = () => {
  const biblioteca = useEstudio((s) => s.biblioteca);
  const ativoId = useEstudio((s) => s.ativoId);
  const substituicoes = useEstudio((s) => s.substituicoes);
  const css = useEstudio((s) => s.css);

  const salvar = useEstudio((s) => s.salvarNaBiblioteca);
  const alternar = useEstudio((s) => s.alternarTema);
  const atualizar = useEstudio((s) => s.atualizarNaBiblioteca);
  const duplicar = useEstudio((s) => s.duplicarDaBiblioteca);
  const apagar = useEstudio((s) => s.apagarDaBiblioteca);
  const importarCss = useEstudio((s) => s.importarCssComoTema);
  const importarBiblioteca = useEstudio((s) => s.importarBiblioteca);

  const confirmar = useConfirmar();
  const arquivoCss = useRef<HTMLInputElement>(null);
  const pasta = useRef<HTMLInputElement>(null);
  const arquivoJson = useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  const [nomeNovo, setNomeNovo] = useState("");

  const termo = busca.trim().toLowerCase();

  const filtrados = biblioteca.filter(
    (tema) =>
      !termo ||
      tema.nome.toLowerCase().includes(termo) ||
      (tema.autor ?? "").toLowerCase().includes(termo) ||
      (tema.tags ?? []).some((tag) => tag.toLowerCase().includes(termo)),
  );

  const escolhido = biblioteca.find((tema) => tema.id === escolhidoId) ?? filtrados[0] ?? null;

  const lerArquivos = async (arquivos: File[]) => {
    const css = arquivos.filter((a) => a.name.toLowerCase().endsWith(".css"));

    if (!css.length) {
      toast.error("Nenhum arquivo .css aí dentro.");
      return;
    }

    let ultimo = "";

    for (const arquivo of css) {
      ultimo = importarCss(await arquivo.text(), semExtensao(arquivo.name));
    }

    setEscolhidoId(ultimo);
    toast.success(
      css.length === 1 ? "Tema importado." : `${css.length} temas importados.`,
    );
  };

  return (
    <>
      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div" className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button" variant="surface" size="sm" onClick={() => arquivoCss.current?.click()}>
          <Upload data-gc="configuracoes.estudio.aba-da-biblioteca.upload" size={14} /> Importar CSS
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input"
          ref={arquivoCss}
          type="file"
          accept=".css,text/css"
          multiple
          className="hidden"
          onChange={(e) => {
            const arquivos = [...(e.target.files ?? [])];
            e.target.value = "";
            void lerArquivos(arquivos);
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--2" variant="surface" size="sm" onClick={() => pasta.current?.click()}>
          <FolderUp data-gc="configuracoes.estudio.aba-da-biblioteca.folder-up" size={14} /> Importar pasta
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--2"
          ref={pasta}
          type="file"
          multiple
          className="hidden"
          // @ts-expect-error -- só o Chromium tem, e é degradação limpa: sem
          // isto o seletor abre em modo de arquivos soltos.
          webkitdirectory=""
          onChange={(e) => {
            const arquivos = [...(e.target.files ?? [])];
            e.target.value = "";
            void lerArquivos(arquivos);
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--3" variant="surface" size="sm" onClick={() => arquivoJson.current?.click()}>
          <Library data-gc="configuracoes.estudio.aba-da-biblioteca.library" size={14} /> Importar biblioteca
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--3"
          ref={arquivoJson}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = "";
            if (!arquivo) return;

            try {
              const lido = JSON.parse(await arquivo.text()) as unknown;
              const temas = Array.isArray(lido) ? (lido as TemaSalvo[]) : [];

              if (!temas.length) throw new Error("vazia");

              importarBiblioteca(temas);
              toast.success(`${temas.length} temas na biblioteca.`);
            } catch {
              toast.error("Esse arquivo não é uma biblioteca de temas.");
            }
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--4"
          variant="surface"
          size="sm"
          disabled={!biblioteca.length}
          className="ml-auto"
          onClick={() =>
            baixar(
              "biblioteca-de-temas.json",
              JSON.stringify(biblioteca, null, 2),
              "application/json",
            )
          }
        >
          <Download data-gc="configuracoes.estudio.aba-da-biblioteca.download" size={14} /> Exportar biblioteca
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--2" className="flex min-h-0 flex-1">
        <aside data-gc="configuracoes.estudio.aba-da-biblioteca.aside" className="flex w-64 shrink-0 flex-col border-r border-line">
          <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--3" className="p-3">
            <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--4" className={grupoDeCampo}>
              <Search data-gc="configuracoes.estudio.aba-da-biblioteca.search" size={14} className="shrink-0 text-ink-faint" />
              <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--4"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar temas"
                aria-label="Pesquisar temas"
                className={campoNu}
              />
              {busca && (
                <button data-gc="configuracoes.estudio.aba-da-biblioteca.button--5"
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar a busca"
                  className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
                >
                  <X data-gc="configuracoes.estudio.aba-da-biblioteca.x" size={14} />
                </button>
              )}
            </div>
          </div>

          <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--5" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {filtrados.map((tema) => (
              <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--6"
                key={tema.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition",
                  tema.id === escolhido?.id
                    ? "border-brand bg-brand/10"
                    : "border-line hover:bg-hover",
                )}
              >
                <button data-gc="configuracoes.estudio.aba-da-biblioteca.button--6"
                  type="button"
                  onClick={() => setEscolhidoId(tema.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p data-gc="configuracoes.estudio.aba-da-biblioteca.p" className="truncate text-sm font-medium">{tema.nome}</p>
                  <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--2" className="truncate text-11 text-ink-faint">
                    {tema.autor || `${tema.css.split("\n").length} linhas`}
                  </p>
                </button>

                <Switch data-gc="configuracoes.estudio.aba-da-biblioteca.switch"
                  checked={ativoId === tema.id}
                  onCheckedChange={() => alternar(tema.id)}
                  aria-label={`Usar ${tema.nome}`}
                />
              </div>
            ))}

            {!filtrados.length && (
              <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--3" className="px-1 py-6 text-center text-13 text-ink-faint">
                {termo ? "Nenhum tema com esse nome." : "Nenhum tema ainda."}
              </p>
            )}
          </div>

          <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--7" className="border-t border-line p-3">
            <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label" htmlFor="estudio-nome">Salvar o tema de agora</Label>
            <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--8" className="flex gap-2">
              <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--5"
                id="estudio-nome"
                value={nomeNovo}
                maxLength={60}
                placeholder="Ex: Índigo da casa"
                onChange={(e) => setNomeNovo(e.target.value)}
              />
              <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--7"
                size="sm"
                disabled={!nomeNovo.trim() || (!css.trim() && !Object.keys(substituicoes).length)}
                onClick={() => {
                  salvar(nomeNovo.trim());
                  setNomeNovo("");
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </aside>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--9" className="min-h-0 flex-1 overflow-y-auto p-5">
          {escolhido ? (
            <DetalheDoTema data-gc="configuracoes.estudio.aba-da-biblioteca.detalhe-do-tema"
              key={escolhido.id}
              tema={escolhido}
              onSalvar={(dados) => {
                atualizar(escolhido.id, dados);
                toast.success("Tema salvo.");
              }}
              onDuplicar={() => duplicar(escolhido.id)}
              onExportar={() =>
                baixar(`${escolhido.nome}.css`, arquivoDoTema(escolhido), "text/css")
              }
              onExcluir={() =>
                void confirmar({
                  titulo: `Excluir ${escolhido.nome}?`,
                  descricao: "O tema sai da biblioteca. Não dá para desfazer.",
                  acao: "Excluir",
                  destrutivo: true,
                }).then(({ confirmado }) => {
                  if (!confirmado) return;

                  apagar(escolhido.id);
                  setEscolhidoId(null);
                })
              }
            />
          ) : (
            <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--4" className="py-16 text-center text-sm text-ink-faint">
              Importe um arquivo .css ou salve o tema de agora para começar.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

const DetalheDoTema: React.FC<{
  tema: TemaSalvo;
  onSalvar: (dados: Partial<Omit<TemaSalvo, "id">>) => void;
  onDuplicar: () => void;
  onExportar: () => void;
  onExcluir: () => void;
}> = ({ tema, onSalvar, onDuplicar, onExportar, onExcluir }) => {
  const [nome, setNome] = useState(tema.nome);
  const [autor, setAutor] = useState(tema.autor ?? "");
  const [versao, setVersao] = useState(tema.versao ?? "");
  const [tags, setTags] = useState((tema.tags ?? []).join(", "));
  const [descricao, setDescricao] = useState(tema.descricao ?? "");
  const [css, setCss] = useState(tema.css);

  const mudou =
    nome !== tema.nome ||
    autor !== (tema.autor ?? "") ||
    versao !== (tema.versao ?? "") ||
    tags !== (tema.tags ?? []).join(", ") ||
    descricao !== (tema.descricao ?? "") ||
    css !== tema.css;

  return (
    <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--10" className="space-y-4">
      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--11" className="flex items-center gap-2">
        <h3 data-gc="configuracoes.estudio.aba-da-biblioteca.h3" className="min-w-0 flex-1 truncate text-lg font-semibold">{tema.nome}</h3>

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-exportar" variant="surface" size="sm" onClick={onExportar}>
          <Download data-gc="configuracoes.estudio.aba-da-biblioteca.download--2" size={14} /> Exportar
        </Button>
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-duplicar" variant="surface" size="sm" onClick={onDuplicar}>
          <Copy data-gc="configuracoes.estudio.aba-da-biblioteca.copy" size={14} /> Duplicar
        </Button>
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-excluir" variant="surface" size="sm" className="text-danger" onClick={onExcluir}>
          <Trash2 data-gc="configuracoes.estudio.aba-da-biblioteca.trash2" size={14} /> Excluir
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--12" className="grid gap-3 sm:grid-cols-2">
        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--13">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--2" htmlFor={`nome-${tema.id}`}>Nome</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--6"
            id={`nome-${tema.id}`}
            value={nome}
            maxLength={60}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--14">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--3" htmlFor={`autor-${tema.id}`}>Autor</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--7"
            id={`autor-${tema.id}`}
            value={autor}
            maxLength={60}
            onChange={(e) => setAutor(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--15">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--4" htmlFor={`versao-${tema.id}`}>Versão</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--8"
            id={`versao-${tema.id}`}
            value={versao}
            maxLength={20}
            onChange={(e) => setVersao(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--16">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--5" htmlFor={`tags-${tema.id}`}>Tags</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--9"
            id={`tags-${tema.id}`}
            value={tags}
            placeholder="escuro, gruvbox, compacto"
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--17">
        <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--6" htmlFor={`descricao-${tema.id}`}>Descrição</Label>
        <Textarea data-gc="configuracoes.estudio.aba-da-biblioteca.textarea"
          id={`descricao-${tema.id}`}
          value={descricao}
          rows={2}
          maxLength={300}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--18">
        <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--7" htmlFor={`css-${tema.id}`}>CSS</Label>
        <textarea data-gc="configuracoes.estudio.aba-da-biblioteca.textarea--2"
          id={`css-${tema.id}`}
          value={css}
          onChange={(e) => setCss(e.target.value)}
          spellCheck={false}
          rows={16}
          className="w-full resize-y rounded-lg border border-line bg-surface-1 p-3 font-mono text-13 leading-relaxed text-ink outline-none focus-visible:border-campo-foco"
        />
        <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--5" className="mt-1 text-xs text-ink-faint">
          {css.split("\n").length} linhas · {css.length} caracteres
        </p>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--19" className="flex items-center gap-2">
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--8"
          disabled={!mudou}
          onClick={() =>
            onSalvar({
              nome: nome.trim() || tema.nome,
              autor: autor.trim() || null,
              versao: versao.trim() || null,
              descricao: descricao.trim() || null,
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              css,
            })
          }
        >
          Salvar tema
        </Button>

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--9"
          variant="ghost"
          size="sm"
          onClick={() => {
            const cabecalho = lerCabecalhoDoTema(css);

            setNome(cabecalho.nome ?? nome);
            setAutor(cabecalho.autor ?? autor);
            setVersao(cabecalho.versao ?? versao);
            setDescricao(cabecalho.descricao ?? descricao);
            if (cabecalho.tags.length) setTags(cabecalho.tags.join(", "));
          }}
        >
          Ler do cabeçalho do CSS
        </Button>
      </div>
    </div>
  );
};
