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
import { withHeader, readThemeHeader } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Input, Label, Textarea, bareField, fieldGroup } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useStudio, type ThemeSaved } from "~/features/configuracoes/stores/estudio";
import { cn } from "~/lib/utils";

function download(name: string, content: string, kind: string) {
  const url = URL.createObjectURL(new Blob([content], { type: kind }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const withoutExtension = (name: string) => name.replace(/\.[^.]+$/, "");

function themeFile(theme: ThemeSaved): string {
  return withHeader(theme.css, {
    name: theme.name,
    description: theme.description ?? null,
    author: theme.author ?? null,
    version: theme.version ?? null,
    font: null,
    invite: null,
    tags: theme.tags ?? [],
  });
}

export const LibraryTab: React.FC = () => {
  const library = useStudio((s) => s.library);
  const activeId = useStudio((s) => s.activeId);
  const overrides = useStudio((s) => s.overrides);
  const css = useStudio((s) => s.css);

  const save = useStudio((s) => s.saveLibrary);
  const toggle = useStudio((s) => s.toggleTheme);
  const update = useStudio((s) => s.updateLibrary);
  const duplicate = useStudio((s) => s.libraryDuplicate);
  const doDelete = useStudio((s) => s.deleteLibrary);
  const importCss = useStudio((s) => s.importCssAsTheme);
  const importLibrary = useStudio((s) => s.importLibrary);

  const confirm = useConfirm();
  const fileCss = useRef<HTMLInputElement>(null);
  const folder = useRef<HTMLInputElement>(null);
  const fileJson = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [nameNew, setNameNew] = useState("");

  const term = search.trim().toLowerCase();

  const filtered = library.filter(
    (theme) =>
      !term ||
      theme.name.toLowerCase().includes(term) ||
      (theme.author ?? "").toLowerCase().includes(term) ||
      (theme.tags ?? []).some((tag) => tag.toLowerCase().includes(term)),
  );

  const picked = library.find((theme) => theme.id === pickedId) ?? filtered[0] ?? null;

  const readFiles = async (files: File[]) => {
    const css = files.filter((a) => a.name.toLowerCase().endsWith(".css"));

    if (!css.length) {
      toast.error("Nenhum arquivo .css aí dentro.");
      return;
    }

    let last = "";

    for (const file of css) {
      last = importCss(await file.text(), withoutExtension(file.name));
    }

    setPickedId(last);
    toast.success(
      css.length === 1 ? "Tema importado." : `${css.length} temas importados.`,
    );
  };

  return (
    <>
      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div" className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button" variant="surface" size="sm" onClick={() => fileCss.current?.click()}>
          <Upload data-gc="configuracoes.estudio.aba-da-biblioteca.upload" size={14} /> Importar CSS
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input"
          ref={fileCss}
          type="file"
          accept=".css,text/css"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            void readFiles(files);
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--2" variant="surface" size="sm" onClick={() => folder.current?.click()}>
          <FolderUp data-gc="configuracoes.estudio.aba-da-biblioteca.folder-up" size={14} /> Importar pasta
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--2"
          ref={folder}
          type="file"
          multiple
          className="hidden"
          // @ts-expect-error -- só o Chromium tem, e é degradação limpa: sem
          webkitdirectory=""
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            void readFiles(files);
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--3" variant="surface" size="sm" onClick={() => fileJson.current?.click()}>
          <Library data-gc="configuracoes.estudio.aba-da-biblioteca.library" size={14} /> Importar biblioteca
        </Button>
        <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--3"
          ref={fileJson}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;

            try {
              const read = JSON.parse(await file.text()) as unknown;
              const themes = Array.isArray(read) ? (read as ThemeSaved[]) : [];

              if (!themes.length) throw new Error("vazia");

              importLibrary(themes);
              toast.success(`${themes.length} temas na biblioteca.`);
            } catch {
              toast.error("Esse arquivo não é uma biblioteca de temas.");
            }
          }}
        />

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--4"
          variant="surface"
          size="sm"
          disabled={!library.length}
          className="ml-auto"
          onClick={() =>
            download(
              "biblioteca-de-temas.json",
              JSON.stringify(library, null, 2),
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
            <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--4" className={fieldGroup}>
              <Search data-gc="configuracoes.estudio.aba-da-biblioteca.search" size={14} className="shrink-0 text-ink-faint" />
              <input data-gc="configuracoes.estudio.aba-da-biblioteca.input--4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar temas"
                aria-label="Pesquisar temas"
                className={bareField}
              />
              {search && (
                <button data-gc="configuracoes.estudio.aba-da-biblioteca.button--5"
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar a busca"
                  className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
                >
                  <X data-gc="configuracoes.estudio.aba-da-biblioteca.x" size={14} />
                </button>
              )}
            </div>
          </div>

          <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--5" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3">
            {filtered.map((theme) => (
              <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--6"
                key={theme.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition",
                  theme.id === picked?.id
                    ? "border-brand bg-brand/10"
                    : "border-line hover:bg-hover",
                )}
              >
                <button data-gc="configuracoes.estudio.aba-da-biblioteca.button--6"
                  type="button"
                  onClick={() => setPickedId(theme.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p data-gc="configuracoes.estudio.aba-da-biblioteca.p" className="truncate text-sm font-medium">{theme.name}</p>
                  <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--2" className="truncate text-11 text-ink-faint">
                    {theme.author || `${theme.css.split("\n").length} linhas`}
                  </p>
                </button>

                <Switch data-gc="configuracoes.estudio.aba-da-biblioteca.switch"
                  checked={activeId === theme.id}
                  onCheckedChange={() => toggle(theme.id)}
                  aria-label={`Usar ${theme.name}`}
                />
              </div>
            ))}

            {!filtered.length && (
              <p data-gc="configuracoes.estudio.aba-da-biblioteca.p--3" className="px-1 py-6 text-center text-13 text-ink-faint">
                {term ? "Nenhum tema com esse nome." : "Nenhum tema ainda."}
              </p>
            )}
          </div>

          <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--7" className="border-t border-line p-3">
            <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label" htmlFor="estudio-nome">Salvar o tema de agora</Label>
            <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--8" className="flex gap-2">
              <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--5"
                id="estudio-nome"
                value={nameNew}
                maxLength={60}
                placeholder="Ex: Índigo da casa"
                onChange={(e) => setNameNew(e.target.value)}
              />
              <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button--7"
                size="sm"
                disabled={!nameNew.trim() || (!css.trim() && !Object.keys(overrides).length)}
                onClick={() => {
                  save(nameNew.trim());
                  setNameNew("");
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </aside>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--9" className="min-h-0 flex-1 overflow-y-auto p-5">
          {picked ? (
            <ThemeDetail data-gc="configuracoes.estudio.aba-da-biblioteca.theme-detail"
              key={picked.id}
              theme={picked}
              onSave={(data) => {
                update(picked.id, data);
                toast.success("Tema salvo.");
              }}
              onDuplicate={() => duplicate(picked.id)}
              onExport={() =>
                download(`${picked.name}.css`, themeFile(picked), "text/css")
              }
              onDelete={() =>
                void confirm({
                  title: `Excluir ${picked.name}?`,
                  description: "O tema sai da biblioteca. Não dá para desfazer.",
                  action: "Excluir",
                  destructive: true,
                }).then(({ confirmed }) => {
                  if (!confirmed) return;

                  doDelete(picked.id);
                  setPickedId(null);
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

const ThemeDetail: React.FC<{
  theme: ThemeSaved;
  onSave: (data: Partial<Omit<ThemeSaved, "id">>) => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}> = ({ theme, onSave, onDuplicate, onExport, onDelete }) => {
  const [name, setName] = useState(theme.name);
  const [author, setAuthor] = useState(theme.author ?? "");
  const [version, setVersion] = useState(theme.version ?? "");
  const [tags, setTags] = useState((theme.tags ?? []).join(", "));
  const [description, setDescription] = useState(theme.description ?? "");
  const [css, setCss] = useState(theme.css);

  const changed =
    name !== theme.name ||
    author !== (theme.author ?? "") ||
    version !== (theme.version ?? "") ||
    tags !== (theme.tags ?? []).join(", ") ||
    description !== (theme.description ?? "") ||
    css !== theme.css;

  return (
    <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--10" className="space-y-4">
      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--11" className="flex items-center gap-2">
        <h3 data-gc="configuracoes.estudio.aba-da-biblioteca.h3" className="min-w-0 flex-1 truncate text-lg font-semibold">{theme.name}</h3>

        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-export" variant="surface" size="sm" onClick={onExport}>
          <Download data-gc="configuracoes.estudio.aba-da-biblioteca.download--2" size={14} /> Exportar
        </Button>
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-duplicate" variant="surface" size="sm" onClick={onDuplicate}>
          <Copy data-gc="configuracoes.estudio.aba-da-biblioteca.copy" size={14} /> Duplicar
        </Button>
        <Button data-gc="configuracoes.estudio.aba-da-biblioteca.button.on-delete" variant="surface" size="sm" className="text-danger" onClick={onDelete}>
          <Trash2 data-gc="configuracoes.estudio.aba-da-biblioteca.trash2" size={14} /> Excluir
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--12" className="grid gap-3 sm:grid-cols-2">
        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--13">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--2" htmlFor={`nome-${theme.id}`}>Nome</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--6"
            id={`nome-${theme.id}`}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--14">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--3" htmlFor={`autor-${theme.id}`}>Autor</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--7"
            id={`autor-${theme.id}`}
            value={author}
            maxLength={60}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--15">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--4" htmlFor={`versao-${theme.id}`}>Versão</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--8"
            id={`versao-${theme.id}`}
            value={version}
            maxLength={20}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--16">
          <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--5" htmlFor={`tags-${theme.id}`}>Tags</Label>
          <Input data-gc="configuracoes.estudio.aba-da-biblioteca.input--9"
            id={`tags-${theme.id}`}
            value={tags}
            placeholder="escuro, gruvbox, compacto"
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--17">
        <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--6" htmlFor={`descricao-${theme.id}`}>Descrição</Label>
        <Textarea data-gc="configuracoes.estudio.aba-da-biblioteca.textarea"
          id={`descricao-${theme.id}`}
          value={description}
          rows={2}
          maxLength={300}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div data-gc="configuracoes.estudio.aba-da-biblioteca.div--18">
        <Label data-gc="configuracoes.estudio.aba-da-biblioteca.label--7" htmlFor={`css-${theme.id}`}>CSS</Label>
        <textarea data-gc="configuracoes.estudio.aba-da-biblioteca.textarea--2"
          id={`css-${theme.id}`}
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
          disabled={!changed}
          onClick={() =>
            onSave({
              name: name.trim() || theme.name,
              author: author.trim() || null,
              version: version.trim() || null,
              description: description.trim() || null,
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
            const header = readThemeHeader(css);

            setName(header.name ?? name);
            setAuthor(header.author ?? author);
            setVersion(header.version ?? version);
            setDescription(header.description ?? description);
            if (header.tags.length) setTags(header.tags.join(", "));
          }}
        >
          Ler do cabeçalho do CSS
        </Button>
      </div>
    </div>
  );
};
