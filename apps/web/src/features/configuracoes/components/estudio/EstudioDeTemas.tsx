import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  Image as ImageIcon,
  Library,
  Palette,
  RotateCcw,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";

import { CAMINHO_DO_TEMA, lerCabecalhoDoTema } from "@gravae/shared";
import existeNaReferencia from "~/features/configuracoes/lib/existe-na-referencia.json";

import { usePublicarTema } from "~/@core/application/queries/tema/use-temas";
import { AbaDaBiblioteca } from "~/features/configuracoes/components/estudio/AbaDaBiblioteca";
import {
  acharComentariosQuebrados,
  consertarComentariosQuebrados,
} from "~/features/configuracoes/lib/comentarios-quebrados";
import { GANCHOS_DE_TEMA as GANCHOS } from "~/features/configuracoes/lib/ganchos-de-tema";
import { conferirCompatibilidade } from "~/features/configuracoes/lib/compatibilidade-do-tema";
import { conferirTokens } from "~/features/configuracoes/lib/compatibilidade-de-tokens";
import {
  contarSeletoresDatados,
  deveTraduzir,
  contarRegrasMortas,
} from "~/features/configuracoes/lib/normalizar-tema";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { useConfirm } from "~/components/ui/confirm";
import macanetas from "~/features/configuracoes/lib/macanetas.json";
import {
  GRUPOS_DE_TOKENS,
  TODOS_OS_TOKENS,
  valorDoTema,
} from "~/lib/tokens";
import type { TokenDoTema } from "~/lib/tokens";
import { parseColor, ColorField } from "~/components/ui/color-picker";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { copiarTexto } from "~/lib/copiar";
import { uploadArquivo } from "~/lib/upload";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { ativosFaltando, useEstudio } from "~/features/configuracoes/stores/estudio";
import { TEMA_APLICADO } from "~/features/configuracoes/lib/evento-de-tema";
import { CORES_MAE, MAES, derivar } from "~/features/configuracoes/lib/cores-mae";
import { Slider } from "~/components/ui/slider";
import { Opcao } from "~/features/configuracoes/components/campos-de-config";
import { cn } from "~/lib/utils";

type Aba = "biblioteca" | "cores" | "tokens" | "css" | "ativos" | "configuracoes";

const ABAS: { id: Aba; nome: string; icone: React.ReactNode }[] = [
  { id: "biblioteca", nome: "Biblioteca", icone: <Library data-gc="configuracoes.estudio.estudio-de-temas.library" size={16} /> },
  { id: "cores", nome: "Cores", icone: <Palette data-gc="configuracoes.estudio.estudio-de-temas.palette" size={16} /> },
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

export const CorpoDoEstudio: React.FC<{ acao?: React.ReactNode }> = ({ acao }) => {
  const [aba, setAba] = useState<Aba>("biblioteca");
  const tema = useAparencia((s) => s.tema);

  return (
    <>
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

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--2" className="border-t border-line pt-3">
          {acao}
          <p data-gc="configuracoes.estudio.estudio-de-temas.p" className="px-3 pt-2 text-xs text-ink-faint">{NOME_DO_TEMA[tema] ?? "Base"}</p>
        </div>
      </nav>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--3" className="flex min-w-0 flex-1 flex-col">
        {aba === "cores" && <AbaDeCores data-gc="configuracoes.estudio.estudio-de-temas.aba-de-cores" />}
        {aba === "tokens" && <AbaDeTokens data-gc="configuracoes.estudio.estudio-de-temas.aba-de-tokens" tema={tema} />}
        {aba === "css" && <AbaDeCss data-gc="configuracoes.estudio.estudio-de-temas.aba-de-css" />}
        {aba === "ativos" && <AbaDeAtivos data-gc="configuracoes.estudio.estudio-de-temas.aba-de-ativos" />}
        {aba === "biblioteca" && <AbaDaBiblioteca data-gc="configuracoes.estudio.estudio-de-temas.aba-da-biblioteca" />}
        {aba === "configuracoes" && <AbaDeConfiguracoes data-gc="configuracoes.estudio.estudio-de-temas.aba-de-configuracoes" />}
      </div>
    </>
  );
};

const AbaDeCores: React.FC = () => {
  const coresMae = useEstudio((s) => s.coresMae);
  const saturacao = useEstudio((s) => s.saturacao);
  const definirSaturacao = useEstudio((s) => s.definirSaturacao);
  const limpar = useEstudio((s) => s.limparSubstituicoes);

  const escolhidas = Object.keys(coresMae).length;

  return (
    <>
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--4" className="flex shrink-0 items-center gap-4 border-b border-line px-6 py-3.5 pr-14">
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--2" className="min-w-0 flex-1 text-xs text-ink-muted">
          Escolha uma cor e as parentes dela vão junto. O que você mexer na aba
          Tokens continua valendo por cima.
        </p>

        <label data-gc="configuracoes.estudio.estudio-de-temas.label" className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
          Saturação
          <Slider data-gc="configuracoes.estudio.estudio-de-temas.slider"
            min={0}
            max={150}
            value={Math.round(saturacao * 100)}
            filled={saturacao / 1.5}
            onChange={(e) => definirSaturacao(Number(e.target.value) / 100)}
            aria-label="Saturação das cores derivadas"
            className="w-28"
          />
          <span data-gc="configuracoes.estudio.estudio-de-temas.span" className="w-9 text-right font-mono text-ink-faint">
            {Math.round(saturacao * 100)}%
          </span>
        </label>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button.limpar"
          variant="surface"
          size="sm"
          disabled={!escolhidas}
          onClick={limpar}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw" size={14} /> Voltar ao base
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--5" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--6" className="grid gap-4 @3xl:grid-cols-2">
          {MAES.map((id) => (
            <CartaoDeMae data-gc="configuracoes.estudio.estudio-de-temas.cartao-de-mae" key={id} id={id} />
          ))}
        </div>

        <p data-gc="configuracoes.estudio.estudio-de-temas.p--3" className="mt-5 text-xs text-ink-faint">
          A saturação multiplica todas as cores derivadas de uma vez. Em 0 o app
          fica em cinza — serve de acessibilidade, e de teste: se alguma coisa
          continuar colorida, é cor que nenhum tema alcança.
        </p>
      </div>
    </>
  );
};

const CartaoDeMae: React.FC<{ id: string }> = ({ id }) => {
  const familia = CORES_MAE[id]!;

  const escolhida = useEstudio((s) => s.coresMae[id]);
  const saturacao = useEstudio((s) => s.saturacao);
  const manuais = useEstudio((s) => s.manuais);
  const definirCorMae = useEstudio((s) => s.definirCorMae);

  const valor = escolhida ?? familia.padrao;

  const filhas = useMemo(
    () => derivar(id, valor, saturacao),
    [id, valor, saturacao],
  );

  return (
    <section data-gc="configuracoes.estudio.estudio-de-temas.section" className="rounded-lg border border-line bg-surface-1 p-4">
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--7" className="flex items-center gap-3">
        <Popover data-gc="configuracoes.estudio.estudio-de-temas.popover">
          <PopoverTrigger data-gc="configuracoes.estudio.estudio-de-temas.popover-trigger" asChild>
            <button data-gc="configuracoes.estudio.estudio-de-temas.button--2"
              type="button"
              aria-label={`Cor de ${familia.rotulo}`}
              style={{ backgroundColor: valor }}
              className="size-10 shrink-0 cursor-pointer rounded-lg border border-line-sutil"
            />
          </PopoverTrigger>

          <PopoverContent data-gc="configuracoes.estudio.estudio-de-temas.popover-content" align="start" className="w-60 p-3">
            <PopoverArrow data-gc="configuracoes.estudio.estudio-de-temas.popover-arrow" />
            <ColorField data-gc="configuracoes.estudio.estudio-de-temas.color-field"
              value={valor}
              onChange={(nova) => definirCorMae(id, nova)}
            />
          </PopoverContent>
        </Popover>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--8" className="min-w-0 flex-1">
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--4" className="truncate text-sm font-semibold">{familia.rotulo}</p>
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--5" className="truncate text-xs text-ink-faint">{familia.dica}</p>
        </div>

        <Input data-gc="configuracoes.estudio.estudio-de-temas.input"
          value={escolhida ?? ""}
          placeholder={familia.padrao}
          onChange={(e) => definirCorMae(id, e.target.value || null)}
          aria-label={`Valor de ${familia.rotulo}`}
          className={cn(
            "h-8 w-28 shrink-0 font-mono text-xs",
            escolhida && "border-brand/60",
          )}
        />

        <button data-gc="configuracoes.estudio.estudio-de-temas.button--3"
          type="button"
          onClick={() => definirCorMae(id, null)}
          disabled={!escolhida}
          title="Voltar esta família ao tema base"
          aria-label={`Voltar ${familia.rotulo} ao tema base`}
          className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--2" size={14} />
        </button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--9" className="mt-3 flex flex-wrap gap-1">
        {Object.entries(filhas).map(([nome, cor]) => (
          <span data-gc="configuracoes.estudio.estudio-de-temas.span--2"
            key={nome}
            title={
              manuais[nome]
                ? `${nome} — você mexeu neste à mão, e a sua escolha vence`
                : `${nome} = ${cor}`
            }
            style={{
              backgroundImage: `linear-gradient(${cor}, ${cor}),
                repeating-conic-gradient(rgb(255 255 255 / 0.14) 0 25%, transparent 0 50%)`,
              backgroundSize: "auto, 6px 6px",
            }}
            className={cn(
              "size-5 rounded border border-line-sutil",
              manuais[nome] && "opacity-30",
            )}
          />
        ))}
      </div>
    </section>
  );
};

const AbaDeTokens: React.FC<{ tema: string }> = ({ tema }) => {
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const substituicoes = useEstudio((s) => s.substituicoes);
  const limpar = useEstudio((s) => s.limparSubstituicoes);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return GRUPOS_DE_TOKENS.map((grupo) => ({
      ...grupo,
      tokens: grupo.tokens.filter((token) => {
        if (!termo) return true;

        return (
          token.rotulo.toLowerCase().includes(termo) ||
          token.nome.toLowerCase().includes(termo)
        );
      }),
    })).filter((grupo) => grupo.tokens.length > 0);
  }, [busca]);

  const buscando = Boolean(busca.trim());

  const quantas = Object.keys(substituicoes).length;
  const totalMostrado = grupos.reduce((soma, g) => soma + g.tokens.length, 0);

  return (
    <>
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--10" className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3.5 pr-14">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--11" className="relative max-w-sm flex-1">
          <Search data-gc="configuracoes.estudio.estudio-de-temas.search"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input data-gc="configuracoes.estudio.estudio-de-temas.input--2"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar tokens"
            className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
          />
        </div>

        <p data-gc="configuracoes.estudio.estudio-de-temas.p--6" className="ml-auto shrink-0 text-xs text-ink-faint">
          {quantas} {quantas === 1 ? "substituição" : "substituições"} ·{" "}
          {grupos.length} grupos · {totalMostrado} de {TODOS_OS_TOKENS.length}{" "}
          tokens que pintam
        </p>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button.limpar--2"
          variant="surface"
          size="sm"
          disabled={!quantas}
          onClick={limpar}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--3" size={14} /> Redefinir tudo
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--12" className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
        {grupos.map((grupo) => {
          const aberto = buscando || abertos[grupo.titulo] === true;

          return (
            <section data-gc="configuracoes.estudio.estudio-de-temas.section--2"
              key={grupo.titulo}
              className="border-b border-divisor last:border-b-0"
            >
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--4"
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
                <span data-gc="configuracoes.estudio.estudio-de-temas.span--3" className="ml-auto text-xs font-normal text-ink-faint">
                  {grupo.tokens.length}
                </span>
              </button>

              {aberto && (
                <div data-gc="configuracoes.estudio.estudio-de-temas.div--13" className="mb-3 overflow-hidden rounded-lg border border-line">
                  {grupo.tokens.map((token) => (
                    <LinhaDeToken data-gc="configuracoes.estudio.estudio-de-temas.linha-de-token" key={token.nome} token={token} tema={tema} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {!grupos.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--7" className="py-10 text-center text-sm text-ink-faint">
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
  const manual = useEstudio((s) => s.manuais[token.nome]);
  const valendo = useEstudio((s) => s.substituicoes[token.nome]);
  const definir = useEstudio((s) => s.definirToken);

  const doTema = useMemo(() => valorDoTema(token.nome), [token.nome, tema]);

  const valor = valendo ?? doTema;
  const daMae = Boolean(valendo) && !manual;

  const legivel = parseColor(valor);
  const giram: string[] = (macanetas as Record<string, string[]>)[token.nome] ?? [];

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--14" className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <Popover data-gc="configuracoes.estudio.estudio-de-temas.popover--2">
        <PopoverTrigger data-gc="configuracoes.estudio.estudio-de-temas.popover-trigger--2" asChild>
          <button data-gc="configuracoes.estudio.estudio-de-temas.button--5"
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
            className="size-7 shrink-0 cursor-pointer rounded-md border border-line-sutil disabled:cursor-not-allowed disabled:opacity-40"
          />
        </PopoverTrigger>

        <PopoverContent data-gc="configuracoes.estudio.estudio-de-temas.popover-content--2" align="start" className="w-60 p-3">
          <PopoverArrow data-gc="configuracoes.estudio.estudio-de-temas.popover-arrow--2" />

          {legivel && (
            <ColorField data-gc="configuracoes.estudio.estudio-de-temas.color-field--2"
              value={valor}
              onChange={(nova) => definir(token.nome, nova)}
            />
          )}
        </PopoverContent>
      </Popover>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--15" className="min-w-0 flex-1">
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--8" className="flex items-center gap-2 truncate text-sm font-medium">
          <span data-gc="configuracoes.estudio.estudio-de-temas.span--4" className="truncate">{token.rotulo}</span>
        </p>
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--9" className="truncate font-mono text-xs text-ink-faint">
          {token.nome}
          {token.dica && <span data-gc="configuracoes.estudio.estudio-de-temas.span--5" className="font-sans"> — {token.dica}</span>}
        </p>

        {giram.length > 0 && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--10"
            title={`Um tema gira este token por: ${giram.join(", ")}`}
            className="truncate font-mono text-10 text-ink-faint/70"
          >
            tema: {giram.join(" · ")}
          </p>
        )}
      </div>

      <Input data-gc="configuracoes.estudio.estudio-de-temas.input--3"
        value={manual ?? ""}
        placeholder={valor}
        onChange={(e) => definir(token.nome, e.target.value || null)}
        aria-label={`Valor de ${token.rotulo}`}
        title={
          daMae
            ? `Veio da cor-mãe. Escrever aqui vence a derivação. Padrão do tema: ${doTema}`
            : `Padrão do tema: ${doTema}`
        }
        className={cn(
          "h-8 w-48 shrink-0 font-mono text-xs",
          manual && "border-brand/60",
          daMae && "border-dashed",
        )}
      />

      <button data-gc="configuracoes.estudio.estudio-de-temas.button--6"
        type="button"
        onClick={() => definir(token.nome, null)}
        disabled={!manual}
        title="Voltar ao valor do tema"
        aria-label={`Voltar ${token.rotulo} ao valor do tema`}
        className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
      >
        <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--4" size={14} />
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
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--16" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--7"
          variant="surface"
          size="sm"
          onClick={() => arquivo.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload" size={14} /> Importar CSS
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--4"
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

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--8"
          variant="surface"
          size="sm"
          onClick={() => baixar("tema.css", css, "text/css")}
        >
          <Download data-gc="configuracoes.estudio.estudio-de-temas.download" size={14} /> Baixar
        </Button>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--9"
          variant="surface"
          size="sm"
          onClick={() =>
            void copiarTexto(css).then(() => toast.success("CSS copiado."))
          }
        >
          Copiar
        </Button>

        <BotaoDeCompartilhar data-gc="configuracoes.estudio.estudio-de-temas.botao-de-compartilhar" />

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--10"
          variant="surface"
          size="sm"
          className="ml-auto text-danger"
          disabled={!css}
          onClick={() => definirCss("")}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--5" size={14} /> Limpar
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--17" className="min-h-0 flex-1 p-4">
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

      <ComentariosQuebrados data-gc="configuracoes.estudio.estudio-de-temas.comentarios-quebrados.definir-css" css={css} onConsertar={definirCss} />

      <TemaImportado data-gc="configuracoes.estudio.estudio-de-temas.tema-importado" css={css} />

      <p data-gc="configuracoes.estudio.estudio-de-temas.p--11" className="shrink-0 border-t border-line px-6 py-2 text-xs text-ink-faint">
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
    <Button data-gc="configuracoes.estudio.estudio-de-temas.button--11"
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

const ENCOLHER = `/* A lista de membros encolhe sozinha e volta quando o mouse chega. */
.lista-de-membros {
  transition: width 0.3s ease;
}

body:not(:has(.lista-de-membros:hover)) .lista-de-membros {
  width: 3rem;
}`;

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

const ComentariosQuebrados: React.FC<{
  css: string;
  onConsertar: (css: string) => void;
}> = ({ css, onConsertar }) => {
  const achados = useMemo(() => acharComentariosQuebrados(css), [css]);

  if (!achados.length) return null;

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--18" className="shrink-0 border-t border-line bg-aviso/[0.07] px-6 py-3">
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--12" className="text-xs font-semibold uppercase tracking-wide text-aviso">
        {achados.length === 1
          ? "1 comentário quebrado"
          : `${achados.length} comentários quebrados`}
      </p>

      <p data-gc="configuracoes.estudio.estudio-de-temas.p--13" className="mt-1.5 text-xs text-ink-muted">
        Um comentário fecha e emenda outro asterisco logo em seguida. O navegador
        descarta o que sobra até o ponto e vírgula, e leva junto a declaração
        seguinte — que é por que parte do tema não pega.
      </p>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--19" className="mt-2 flex max-h-24 flex-col gap-0.5 overflow-y-auto">
        {achados.map((achado, indice) => (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--14" key={`${achado.linha}-${indice}`} className="font-mono text-xs text-ink-muted">
            linha {achado.linha}
            {achado.variavel ? ` — some ${achado.variavel}` : " — some a declaração seguinte"}
          </p>
        ))}
      </div>

      <Button data-gc="configuracoes.estudio.estudio-de-temas.button--12"
        variant="surface"
        size="sm"
        className="mt-2"
        onClick={() => {
          onConsertar(consertarComentariosQuebrados(css));
          toast.success("Comentários consertados.");
        }}
      >
        Consertar
      </Button>
    </div>
  );
};

const SeletoresDatados: React.FC<{ presos: number; comDiv: number; css: string }> = ({
  presos,
  comDiv,
  css,
}) => {
  const ativoId = useEstudio((e) => e.ativoId);
  const solto = useEstudio((e) => e.aRisca);
  const daBiblioteca = useEstudio((e) => e.biblioteca.find((t) => t.id === e.ativoId)?.aRisca);
  const definirARisca = useEstudio((e) => e.definirARisca);

  const escolha = ativoId ? daBiblioteca : solto;
  const automatico = escolha === undefined || escolha === null;
  const aRisca = escolha ?? !deveTraduzir(css);

  const existeSolto = useEstudio((e) => e.soOQueExisteLa);
  const existeDaBiblioteca = useEstudio(
    (e) => e.biblioteca.find((t) => t.id === e.ativoId)?.soOQueExisteLa,
  );
  const definirSoOQueExisteLa = useEstudio((e) => e.definirSoOQueExisteLa);
  const soOQueExisteLa = (ativoId ? existeDaBiblioteca : existeSolto) ?? true;
  const mortas = contarRegrasMortas(css, existeNaReferencia);

  const partes = [
    presos > 0 && `${presos} ${presos === 1 ? "presa ao hash" : "presas ao hash"} do build`,
    comDiv > 0 && `${comDiv} ${comDiv === 1 ? "escrita" : "escritas"} com \`div\` na frente`,
  ].filter(Boolean);

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--20" className="mt-2">
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--15" className="text-xs text-ink-muted">
        Este tema tem {partes.join(" e ")}. As duas coisas apontam para o cliente de quem
        escreveu, no dia em que escreveu — o hash muda a cada build, e o `div` era a tag daquele
        elemento naquela versão. Aplicado como está, o que morreu lá morre aqui também: é isso
        que faz o tema aparecer aqui igual ao que você vê na referência.
      </p>

      <Opcao data-gc="configuracoes.estudio.estudio-de-temas.opcao.definir-so-oque-existe-la"
        titulo="Só o que existe na referência hoje"
        detalhe={
          `Ligado, as regras deste tema que miram nome de um build antigo — que lá já não pegam — não pegam aqui também: ${mortas} regra(s). É o que faz o tema aparecer aqui como aparece lá. Desligado, o arquivo vale inteiro.`
        }
        ligado={soOQueExisteLa}
        onMudar={definirSoOQueExisteLa}
      />

      <Opcao data-gc="configuracoes.estudio.estudio-de-temas.opcao.definir-arisca"
        titulo="Seguir o tema à risca"
        detalhe={
          (automatico
            ? aRisca
              ? "Escolhido pelo app: este tema tem seletor solto o bastante para valer como está. "
              : "Escolhido pelo app: este tema é quase só nome preso a build, e como está não sobraria nada dele. "
            : "") +
          `Ligado, o arquivo entra sem troca nenhuma. Desligado, o que está datado é traduzido — ${presos + comDiv} regra(s) aqui.`
        }
        ligado={aRisca}
        onMudar={definirARisca}
      />
    </div>
  );
};

const TemaImportado: React.FC<{ css: string }> = ({ css }) => {
  const [aberto, setAberto] = useState(false);

  const { achados, faltando } = useMemo(() => conferirCompatibilidade(css), [css]);

  const datados = useMemo(() => contarSeletoresDatados(css), [css]);
  const total = achados.length + faltando.length;

  const tokens = useMemo(() => conferirTokens(css), [css]);
  const totalDeTokens = tokens.traduzidos.length + tokens.ignorados.length;

  if (!total && !totalDeTokens) return null;

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--21" className="shrink-0 border-t border-line px-6 py-3">
      <button data-gc="configuracoes.estudio.estudio-de-temas.button--13"
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right--2" size={14} className={cn("transition-transform", aberto && "rotate-90")} />
        Tema importado
        <span data-gc="configuracoes.estudio.estudio-de-temas.span--6" className="ml-auto flex items-center gap-2 normal-case tracking-normal">
          {totalDeTokens > 0 && (
            <span data-gc="configuracoes.estudio.estudio-de-temas.span--7"
              title="Variáveis que o tema declara e que chegam na tela"
              className={cn(
                "font-mono",
                tokens.ignorados.length ? "text-aviso" : "text-online",
              )}
            >
              {tokens.traduzidos.length}/{totalDeTokens} cores
            </span>
          )}

          {total > 0 && (
            <span data-gc="configuracoes.estudio.estudio-de-temas.span--8" className={cn("font-mono", faltando.length ? "text-aviso" : "text-online")}>
              {achados.length}/{total} lugares
            </span>
          )}
        </span>
      </button>

      {aberto && (
        <>
          {(datados.presos > 0 || datados.comDiv > 0) && (
            <SeletoresDatados data-gc="configuracoes.estudio.estudio-de-temas.seletores-datados" {...datados} css={css} />
          )}

          {totalDeTokens > 0 && (
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--16" className="mt-2 text-xs text-ink-faint">
              Ele declara {totalDeTokens} {totalDeTokens === 1 ? "cor" : "cores"}.{" "}
              {tokens.ignorados.length
                ? `${tokens.ignorados.length} ${tokens.ignorados.length === 1 ? "não chega" : "não chegam"} na tela — não há nada aqui que leia esses nomes.`
                : "Todas chegam na tela."}
              {tokens.traduzidos.length > 0 &&
                " O resto das superfícies sai por derivação, a partir do que ele disse."}
            </p>
          )}

          {tokens.ignorados.length > 0 && (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--22" className="mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {tokens.ignorados.map((nome) => (
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--17" key={nome} className="truncate font-mono text-xs text-ink-muted">
                  {nome}
                </p>
              ))}
            </div>
          )}

          {total > 0 && (
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--18" className="mt-2 text-xs text-ink-faint">
              Este tema mira {total} {total === 1 ? "lugar" : "lugares"} de outro cliente.{" "}
              {faltando.length
                ? `${faltando.length} não ${faltando.length === 1 ? "existe" : "existem"} aqui — o que o tema faz neles não tem efeito.`
                : "Todos existem aqui."}
            </p>
          )}

          {faltando.length > 0 && (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--23" className="mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {faltando.map((nome) => (
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--19" key={nome} className="truncate font-mono text-xs text-ink-muted">
                  {nome}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Ganchos: React.FC<{ onUsar: (trecho: string) => void }> = ({ onUsar }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const lista = useListaDeGanchos(aberto);
  const termo = busca.trim().toLowerCase();

  const { mostrar, total } = useMemo(() => {
    if (!lista || termo.length < 2) return { mostrar: [], total: 0 };

    const casam = lista.filter((nome) => nome.includes(termo));

    return { mostrar: casam.slice(0, 40), total: casam.length };
  }, [lista, termo]);

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--24" className="shrink-0 border-t border-line px-6 py-3">
      <button data-gc="configuracoes.estudio.estudio-de-temas.button--14"
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right--3"
          size={14}
          className={cn("transition-transform", aberto && "rotate-90")}
        />
        Em que dá para mexer
      </button>

      {aberto && (
        <>
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--20" className="mt-2 text-xs text-ink-faint">
            Estas classes ficam paradas em cada região da tela — é nelas que um
            tema se agarra. O resto das classes é gerado e muda a cada build.
          </p>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--25" className="mt-2 flex flex-wrap gap-1.5">
            {GANCHOS.map((gancho) => (
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--15"
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

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--26" className="mt-4 border-t border-line pt-3">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--21" className="text-xs text-ink-faint">
              E cada elemento do app carrega um{" "}
              <code data-gc="configuracoes.estudio.estudio-de-temas.code" className="font-mono text-ink-muted">data-gc</code> com o
              caminho de onde ele está. São {lista ? lista.length : "4754"} —
              procure pelo nome da tela, do componente ou do botão.
            </p>

            <input data-gc="configuracoes.estudio.estudio-de-temas.input--5"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="conversa, avatar, apagar…"
              aria-label="Procurar um gancho"
              className="mt-2 w-full rounded border border-line bg-campo px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
            />

            {termo.length >= 2 && (
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--27" className="mt-2">
                {!lista ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--22" className="text-xs text-ink-faint">Carregando a lista…</p>
                ) : !total ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--23" className="text-xs text-ink-faint">
                    Nada com esse nome. Tente um pedaço menor.
                  </p>
                ) : (
                  <>
                    <div data-gc="configuracoes.estudio.estudio-de-temas.div--28" className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                      {mostrar.map((nome) => (
                        <button data-gc="configuracoes.estudio.estudio-de-temas.button--16"
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
                      <p data-gc="configuracoes.estudio.estudio-de-temas.p--24" className="mt-1 px-2 text-xs text-ink-faint">
                        e mais {total - mostrar.length}. Escreva mais para
                        estreitar.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--29" className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface-1 p-3">
            <pre data-gc="configuracoes.estudio.estudio-de-temas.pre" className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-ink-muted">
              {ENCOLHER}
            </pre>

            <Button data-gc="configuracoes.estudio.estudio-de-temas.button--17" variant="surface" size="sm" onClick={() => onUsar(ENCOLHER)}>
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
  const css = useEstudio((s) => s.css);
  const guardarAtivo = useEstudio((s) => s.guardarAtivo);
  const apagarAtivo = useEstudio((s) => s.apagarAtivo);
  const confirm = useConfirm();
  const arquivo = useRef<HTMLInputElement>(null);
  const [subindo, setSubindo] = useState(false);

  const [faltando, setFaltando] = useState<string[]>(ativosFaltando);

  useEffect(() => {
    const ler = () => setFaltando(ativosFaltando());

    ler();
    window.addEventListener(TEMA_APLICADO, ler);
    return () => window.removeEventListener(TEMA_APLICADO, ler);
  }, [css, ativos]);

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
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--30" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--18"
          variant="surface"
          size="sm"
          disabled={subindo}
          onClick={() => arquivo.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload--2" size={14} /> {subindo ? "Enviando…" : "Carregar arquivo"}
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--6"
          ref={arquivo}
          type="file"
          accept="image/*,font/*,.woff,.woff2,.ttf,.otf"
          className="hidden"
          onChange={(e) => void escolher(e)}
        />
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--25" className="text-xs text-ink-faint">
          Imagem ou fonte. No CSS, chame pelo nome:{" "}
          <code data-gc="configuracoes.estudio.estudio-de-temas.code--2" className="font-mono">gc-ativo("fundo")</code>.
        </p>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--31" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {faltando.length > 0 && (
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--32" className="mb-4 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-xs">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--26" className="font-medium">
              O tema pede {faltando.length}{" "}
              {faltando.length === 1 ? "arquivo" : "arquivos"} que não estão
              aqui.
            </p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--27" className="mt-1 text-ink-muted">
              Suba com o mesmo nome e ele aparece:{" "}
              <span data-gc="configuracoes.estudio.estudio-de-temas.span--9" className="font-mono">{faltando.join(", ")}</span>
            </p>
          </div>
        )}

        {!ativos.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--28" className="py-10 text-center text-sm text-ink-faint">
            Nenhum arquivo ainda. Suba uma imagem e cole o{" "}
            <code data-gc="configuracoes.estudio.estudio-de-temas.code--3" className="font-mono">url(…)</code> no seu CSS.
          </p>
        )}

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--33" className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {ativos.map((ativo) => (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--34"
              key={ativo.id}
              className="overflow-hidden rounded-lg border border-line"
            >
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--35" className="flex h-28 items-center justify-center bg-surface-1">
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

              <div data-gc="configuracoes.estudio.estudio-de-temas.div--36" className="flex items-center gap-2 p-2">
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--29"
                  className="min-w-0 flex-1 truncate text-xs"
                  title={ativo.nome}
                >
                  {ativo.nome}
                </p>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--19"
                  onClick={() =>
                    void copiarTexto(`gc-ativo("${ativo.nome}")`).then(
                      (ok) => ok && toast.success("Copiado. Cole no CSS."),
                    )
                  }
                  title={`Copiar como gc-ativo("${ativo.nome}") — é assim que o tema viaja para outra máquina`}
                  aria-label={`Copiar o nome de ${ativo.nome}`}
                  className="rounded p-1 text-ink-faint transition hover:text-ink"
                >
                  <Copy data-gc="configuracoes.estudio.estudio-de-temas.copy" size={14} />
                </button>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--20"
                  onClick={() =>
                    void confirm({
                      title: `Tirar "${ativo.nome}" da lista?`,
                      description:
                        "O CSS que usa este endereço para de achar o arquivo. O arquivo em si continua onde está.",
                      action: "Tirar",
                    }).then(
                      ({ confirmed }) => confirmed && apagarAtivo(ativo.id),
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
  const confirm = useConfirm();

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--37" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <h3 data-gc="configuracoes.estudio.estudio-de-temas.h3" className="mb-1 text-sm font-semibold text-danger">Zona de perigo</h3>
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--30" className="mb-4 text-sm text-ink-muted">
        Nada aqui viaja com a conta: tudo o que o estúdio guarda é deste
        aparelho.
      </p>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--38" className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--39" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--40" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--31" className="text-sm font-medium">
              Limpar as substituições de token
            </p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--32" className="text-xs text-ink-faint">
              As cores voltam a ser as do tema. A biblioteca e o CSS ficam.
            </p>
          </div>
          <Button data-gc="configuracoes.estudio.estudio-de-temas.button.limpar-substituicoes" variant="surface" size="sm" onClick={limparSubstituicoes}>
            Limpar
          </Button>
        </div>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--41" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--42" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--33" className="text-sm font-medium">Apagar tudo do estúdio</p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--34" className="text-xs text-ink-faint">
              Substituições, CSS, ativos e a biblioteca inteira deste aparelho.
            </p>
          </div>
          <Button data-gc="configuracoes.estudio.estudio-de-temas.button--21"
            variant="danger"
            size="sm"
            onClick={() =>
              void confirm({
                title: "Apagar tudo do estúdio?",
                description:
                  "As cores, o CSS e os temas salvos somem deste aparelho. Os temas exportados continuam valendo.",
                action: "Apagar tudo",
              }).then(({ confirmed }) => confirmed && limparTudo())
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
