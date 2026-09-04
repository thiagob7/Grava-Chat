import React, { useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "react-toastify";
import {
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  Image as ImageIcon,
  Library,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { useConfirmar } from "~/components/ui/confirm";
import {
  GRUPOS_DE_TOKENS,
  TODOS_OS_TOKENS,
  valorDoTema,
} from "~/lib/tokens";
import type { TokenDoTema } from "~/lib/tokens";
import { Switch } from "~/components/ui/switch";
import { lerCor, SeletorDeCor } from "~/components/ui/color-picker";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { copiarTexto } from "~/lib/copiar";
import { uploadArquivo } from "~/lib/upload";
import { useAparencia } from "~/stores/aparencia";
import { useEstudio } from "~/stores/estudio";
import { cn } from "~/lib/utils";

type Aba = "biblioteca" | "tokens" | "css" | "ativos" | "configuracoes";

const ABAS: { id: Aba; nome: string; icone: React.ReactNode }[] = [
  { id: "biblioteca", nome: "Biblioteca", icone: <Library size={16} /> },
  { id: "tokens", nome: "Tokens", icone: <SlidersHorizontal size={16} /> },
  { id: "css", nome: "CSS rápido", icone: <FileCode2 size={16} /> },
  { id: "ativos", nome: "Ativos", icone: <ImageIcon size={16} /> },
  {
    id: "configuracoes",
    nome: "Configurações",
    icone: <Settings2 size={16} />,
  },
];

const NOME_DO_TEMA: Record<string, string> = {
  claro: "Base clara",
  escuro: "Base escura",
  "mais-escuro": "Base mais escura",
  sistema: "Base do sistema",
  gravae: "Base Gravaê",
};

export const EstudioDeTemas: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [aba, setAba] = useState<Aba>("tokens");
  const tema = useAparencia((s) => s.tema);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className="regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-[min(900px,94vh)] w-[min(1320px,96vw)] overflow-hidden rounded-xl bg-surface-2 shadow-2xl outline-none"
          aria-label="Estúdio de temas"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            Estúdio de temas
          </DialogPrimitive.Title>

          <nav className="flex w-56 shrink-0 flex-col justify-between bg-surface-1 p-3">
            <div>
              {ABAS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAba(item.id)}
                  aria-current={aba === item.id}
                  className={cn(
                    "mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                    aba === item.id
                      ? "bg-surface-3 font-medium text-ink"
                      : "text-ink-muted hover:bg-hover hover:text-ink",
                  )}
                >
                  {item.icone}
                  {item.nome}
                </button>
              ))}
            </div>

            <p className="border-t border-line px-3 pt-3 text-xs text-ink-faint">
              {NOME_DO_TEMA[tema] ?? "Base"}
            </p>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            {aba === "tokens" && <AbaDeTokens tema={tema} />}
            {aba === "css" && <AbaDeCss />}
            {aba === "ativos" && <AbaDeAtivos />}
            {aba === "biblioteca" && <AbaDaBiblioteca />}
            {aba === "configuracoes" && <AbaDeConfiguracoes />}
          </div>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-faint transition hover:bg-hover hover:text-ink"
          >
            <X size={18} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const AbaDeTokens: React.FC<{ tema: string }> = ({ tema }) => {
  const [busca, setBusca] = useState("");
  const [soLigados, setSoLigados] = useState(false);

  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const substituicoes = useEstudio((s) => s.substituicoes);
  const limpar = useEstudio((s) => s.limparSubstituicoes);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return GRUPOS_DE_TOKENS.map((grupo) => ({
      ...grupo,
      tokens: grupo.tokens.filter((token) => {
        if (soLigados && !token.ligado) return false;
        if (!termo) return true;

        return (
          token.rotulo.toLowerCase().includes(termo) ||
          token.nome.toLowerCase().includes(termo)
        );
      }),
    })).filter((grupo) => grupo.tokens.length > 0);
  }, [busca, soLigados]);

  const buscando = Boolean(busca.trim());

  const quantas = Object.keys(substituicoes).length;
  const totalMostrado = grupos.reduce((soma, g) => soma + g.tokens.length, 0);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3.5 pr-14">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar tokens"
            className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
          />
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <Switch checked={soLigados} onCheckedChange={setSoLigados} />
          Só os que já pintam
        </label>

        <p className="ml-auto shrink-0 text-xs text-ink-faint">
          {quantas} {quantas === 1 ? "substituição" : "substituições"} ·{" "}
          {grupos.length} grupos · {totalMostrado} de {TODOS_OS_TOKENS.length}{" "}
          tokens
        </p>

        <Button
          variant="surface"
          size="sm"
          disabled={!quantas}
          onClick={limpar}
        >
          <RotateCcw size={14} /> Redefinir tudo
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
        {grupos.map((grupo) => {
          const aberto = buscando || abertos[grupo.titulo] === true;

          return (
            <section
              key={grupo.titulo}
              className="border-b border-divisor last:border-b-0"
            >
              <button
                type="button"
                onClick={() =>
                  setAbertos((atual) => ({
                    ...atual,
                    [grupo.titulo]: !atual[grupo.titulo],
                  }))
                }
                aria-expanded={aberto}
                className="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold transition hover:text-brand"
              >
                <ChevronRight
                  size={14}
                  className={cn(
                    "shrink-0 transition-transform",
                    aberto && "rotate-90",
                  )}
                />
                {grupo.titulo}
                <span className="ml-auto text-xs font-normal text-ink-faint">
                  {grupo.tokens.length}
                </span>
              </button>

              {aberto && (
                <div className="mb-3 overflow-hidden rounded-lg border border-line">
                  {grupo.tokens.map((token) => (
                    <LinhaDeToken key={token.nome} token={token} tema={tema} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {!grupos.length && (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nenhum token com esse nome.
          </p>
        )}
      </div>
    </>
  );
};

const LinhaDeToken: React.FC<{
  token: TokenDoTema;
  tema: string;
}> = ({ token, tema }) => {
  const substituido = useEstudio((s) => s.substituicoes[token.nome]);
  const definir = useEstudio((s) => s.definirToken);

  const doTema = useMemo(() => valorDoTema(token.nome), [token.nome, tema]);

  const valor = substituido ?? doTema;

  const legivel = lerCor(valor);

  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={!legivel}
            aria-label={`Cor de ${token.rotulo}`}
            title={
              legivel
                ? "Escolher a cor"
                : "Esta cor o seletor não sabe ler — edite no campo ao lado"
            }
            style={{
              backgroundImage: `linear-gradient(${valor}, ${valor}),
                repeating-conic-gradient(rgb(255 255 255 / 0.14) 0 25%, transparent 0 50%)`,
              backgroundSize: "auto, 8px 8px",
            }}
            className="size-7 shrink-0 cursor-pointer rounded-md border border-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </PopoverTrigger>

        <PopoverContent align="start" className="w-60 p-3">
          <PopoverArrow />

          {legivel && (
            <SeletorDeCor
              valor={valor}
              onMudar={(nova) => definir(token.nome, nova)}
            />
          )}
        </PopoverContent>
      </Popover>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          <span className="truncate">{token.rotulo}</span>

          {!token.ligado && (
            <span
              title="Este token existe e tem valor, mas nenhum componente lê ele ainda."
              className="shrink-0 rounded-full bg-surface-3 px-1.5 py-px text-10 font-normal uppercase tracking-wide text-ink-faint"
            >
              não ligado
            </span>
          )}
        </p>
        <p className="truncate font-mono text-xs text-ink-faint">
          {token.nome}
          {token.dica && <span className="font-sans"> — {token.dica}</span>}
        </p>
      </div>

      <Input
        value={substituido ?? ""}
        placeholder={doTema}
        onChange={(e) => definir(token.nome, e.target.value || null)}
        aria-label={`Valor de ${token.rotulo}`}
        title={substituido ? `Padrão do tema: ${doTema}` : "Padrão do tema"}
        className={cn(
          "h-8 w-48 shrink-0 font-mono text-xs",
          substituido && "border-brand/60",
        )}
      />

      <button
        type="button"
        onClick={() => definir(token.nome, null)}
        disabled={!substituido}
        title="Voltar ao valor do tema"
        aria-label={`Voltar ${token.rotulo} ao valor do tema`}
        className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

const AbaDeCss: React.FC = () => {
  const css = useEstudio((s) => s.css);
  const definirCss = useEstudio((s) => s.definirCss);
  const arquivo = useRef<HTMLInputElement>(null);

  const linhas = css ? css.split("\n").length : 0;

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button
          variant="surface"
          size="sm"
          onClick={() => arquivo.current?.click()}
        >
          <Upload size={14} /> Importar CSS
        </Button>
        <input
          ref={arquivo}
          type="file"
          accept=".css,text/css"
          className="hidden"
          onChange={async (e) => {
            const escolhido = e.target.files?.[0];
            e.target.value = "";
            if (escolhido) definirCss(await escolhido.text());
          }}
        />

        <Button
          variant="surface"
          size="sm"
          onClick={() => baixar("tema.css", css, "text/css")}
        >
          <Download size={14} /> Baixar
        </Button>

        <Button
          variant="surface"
          size="sm"
          onClick={() =>
            void copiarTexto(css).then(() => toast.success("CSS copiado."))
          }
        >
          Copiar
        </Button>

        <Button
          variant="surface"
          size="sm"
          className="ml-auto text-danger"
          disabled={!css}
          onClick={() => definirCss("")}
        >
          <RotateCcw size={14} /> Limpar
        </Button>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <textarea
          value={css}
          onChange={(e) => definirCss(e.target.value)}
          spellCheck={false}
          placeholder={"/* Ex.: */\n.gc-cartao { border-radius: 1rem; }"}
          aria-label="CSS personalizado"
          className="size-full resize-none rounded-lg border border-line bg-surface-1 p-4 font-mono text-13 leading-relaxed text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
        />
      </div>

      <p className="shrink-0 border-t border-line px-6 py-2 text-xs text-ink-faint">
        {linhas} {linhas === 1 ? "linha" : "linhas"} · {css.length} caracteres —
        aplicado na hora, neste aparelho.
      </p>
    </>
  );
};

const AbaDaBiblioteca: React.FC = () => {
  const biblioteca = useEstudio((s) => s.biblioteca);
  const salvar = useEstudio((s) => s.salvarNaBiblioteca);
  const aplicar = useEstudio((s) => s.aplicarDaBiblioteca);
  const apagar = useEstudio((s) => s.apagarDaBiblioteca);
  const importar = useEstudio((s) => s.importar);
  const substituicoes = useEstudio((s) => s.substituicoes);
  const css = useEstudio((s) => s.css);
  const confirmar = useConfirmar();
  const arquivo = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState("");

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button
          variant="surface"
          size="sm"
          onClick={() => arquivo.current?.click()}
        >
          <Upload size={14} /> Importar tema
        </Button>
        <input
          ref={arquivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const escolhido = e.target.files?.[0];
            e.target.value = "";
            if (!escolhido) return;

            try {
              importar(JSON.parse(await escolhido.text()) as { css?: string });
              toast.success("Tema importado.");
            } catch {
              toast.error("Esse arquivo não é um tema válido.");
            }
          }}
        />

        <Button
          variant="surface"
          size="sm"
          onClick={() =>
            baixar(
              "tema.json",
              JSON.stringify({ substituicoes, css }, null, 2),
              "application/json",
            )
          }
        >
          <Download size={14} /> Exportar o atual
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-6 rounded-lg border border-line p-4">
          <Label htmlFor="estudio-nome">Salvar o tema de agora</Label>
          <div className="flex gap-2">
            <Input
              id="estudio-nome"
              value={nome}
              maxLength={40}
              placeholder="Ex: Índigo com o vermelho da casa"
              onChange={(e) => setNome(e.target.value)}
            />
            <Button
              disabled={!nome.trim()}
              onClick={() => {
                salvar(nome.trim());
                setNome("");
              }}
            >
              Salvar
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Guarda as substituições e o CSS de agora. Fica neste aparelho — pra
            levar pra outro, exporte.
          </p>
        </div>

        {!biblioteca.length && (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nenhum tema salvo ainda. Mexa nos tokens e salve aqui pra poder
            voltar.
          </p>
        )}

        {biblioteca.map((tema) => (
          <div
            key={tema.id}
            className="mb-2 flex items-center gap-3 rounded-lg border border-line px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tema.nome}</p>
              <p className="text-xs text-ink-faint">
                {Object.keys(tema.substituicoes).length} tokens
                {tema.css ? " · com CSS" : ""}
              </p>
            </div>

            <Button
              variant="surface"
              size="sm"
              onClick={() => aplicar(tema.id)}
            >
              Aplicar
            </Button>

            <button
              onClick={() =>
                void confirmar({
                  titulo: `Apagar "${tema.nome}"?`,
                  descricao:
                    "Some deste aparelho. Se ele não foi exportado, não tem volta.",
                  acao: "Apagar",
                }).then(({ confirmado }) => confirmado && apagar(tema.id))
              }
              aria-label={`Apagar ${tema.nome}`}
              className="rounded p-1.5 text-ink-faint transition hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

const AbaDeAtivos: React.FC = () => {
  const ativos = useEstudio((s) => s.ativos);
  const guardarAtivo = useEstudio((s) => s.guardarAtivo);
  const apagarAtivo = useEstudio((s) => s.apagarAtivo);
  const confirmar = useConfirmar();
  const arquivo = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  const escolher = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const escolhido = evento.target.files?.[0];
    evento.target.value = "";
    if (!escolhido) return;

    setSubindo(true);
    const anexo = await uploadArquivo(escolhido).catch(() => null);
    setSubindo(false);

    if (!anexo) return toast.error("Não deu pra subir o arquivo.");

    guardarAtivo({
      nome: escolhido.name,
      url: anexo.url,
      tipo: escolhido.type,
    });
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button
          variant="surface"
          size="sm"
          disabled={subindo}
          onClick={() => arquivo.current?.click()}
        >
          <Upload size={14} /> {subindo ? "Enviando…" : "Carregar arquivo"}
        </Button>
        <input
          ref={arquivo}
          type="file"
          accept="image/*,font/*,.woff,.woff2,.ttf,.otf"
          className="hidden"
          onChange={(e) => void escolher(e)}
        />
        <p className="text-xs text-ink-faint">
          Imagem ou fonte, pra usar no CSS rápido.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {!ativos.length && (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nenhum arquivo ainda. Suba uma imagem e cole o{" "}
            <code className="font-mono">url(…)</code> no seu CSS.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {ativos.map((ativo) => (
            <div
              key={ativo.id}
              className="overflow-hidden rounded-lg border border-line"
            >
              <div className="flex h-28 items-center justify-center bg-surface-1">
                {ativo.tipo.startsWith("image/") ? (
                  <img
                    src={ativo.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <FileCode2 size={28} className="text-ink-faint" />
                )}
              </div>

              <div className="flex items-center gap-2 p-2">
                <p
                  className="min-w-0 flex-1 truncate text-xs"
                  title={ativo.nome}
                >
                  {ativo.nome}
                </p>

                <button
                  onClick={() =>
                    void copiarTexto(`url("${ativo.url}")`).then(
                      (ok) => ok && toast.success("Endereço copiado."),
                    )
                  }
                  title="Copiar como url(…)"
                  aria-label={`Copiar o endereço de ${ativo.nome}`}
                  className="rounded p-1 text-ink-faint transition hover:text-ink"
                >
                  <Copy size={14} />
                </button>

                <button
                  onClick={() =>
                    void confirmar({
                      titulo: `Tirar "${ativo.nome}" da lista?`,
                      descricao:
                        "O CSS que usa este endereço para de achar o arquivo. O arquivo em si continua onde está.",
                      acao: "Tirar",
                    }).then(
                      ({ confirmado }) => confirmado && apagarAtivo(ativo.id),
                    )
                  }
                  aria-label={`Tirar ${ativo.nome}`}
                  className="rounded p-1 text-ink-faint transition hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const AbaDeConfiguracoes: React.FC = () => {
  const limparSubstituicoes = useEstudio((s) => s.limparSubstituicoes);
  const limparTudo = useEstudio((s) => s.limparTudo);
  const confirmar = useConfirmar();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <h3 className="mb-1 text-sm font-semibold text-danger">Zona de perigo</h3>
      <p className="mb-4 text-sm text-ink-muted">
        Nada aqui viaja com a conta: tudo o que o estúdio guarda é deste
        aparelho.
      </p>

      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        <div className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Limpar as substituições de token
            </p>
            <p className="text-xs text-ink-faint">
              As cores voltam a ser as do tema. A biblioteca e o CSS ficam.
            </p>
          </div>
          <Button variant="surface" size="sm" onClick={limparSubstituicoes}>
            Limpar
          </Button>
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Apagar tudo do estúdio</p>
            <p className="text-xs text-ink-faint">
              Substituições, CSS, ativos e a biblioteca inteira deste aparelho.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              void confirmar({
                titulo: "Apagar tudo do estúdio?",
                descricao:
                  "As cores, o CSS e os temas salvos somem deste aparelho. Os temas exportados continuam valendo.",
                acao: "Apagar tudo",
              }).then(({ confirmado }) => confirmado && limparTudo())
            }
          >
            <Trash2 size={14} /> Apagar tudo
          </Button>
        </div>
      </div>
    </div>
  );
};

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement("a");

  link.href = url;
  link.download = nome;
  link.click();

  URL.revokeObjectURL(url);
}
