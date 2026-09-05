import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { CAMINHO_DO_TEMA, lerCabecalhoDoTema } from "@gravae/shared";

import { usePublicarTema } from "~/@core/application/queries/tema/use-temas";
import { AbaDaBiblioteca } from "~/features/configuracoes/components/estudio/AbaDaBiblioteca";
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
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useEstudio } from "~/features/configuracoes/stores/estudio";
import { cn } from "~/lib/utils";

type Aba = "biblioteca" | "tokens" | "css" | "ativos" | "configuracoes";

const ABAS: { id: Aba; nome: string; icone: React.ReactNode }[] = [
  { id: "biblioteca", nome: "Biblioteca", icone: <Library data-gc="configuracoes.estudio.estudio-de-temas.library" size={16} /> },
  { id: "tokens", nome: "Tokens", icone: <SlidersHorizontal data-gc="configuracoes.estudio.estudio-de-temas.sliders-horizontal" size={16} /> },
  { id: "css", nome: "CSS rápido", icone: <FileCode2 data-gc="configuracoes.estudio.estudio-de-temas.file-code2" size={16} /> },
  { id: "ativos", nome: "Ativos", icone: <ImageIcon data-gc="configuracoes.estudio.estudio-de-temas.image-icon" size={16} /> },
  {
    id: "configuracoes",
    nome: "Configurações",
    icone: <Settings2 data-gc="configuracoes.estudio.estudio-de-temas.settings2" size={16} />,
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
    <DialogPrimitive.Root data-gc="configuracoes.estudio.estudio-de-temas.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="configuracoes.estudio.estudio-de-temas.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content data-gc="configuracoes.estudio.estudio-de-temas.dialog-primitivecontent"
          className="regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-[min(900px,94vh)] w-[min(1320px,96vw)] overflow-hidden rounded-xl bg-surface-2 shadow-2xl outline-none"
          aria-label="Estúdio de temas"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title data-gc="configuracoes.estudio.estudio-de-temas.dialog-primitivetitle" className="sr-only">
            Estúdio de temas
          </DialogPrimitive.Title>

          <nav data-gc="configuracoes.estudio.estudio-de-temas.nav" className="flex w-56 shrink-0 flex-col justify-between bg-surface-1 p-3">
            <div data-gc="configuracoes.estudio.estudio-de-temas.div">
              {ABAS.map((item) => (
                <button data-gc="configuracoes.estudio.estudio-de-temas.button"
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

            <p data-gc="configuracoes.estudio.estudio-de-temas.p" className="border-t border-line px-3 pt-3 text-xs text-ink-faint">
              {NOME_DO_TEMA[tema] ?? "Base"}
            </p>
          </nav>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--2" className="flex min-w-0 flex-1 flex-col">
            {aba === "tokens" && <AbaDeTokens data-gc="configuracoes.estudio.estudio-de-temas.aba-de-tokens" tema={tema} />}
            {aba === "css" && <AbaDeCss data-gc="configuracoes.estudio.estudio-de-temas.aba-de-css" />}
            {aba === "ativos" && <AbaDeAtivos data-gc="configuracoes.estudio.estudio-de-temas.aba-de-ativos" />}
            {aba === "biblioteca" && <AbaDaBiblioteca data-gc="configuracoes.estudio.estudio-de-temas.aba-da-biblioteca" />}
            {aba === "configuracoes" && <AbaDeConfiguracoes data-gc="configuracoes.estudio.estudio-de-temas.aba-de-configuracoes" />}
          </div>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-faint transition hover:bg-hover hover:text-ink"
          >
            <X data-gc="configuracoes.estudio.estudio-de-temas.x" size={18} />
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
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--3" className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3.5 pr-14">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--4" className="relative max-w-sm flex-1">
          <Search data-gc="configuracoes.estudio.estudio-de-temas.search"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input data-gc="configuracoes.estudio.estudio-de-temas.input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar tokens"
            className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
          />
        </div>

        <label data-gc="configuracoes.estudio.estudio-de-temas.label" className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-ink-muted">
          <Switch data-gc="configuracoes.estudio.estudio-de-temas.switch.set-so-ligados" checked={soLigados} onCheckedChange={setSoLigados} />
          Só os que já pintam
        </label>

        <p data-gc="configuracoes.estudio.estudio-de-temas.p--2" className="ml-auto shrink-0 text-xs text-ink-faint">
          {quantas} {quantas === 1 ? "substituição" : "substituições"} ·{" "}
          {grupos.length} grupos · {totalMostrado} de {TODOS_OS_TOKENS.length}{" "}
          tokens
        </p>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button.limpar"
          variant="surface"
          size="sm"
          disabled={!quantas}
          onClick={limpar}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw" size={14} /> Redefinir tudo
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--5" className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
        {grupos.map((grupo) => {
          const aberto = buscando || abertos[grupo.titulo] === true;

          return (
            <section data-gc="configuracoes.estudio.estudio-de-temas.section"
              key={grupo.titulo}
              className="border-b border-divisor last:border-b-0"
            >
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--2"
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
                <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right"
                  size={14}
                  className={cn(
                    "shrink-0 transition-transform",
                    aberto && "rotate-90",
                  )}
                />
                {grupo.titulo}
                <span data-gc="configuracoes.estudio.estudio-de-temas.span" className="ml-auto text-xs font-normal text-ink-faint">
                  {grupo.tokens.length}
                </span>
              </button>

              {aberto && (
                <div data-gc="configuracoes.estudio.estudio-de-temas.div--6" className="mb-3 overflow-hidden rounded-lg border border-line">
                  {grupo.tokens.map((token) => (
                    <LinhaDeToken data-gc="configuracoes.estudio.estudio-de-temas.linha-de-token" key={token.nome} token={token} tema={tema} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {!grupos.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--3" className="py-10 text-center text-sm text-ink-faint">
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
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--7" className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <Popover data-gc="configuracoes.estudio.estudio-de-temas.popover">
        <PopoverTrigger data-gc="configuracoes.estudio.estudio-de-temas.popover-trigger" asChild>
          <button data-gc="configuracoes.estudio.estudio-de-temas.button--3"
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

        <PopoverContent data-gc="configuracoes.estudio.estudio-de-temas.popover-content" align="start" className="w-60 p-3">
          <PopoverArrow data-gc="configuracoes.estudio.estudio-de-temas.popover-arrow" />

          {legivel && (
            <SeletorDeCor data-gc="configuracoes.estudio.estudio-de-temas.seletor-de-cor"
              valor={valor}
              onMudar={(nova) => definir(token.nome, nova)}
            />
          )}
        </PopoverContent>
      </Popover>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--8" className="min-w-0 flex-1">
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--4" className="flex items-center gap-2 truncate text-sm font-medium">
          <span data-gc="configuracoes.estudio.estudio-de-temas.span--2" className="truncate">{token.rotulo}</span>

          {!token.ligado && (
            <span data-gc="configuracoes.estudio.estudio-de-temas.span--3"
              title="Este token existe e tem valor, mas nenhum componente lê ele ainda."
              className="shrink-0 rounded-full bg-surface-3 px-1.5 py-px text-10 font-normal uppercase tracking-wide text-ink-faint"
            >
              não ligado
            </span>
          )}
        </p>
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--5" className="truncate font-mono text-xs text-ink-faint">
          {token.nome}
          {token.dica && <span data-gc="configuracoes.estudio.estudio-de-temas.span--4" className="font-sans"> — {token.dica}</span>}
        </p>
      </div>

      <Input data-gc="configuracoes.estudio.estudio-de-temas.input--2"
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

      <button data-gc="configuracoes.estudio.estudio-de-temas.button--4"
        type="button"
        onClick={() => definir(token.nome, null)}
        disabled={!substituido}
        title="Voltar ao valor do tema"
        aria-label={`Voltar ${token.rotulo} ao valor do tema`}
        className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
      >
        <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--2" size={14} />
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
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--9" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--5"
          variant="surface"
          size="sm"
          onClick={() => arquivo.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload" size={14} /> Importar CSS
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--3"
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

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--6"
          variant="surface"
          size="sm"
          onClick={() => baixar("tema.css", css, "text/css")}
        >
          <Download data-gc="configuracoes.estudio.estudio-de-temas.download" size={14} /> Baixar
        </Button>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--7"
          variant="surface"
          size="sm"
          onClick={() =>
            void copiarTexto(css).then(() => toast.success("CSS copiado."))
          }
        >
          Copiar
        </Button>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--8"
          variant="surface"
          size="sm"
          className="ml-auto text-danger"
          disabled={!css}
          onClick={() => definirCss("")}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--3" size={14} /> Limpar
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--10" className="min-h-0 flex-1 p-4">
        <textarea data-gc="configuracoes.estudio.estudio-de-temas.textarea"
          value={css}
          onChange={(e) => definirCss(e.target.value)}
          spellCheck={false}
          placeholder={"/* Ex.: */\n.lista-de-membros { width: 12rem; }"}
          aria-label="CSS personalizado"
          className="size-full resize-none rounded-lg border border-line bg-surface-1 p-4 font-mono text-13 leading-relaxed text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
        />
      </div>

      <Ganchos data-gc="configuracoes.estudio.estudio-de-temas.ganchos" onUsar={(trecho) => definirCss(css ? `${css}\n\n${trecho}` : trecho)} />

      <p data-gc="configuracoes.estudio.estudio-de-temas.p--6" className="shrink-0 border-t border-line px-6 py-2 text-xs text-ink-faint">
        {linhas} {linhas === 1 ? "linha" : "linhas"} · {css.length} caracteres —
        aplicado na hora, neste aparelho.
      </p>
    </>
  );
};

const BotaoDeCompartilhar: React.FC = () => {
  const substituicoes = useEstudio((s) => s.substituicoes);
  const css = useEstudio((s) => s.css);
  const publicar = usePublicarTema();

  const vazio = !css.trim() && Object.keys(substituicoes).length === 0;

  return (
    <Button data-gc="configuracoes.estudio.estudio-de-temas.button--9"
      variant="surface"
      size="sm"
      disabled={vazio || publicar.isPending}
      title={vazio ? "Mexa em alguma cor ou escreva CSS antes" : undefined}
      onClick={() =>
        publicar.mutate(
          { css, substituicoes },
          {
            onSuccess: (tema) => {
              const link = `${window.location.origin}${CAMINHO_DO_TEMA}${tema.id}`;

              void copiarTexto(link).then((deu) =>
                deu
                  ? toast.success("Link copiado. Cole num canal e vira um cartão de importar.")
                  : toast.info(link),
              );
            },
          },
        )
      }
    >
      <Share2 data-gc="configuracoes.estudio.estudio-de-temas.share2" size={14} /> {publicar.isPending ? "Publicando…" : "Compartilhar"}
    </Button>
  );
};

const GANCHOS: { classe: string; oQueE: string }[] = [
  { classe: "trilho-de-servidores", oQueE: "a coluna estreita dos ícones" },
  { classe: "lista-de-canais", oQueE: "a barra dos canais do servidor" },
  { classe: "lista-de-conversas", oQueE: "a barra das mensagens diretas" },
  { classe: "lista-de-comunidades", oQueE: "a barra do Explorar" },
  { classe: "lista-de-membros", oQueE: "a coluna da direita" },
  { classe: "topo-do-canal", oQueE: "a faixa com o nome do canal" },
  { classe: "area-de-conversa", oQueE: "o miolo, onde as mensagens rolam" },
  { classe: "lista-de-mensagens", oQueE: "só a parte que rola" },
  { classe: "barra-da-mensagem", oQueE: "os botões que aparecem no hover" },
  { classe: "caixa-de-escrever", oQueE: "a caixa de escrever" },
  { classe: "painel-do-usuario", oQueE: "o seu cartão, embaixo" },
  { classe: "avatar", oQueE: "toda foto de pessoa" },
  { classe: "janela", oQueE: "qualquer modal" },
  { classe: "menu", oQueE: "os menus de clique" },
  { classe: "balao", oQueE: "os popovers" },
  { classe: "dica", oQueE: "as dicas de passar o mouse" },
];

const ENCOLHER = `/* A lista de membros encolhe sozinha e volta quando o mouse chega. */
.lista-de-membros {
  transition: width 0.3s ease;
}

body:not(:has(.lista-de-membros:hover)) .lista-de-membros {
  width: 3rem;
}`;

/*
  A lista dos data-gc tem 4754 nomes e uns 200 KB. Carregar isso junto com o
  app para uma gaveta que quase ninguém abre seria caro, então ela vem por
  import() quando a busca é usada pela primeira vez.
*/
function useListaDeGanchos(precisa: boolean) {
  const [lista, setLista] = useState<string[] | null>(null);

  useEffect(() => {
    if (!precisa || lista) return;

    let vivo = true;

    void import("~/features/configuracoes/lib/ganchos.json").then((modulo) => {
      if (vivo) setLista(modulo.default as string[]);
    });

    return () => {
      vivo = false;
    };
  }, [precisa, lista]);

  return lista;
}

const Ganchos: React.FC<{ onUsar: (trecho: string) => void }> = ({ onUsar }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const lista = useListaDeGanchos(aberto);
  const termo = busca.trim().toLowerCase();

  /// Sem busca a lista inteira não cabe na tela nem ajuda: só o que casa.
  const { mostrar, total } = useMemo(() => {
    if (!lista || termo.length < 2) return { mostrar: [], total: 0 };

    const casam = lista.filter((nome) => nome.includes(termo));

    return { mostrar: casam.slice(0, 40), total: casam.length };
  }, [lista, termo]);

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--11" className="shrink-0 border-t border-line px-6 py-3">
      <button data-gc="configuracoes.estudio.estudio-de-temas.button--10"
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right--2"
          size={14}
          className={cn("transition-transform", aberto && "rotate-90")}
        />
        Em que dá para mexer
      </button>

      {aberto && (
        <>
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--7" className="mt-2 text-xs text-ink-faint">
            Estas classes ficam paradas em cada região da tela — é nelas que um
            tema se agarra. O resto das classes é gerado e muda a cada build.
          </p>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--12" className="mt-2 flex flex-wrap gap-1.5">
            {GANCHOS.map((gancho) => (
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--11"
                key={gancho.classe}
                type="button"
                title={gancho.oQueE}
                onClick={() => onUsar(`.${gancho.classe} {\n  \n}`)}
                className="rounded border border-line px-2 py-1 font-mono text-xs text-ink-muted transition hover:border-ink-faint hover:text-ink"
              >
                .{gancho.classe}
              </button>
            ))}
          </div>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--13" className="mt-4 border-t border-line pt-3">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--8" className="text-xs text-ink-faint">
              E cada elemento do app carrega um{" "}
              <code data-gc="configuracoes.estudio.estudio-de-temas.code" className="font-mono text-ink-muted">data-gc</code> com o
              caminho de onde ele está. São {lista ? lista.length : "4754"} —
              procure pelo nome da tela, do componente ou do botão.
            </p>

            <input data-gc="configuracoes.estudio.estudio-de-temas.input--4"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="conversa, avatar, apagar…"
              aria-label="Procurar um gancho"
              className="mt-2 w-full rounded border border-line bg-campo px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
            />

            {termo.length >= 2 && (
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--14" className="mt-2">
                {!lista ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--9" className="text-xs text-ink-faint">Carregando a lista…</p>
                ) : !total ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--10" className="text-xs text-ink-faint">
                    Nada com esse nome. Tente um pedaço menor.
                  </p>
                ) : (
                  <>
                    <div data-gc="configuracoes.estudio.estudio-de-temas.div--15" className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                      {mostrar.map((nome) => (
                        <button data-gc="configuracoes.estudio.estudio-de-temas.button--12"
                          key={nome}
                          type="button"
                          onClick={() => onUsar(`[data-gc="${nome}"] {\n  \n}`)}
                          className="truncate rounded px-2 py-1 text-left font-mono text-xs text-ink-muted transition hover:bg-hover hover:text-ink"
                        >
                          {nome}
                        </button>
                      ))}
                    </div>

                    {total > mostrar.length && (
                      <p data-gc="configuracoes.estudio.estudio-de-temas.p--11" className="mt-1 px-2 text-xs text-ink-faint">
                        e mais {total - mostrar.length}. Escreva mais para
                        estreitar.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--16" className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface-1 p-3">
            <pre data-gc="configuracoes.estudio.estudio-de-temas.pre" className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-ink-muted">
              {ENCOLHER}
            </pre>

            <Button data-gc="configuracoes.estudio.estudio-de-temas.button--13" variant="surface" size="sm" onClick={() => onUsar(ENCOLHER)}>
              Usar
            </Button>
          </div>
        </>
      )}
    </div>
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
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--17" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--14"
          variant="surface"
          size="sm"
          disabled={subindo}
          onClick={() => arquivo.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload--2" size={14} /> {subindo ? "Enviando…" : "Carregar arquivo"}
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--5"
          ref={arquivo}
          type="file"
          accept="image/*,font/*,.woff,.woff2,.ttf,.otf"
          className="hidden"
          onChange={(e) => void escolher(e)}
        />
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--12" className="text-xs text-ink-faint">
          Imagem ou fonte, pra usar no CSS rápido.
        </p>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--18" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {!ativos.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--13" className="py-10 text-center text-sm text-ink-faint">
            Nenhum arquivo ainda. Suba uma imagem e cole o{" "}
            <code data-gc="configuracoes.estudio.estudio-de-temas.code--2" className="font-mono">url(…)</code> no seu CSS.
          </p>
        )}

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--19" className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {ativos.map((ativo) => (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--20"
              key={ativo.id}
              className="overflow-hidden rounded-lg border border-line"
            >
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--21" className="flex h-28 items-center justify-center bg-surface-1">
                {ativo.tipo.startsWith("image/") ? (
                  <img data-gc="configuracoes.estudio.estudio-de-temas.img"
                    src={ativo.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <FileCode2 data-gc="configuracoes.estudio.estudio-de-temas.file-code2--2" size={28} className="text-ink-faint" />
                )}
              </div>

              <div data-gc="configuracoes.estudio.estudio-de-temas.div--22" className="flex items-center gap-2 p-2">
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--14"
                  className="min-w-0 flex-1 truncate text-xs"
                  title={ativo.nome}
                >
                  {ativo.nome}
                </p>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--15"
                  onClick={() =>
                    void copiarTexto(`url("${ativo.url}")`).then(
                      (ok) => ok && toast.success("Endereço copiado."),
                    )
                  }
                  title="Copiar como url(…)"
                  aria-label={`Copiar o endereço de ${ativo.nome}`}
                  className="rounded p-1 text-ink-faint transition hover:text-ink"
                >
                  <Copy data-gc="configuracoes.estudio.estudio-de-temas.copy" size={14} />
                </button>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--16"
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
                  <Trash2 data-gc="configuracoes.estudio.estudio-de-temas.trash2" size={14} />
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
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--23" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <h3 data-gc="configuracoes.estudio.estudio-de-temas.h3" className="mb-1 text-sm font-semibold text-danger">Zona de perigo</h3>
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--15" className="mb-4 text-sm text-ink-muted">
        Nada aqui viaja com a conta: tudo o que o estúdio guarda é deste
        aparelho.
      </p>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--24" className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--25" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--26" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--16" className="text-sm font-medium">
              Limpar as substituições de token
            </p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--17" className="text-xs text-ink-faint">
              As cores voltam a ser as do tema. A biblioteca e o CSS ficam.
            </p>
          </div>
          <Button data-gc="configuracoes.estudio.estudio-de-temas.button.limpar-substituicoes" variant="surface" size="sm" onClick={limparSubstituicoes}>
            Limpar
          </Button>
        </div>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--27" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--28" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--18" className="text-sm font-medium">Apagar tudo do estúdio</p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--19" className="text-xs text-ink-faint">
              Substituições, CSS, ativos e a biblioteca inteira deste aparelho.
            </p>
          </div>
          <Button data-gc="configuracoes.estudio.estudio-de-temas.button--17"
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
            <Trash2 data-gc="configuracoes.estudio.estudio-de-temas.trash2--2" size={14} /> Apagar tudo
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
