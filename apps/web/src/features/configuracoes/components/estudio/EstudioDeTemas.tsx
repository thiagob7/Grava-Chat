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

import { THEME_PATH, ACTIVE_LIMIT, readThemeHeader } from "@gravae/shared";

import { useSession } from "~/contexts/session-context";
import { ENGINES, VARIABLE_NAME, DOES } from "~/features/tema/lib/fundos";
import existsReference from "~/features/configuracoes/lib/existe-na-referencia.json";

import { usePublishTheme } from "~/@core/application/queries/tema/use-temas";
import { LibraryTab } from "~/features/configuracoes/components/estudio/AbaDaBiblioteca";
import { VersionNewNotice } from "~/features/configuracoes/components/estudio/AvisoDeVersaoNova";
import {
  findCommentsBroken,
  fixCommentsBroken,
} from "~/features/configuracoes/lib/comentarios-quebrados";
import { THEME_HOOKS as HOOKS } from "~/features/configuracoes/lib/ganchos-de-tema";
import { checkCompatibility } from "~/features/configuracoes/lib/compatibilidade-do-tema";
import { checkTokens } from "~/features/configuracoes/lib/compatibilidade-de-tokens";
import {
  countPickersDated,
  mustTranslate,
  countRulesDead,
} from "~/features/configuracoes/lib/normalizar-tema";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { useConfirm } from "~/components/ui/confirm";
import knobs from "~/features/configuracoes/lib/macanetas.json";
import {
  TOKENS_GROUPS,
  ALL_TOKENS,
  themeValue,
} from "~/lib/tokens";
import type { ThemeToken } from "~/lib/tokens";
import { parseColor, ColorField } from "~/components/ui/color-picker";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { copyText } from "~/lib/copiar";
import { sendFile } from "~/lib/upload";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import {
  matchesWithRequest,
  activeRequestsNames,
} from "~/features/configuracoes/lib/ativos-do-tema";
import { activeMissing, useStudio } from "~/features/configuracoes/stores/estudio";
import { THEME_APPLIED } from "~/features/configuracoes/lib/evento-de-tema";
import { COLORS_BASE, BASE, derive } from "~/features/configuracoes/lib/cores-mae";
import { Slider } from "~/components/ui/slider";
import { Choice } from "~/features/configuracoes/components/campos-de-config";
import { cn } from "~/lib/utils";

type Tab = "biblioteca" | "cores" | "tokens" | "css" | "ativos" | "configuracoes";

const TABS: { id: Tab; name: string; icon: React.ReactNode }[] = [
  { id: "biblioteca", name: "Biblioteca", icon: <Library data-gc="configuracoes.estudio.estudio-de-temas.library" size={16} /> },
  { id: "cores", name: "Cores", icon: <Palette data-gc="configuracoes.estudio.estudio-de-temas.palette" size={16} /> },
  { id: "tokens", name: "Tokens", icon: <SlidersHorizontal data-gc="configuracoes.estudio.estudio-de-temas.sliders-horizontal" size={16} /> },
  { id: "css", name: "CSS rápido", icon: <FileCode2 data-gc="configuracoes.estudio.estudio-de-temas.file-code2" size={16} /> },
  { id: "ativos", name: "Ativos", icon: <ImageIcon data-gc="configuracoes.estudio.estudio-de-temas.image-icon" size={16} /> },
  {
    id: "configuracoes",
    name: "Configurações",
    icon: <Settings2 data-gc="configuracoes.estudio.estudio-de-temas.settings2" size={16} />,
  },
];

const THEME_NAME: Record<string, string> = {
  light: "Base clara",
  dark: "Base escura",
  "mais-escuro": "Base mais escura",
  system: "Base do sistema",
  gravae: "Base Gravaê",
};

export const StudioBody: React.FC<{ action?: React.ReactNode }> = ({ action }) => {
  const [tab, setTab] = useState<Tab>("biblioteca");
  const theme = useAppearance((s) => s.theme);

  return (
    <>
      <nav data-gc="configuracoes.estudio.estudio-de-temas.nav" className="flex w-56 shrink-0 flex-col justify-between bg-surface-1 p-3">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div">
          {TABS.map((item) => (
            <button data-gc="configuracoes.estudio.estudio-de-temas.button"
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                tab === item.id
                  ? "bg-surface-3 font-medium text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </div>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--2" className="border-t border-line pt-3">
          {action}
          <p data-gc="configuracoes.estudio.estudio-de-temas.p" className="px-3 pt-2 text-xs text-ink-faint">{THEME_NAME[theme] ?? "Base"}</p>
        </div>
      </nav>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--3" className="flex min-w-0 flex-1 flex-col">
        <VersionNewNotice data-gc="configuracoes.estudio.estudio-de-temas.version-new-notice" />

        {tab === "cores" && <ColorsTab data-gc="configuracoes.estudio.estudio-de-temas.colors-tab" />}
        {tab === "tokens" && <TokensTab data-gc="configuracoes.estudio.estudio-de-temas.tokens-tab" theme={theme} />}
        {tab === "css" && <CssTab data-gc="configuracoes.estudio.estudio-de-temas.css-tab" />}
        {tab === "ativos" && <ActiveTab data-gc="configuracoes.estudio.estudio-de-temas.active-tab" />}
        {tab === "biblioteca" && <LibraryTab data-gc="configuracoes.estudio.estudio-de-temas.library-tab" />}
        {tab === "configuracoes" && <SettingsTab data-gc="configuracoes.estudio.estudio-de-temas.settings-tab" />}
      </div>
    </>
  );
};

const ColorsTab: React.FC = () => {
  const colorsBase = useStudio((s) => s.colorsBase);
  const saturation = useStudio((s) => s.saturation);
  const setSaturation = useStudio((s) => s.setSaturation);
  const clear = useStudio((s) => s.clearOverrides);

  const picked = Object.keys(colorsBase).length;

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
            value={Math.round(saturation * 100)}
            filled={saturation / 1.5}
            onChange={(e) => setSaturation(Number(e.target.value) / 100)}
            aria-label="Saturação das cores derivadas"
            className="w-28"
          />
          <span data-gc="configuracoes.estudio.estudio-de-temas.span" className="w-9 text-right font-mono text-ink-faint">
            {Math.round(saturation * 100)}%
          </span>
        </label>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button.clear"
          variant="surface"
          size="sm"
          disabled={!picked}
          onClick={clear}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw" size={14} /> Voltar ao base
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--5" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--6" className="grid gap-4 @3xl:grid-cols-2">
          {BASE.map((id) => (
            <BaseCard data-gc="configuracoes.estudio.estudio-de-temas.base-card" key={id} id={id} />
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

const BaseCard: React.FC<{ id: string }> = ({ id }) => {
  const family = COLORS_BASE[id]!;

  const picked = useStudio((s) => s.colorsBase[id]);
  const saturation = useStudio((s) => s.saturation);
  const manual = useStudio((s) => s.manual);
  const setColorBase = useStudio((s) => s.setColorBase);

  const value = picked ?? family.fallback;

  const children = useMemo(
    () => derive(id, value, saturation),
    [id, value, saturation],
  );

  return (
    <section data-gc="configuracoes.estudio.estudio-de-temas.section" className="rounded-lg border border-line bg-surface-1 p-4">
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--7" className="flex items-center gap-3">
        <Popover data-gc="configuracoes.estudio.estudio-de-temas.popover">
          <PopoverTrigger data-gc="configuracoes.estudio.estudio-de-temas.popover-trigger" asChild>
            <button data-gc="configuracoes.estudio.estudio-de-temas.button--2"
              type="button"
              aria-label={`Cor de ${family.label}`}
              style={{ backgroundColor: value }}
              className="size-10 shrink-0 cursor-pointer rounded-lg border border-line-sutil"
            />
          </PopoverTrigger>

          <PopoverContent data-gc="configuracoes.estudio.estudio-de-temas.popover-content" align="start" className="w-60 p-3">
            <PopoverArrow data-gc="configuracoes.estudio.estudio-de-temas.popover-arrow" />
            <ColorField data-gc="configuracoes.estudio.estudio-de-temas.color-field"
              value={value}
              onChange={(fresh) => setColorBase(id, fresh)}
            />
          </PopoverContent>
        </Popover>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--8" className="min-w-0 flex-1">
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--4" className="truncate text-sm font-semibold">{family.label}</p>
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--5" className="truncate text-xs text-ink-faint">{family.hint}</p>
        </div>

        <Input data-gc="configuracoes.estudio.estudio-de-temas.input"
          value={picked ?? ""}
          placeholder={family.fallback}
          onChange={(e) => setColorBase(id, e.target.value || null)}
          aria-label={`Valor de ${family.label}`}
          className={cn(
            "h-8 w-28 shrink-0 font-mono text-xs",
            picked && "border-brand/60",
          )}
        />

        <button data-gc="configuracoes.estudio.estudio-de-temas.button--3"
          type="button"
          onClick={() => setColorBase(id, null)}
          disabled={!picked}
          title="Voltar esta família ao tema base"
          aria-label={`Voltar ${family.label} ao tema base`}
          className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--2" size={14} />
        </button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--9" className="mt-3 flex flex-wrap gap-1">
        {Object.entries(children).map(([name, color]) => (
          <span data-gc="configuracoes.estudio.estudio-de-temas.span--2"
            key={name}
            title={
              manual[name]
                ? `${name} — você mexeu neste à mão, e a sua escolha vence`
                : `${name} = ${color}`
            }
            style={{
              backgroundImage: `linear-gradient(${color}, ${color}),
                repeating-conic-gradient(rgb(255 255 255 / 0.14) 0 25%, transparent 0 50%)`,
              backgroundSize: "auto, 6px 6px",
            }}
            className={cn(
              "size-5 rounded border border-line-sutil",
              manual[name] && "opacity-30",
            )}
          />
        ))}
      </div>
    </section>
  );
};

const TokensTab: React.FC<{ theme: string }> = ({ theme }) => {
  const [search, setSearch] = useState("");
  const [opened, setIsOpen] = useState<Record<string, boolean>>({});

  const overrides = useStudio((s) => s.overrides);
  const clear = useStudio((s) => s.clearOverrides);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return TOKENS_GROUPS.map((group) => ({
      ...group,
      tokens: group.tokens.filter((token) => {
        if (!term) return true;

        return (
          token.label.toLowerCase().includes(term) ||
          token.name.toLowerCase().includes(term)
        );
      }),
    })).filter((group) => group.tokens.length > 0);
  }, [search]);

  const searching = Boolean(search.trim());

  const count = Object.keys(overrides).length;
  const totalShown = groups.reduce((soma, g) => soma + g.tokens.length, 0);

  return (
    <>
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--10" className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3.5 pr-14">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--11" className="relative max-w-sm flex-1">
          <Search data-gc="configuracoes.estudio.estudio-de-temas.search"
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <Input data-gc="configuracoes.estudio.estudio-de-temas.input--2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar tokens"
            className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
          />
        </div>

        <p data-gc="configuracoes.estudio.estudio-de-temas.p--6" className="ml-auto shrink-0 text-xs text-ink-faint">
          {count} {count === 1 ? "substituição" : "substituições"} ·{" "}
          {groups.length} grupos · {totalShown} de {ALL_TOKENS.length}{" "}
          tokens que pintam
        </p>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button.clear--2"
          variant="surface"
          size="sm"
          disabled={!count}
          onClick={clear}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--3" size={14} /> Redefinir tudo
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--12" className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
        {groups.map((group) => {
          const isOpen = searching || opened[group.title] === true;

          return (
            <section data-gc="configuracoes.estudio.estudio-de-temas.section--2"
              key={group.title}
              className="border-b border-divisor last:border-b-0"
            >
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--4"
                type="button"
                onClick={() =>
                  setIsOpen((current) => ({
                    ...current,
                    [group.title]: !current[group.title],
                  }))
                }
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold transition hover:text-brand"
              >
                <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right"
                  size={14}
                  className={cn(
                    "shrink-0 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
                {group.title}
                <span data-gc="configuracoes.estudio.estudio-de-temas.span--3" className="ml-auto text-xs font-normal text-ink-faint">
                  {group.tokens.length}
                </span>
              </button>

              {isOpen && (
                <div data-gc="configuracoes.estudio.estudio-de-temas.div--13" className="mb-3 overflow-hidden rounded-lg border border-line">
                  {group.tokens.map((token) => (
                    <TokenLine data-gc="configuracoes.estudio.estudio-de-temas.token-line" key={token.name} token={token} theme={theme} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {!groups.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--7" className="py-10 text-center text-sm text-ink-faint">
            Nenhum token com esse nome.
          </p>
        )}
      </div>
    </>
  );
};

const TokenLine: React.FC<{
  token: ThemeToken;
  theme: string;
}> = ({ token, theme }) => {
  const manual = useStudio((s) => s.manual[token.name]);
  const worth = useStudio((s) => s.overrides[token.name]);
  const set = useStudio((s) => s.setToken);

  const fromTheme = useMemo(() => themeValue(token.name), [token.name, theme]);

  const value = worth ?? fromTheme;
  const fromBase = Boolean(worth) && !manual;

  const readable = parseColor(value);
  const spin: string[] = (knobs as Record<string, string[]>)[token.name] ?? [];

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--14" className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <Popover data-gc="configuracoes.estudio.estudio-de-temas.popover--2">
        <PopoverTrigger data-gc="configuracoes.estudio.estudio-de-temas.popover-trigger--2" asChild>
          <button data-gc="configuracoes.estudio.estudio-de-temas.button--5"
            type="button"
            disabled={!readable}
            aria-label={`Cor de ${token.label}`}
            title={
              readable
                ? "Escolher a cor"
                : "Esta cor o seletor não sabe ler — edite no campo ao lado"
            }
            style={{
              backgroundImage: `linear-gradient(${value}, ${value}),
                repeating-conic-gradient(rgb(255 255 255 / 0.14) 0 25%, transparent 0 50%)`,
              backgroundSize: "auto, 8px 8px",
            }}
            className="size-7 shrink-0 cursor-pointer rounded-md border border-line-sutil disabled:cursor-not-allowed disabled:opacity-40"
          />
        </PopoverTrigger>

        <PopoverContent data-gc="configuracoes.estudio.estudio-de-temas.popover-content--2" align="start" className="w-60 p-3">
          <PopoverArrow data-gc="configuracoes.estudio.estudio-de-temas.popover-arrow--2" />

          {readable && (
            <ColorField data-gc="configuracoes.estudio.estudio-de-temas.color-field--2"
              value={value}
              onChange={(fresh) => set(token.name, fresh)}
            />
          )}
        </PopoverContent>
      </Popover>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--15" className="min-w-0 flex-1">
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--8" className="flex items-center gap-2 truncate text-sm font-medium">
          <span data-gc="configuracoes.estudio.estudio-de-temas.span--4" className="truncate">{token.label}</span>
        </p>
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--9" className="truncate font-mono text-xs text-ink-faint">
          {token.name}
          {token.hint && <span data-gc="configuracoes.estudio.estudio-de-temas.span--5" className="font-sans"> — {token.hint}</span>}
        </p>

        {spin.length > 0 && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--10"
            title={`Um tema gira este token por: ${spin.join(", ")}`}
            className="truncate font-mono text-10 text-ink-faint/70"
          >
            tema: {spin.join(" · ")}
          </p>
        )}
      </div>

      <Input data-gc="configuracoes.estudio.estudio-de-temas.input--3"
        value={manual ?? ""}
        placeholder={value}
        onChange={(e) => set(token.name, e.target.value || null)}
        aria-label={`Valor de ${token.label}`}
        title={
          fromBase
            ? `Veio da cor-mãe. Escrever aqui vence a derivação. Padrão do tema: ${fromTheme}`
            : `Padrão do tema: ${fromTheme}`
        }
        className={cn(
          "h-8 w-48 shrink-0 font-mono text-xs",
          manual && "border-brand/60",
          fromBase && "border-dashed",
        )}
      />

      <button data-gc="configuracoes.estudio.estudio-de-temas.button--6"
        type="button"
        onClick={() => set(token.name, null)}
        disabled={!manual}
        title="Voltar ao valor do tema"
        aria-label={`Voltar ${token.label} ao valor do tema`}
        className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-25"
      >
        <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--4" size={14} />
      </button>
    </div>
  );
};

const CssTab: React.FC = () => {
  const css = useStudio((s) => s.css);
  const setCss = useStudio((s) => s.setCss);
  const file = useRef<HTMLInputElement>(null);

  const lines = css ? css.split("\n").length : 0;

  return (
    <>
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--16" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--7"
          variant="surface"
          size="sm"
          onClick={() => file.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload" size={14} /> Importar CSS
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--4"
          ref={file}
          type="file"
          accept=".css,text/css"
          className="hidden"
          onChange={async (e) => {
            const picked = e.target.files?.[0];
            e.target.value = "";
            if (picked) setCss(await picked.text());
          }}
        />

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--8"
          variant="surface"
          size="sm"
          onClick={() => download("tema.css", css, "text/css")}
        >
          <Download data-gc="configuracoes.estudio.estudio-de-temas.download" size={14} /> Baixar
        </Button>

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--9"
          variant="surface"
          size="sm"
          onClick={() =>
            void copyText(css).then(() => toast.success("CSS copiado."))
          }
        >
          Copiar
        </Button>

        <ShareButton data-gc="configuracoes.estudio.estudio-de-temas.share-button" />

        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--10"
          variant="surface"
          size="sm"
          className="ml-auto text-danger"
          disabled={!css}
          onClick={() => setCss("")}
        >
          <RotateCcw data-gc="configuracoes.estudio.estudio-de-temas.rotate-ccw--5" size={14} /> Limpar
        </Button>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--17" className="min-h-0 flex-1 p-4">
        <textarea data-gc="configuracoes.estudio.estudio-de-temas.textarea"
          value={css}
          onChange={(e) => setCss(e.target.value)}
          spellCheck={false}
          placeholder={"/* Ex.: */\n.lista-de-membros { width: 12rem; }"}
          aria-label="CSS personalizado"
          className="size-full resize-none rounded-lg border border-line bg-surface-1 p-4 font-mono text-13 leading-relaxed text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
        />
      </div>

      <Hooks data-gc="configuracoes.estudio.estudio-de-temas.hooks" onUse={(snippet) => setCss(css ? `${css}\n\n${snippet}` : snippet)} />

      <CommentsBroken data-gc="configuracoes.estudio.estudio-de-temas.comments-broken.set-css" css={css} onFix={setCss} />

      <ThemeImported data-gc="configuracoes.estudio.estudio-de-temas.theme-imported" css={css} />

      <p data-gc="configuracoes.estudio.estudio-de-temas.p--11" className="shrink-0 border-t border-line px-6 py-2 text-xs text-ink-faint">
        {lines} {lines === 1 ? "linha" : "linhas"} · {css.length} caracteres —
        aplicado na hora, neste aparelho.
      </p>
    </>
  );
};

const ShareButton: React.FC = () => {
  const overrides = useStudio((s) => s.overrides);
  const css = useStudio((s) => s.css);
  const actives = useStudio((s) => s.actives);
  const publish = usePublishTheme();

  const empty = !css.trim() && Object.keys(overrides).length === 0;

  /*
    Só sobe o que o CSS realmente chama. Arquivo que ficou solto no estúdio
    não vira peso no tema de quem instala.
  */
  const forTake = useMemo(() => {
    const requests = activeRequestsNames(css);

    return actives
      .filter((active) => requests.some((request) => matchesWithRequest(active.name, request)))
      .slice(0, ACTIVE_LIMIT)
      .map((active) => ({
        name: active.name,
        url: active.url,
        ...(active.kind ? { kind: active.kind } : {}),
        ...(active.bytes === undefined ? {} : { bytes: active.bytes }),
      }));
  }, [actives, css]);

  return (
    <Button data-gc="configuracoes.estudio.estudio-de-temas.button--11"
      size="sm"
      disabled={empty || publish.isPending}
      title={empty ? "Mexa em alguma cor ou escreva CSS antes" : undefined}
      onClick={() =>
        publish.mutate(
          { css, overrides, actives: forTake },
          {
            onSuccess: (theme) => {
              const link = `${window.location.origin}${THEME_PATH}${theme.id}`;

              void copyText(link).then((gave) =>
                gave
                  ? toast.success("Link copiado. Cole num canal e vira um cartão de importar.")
                  : toast.info(link),
              );
            },
          },
        )
      }
    >
      <Share2 data-gc="configuracoes.estudio.estudio-de-temas.share2" size={14} /> {publish.isPending ? "Publicando…" : "Compartilhar"}
      {forTake.length > 0 && !publish.isPending && (
        <span data-gc="configuracoes.estudio.estudio-de-temas.span--6" className="text-ink-faint">
          · {forTake.length} {forTake.length === 1 ? "arquivo" : "arquivos"}
        </span>
      )}
    </Button>
  );
};

/*
  A receita de fundo por pessoa. Cada linha da lista de membros, cada quem
  está na voz e a área do usuário carregam `data-gc-usuario` com o id de quem
  está ali, então o tema pinta uma pessoa só sem precisar de `:has()`.

  O degradê escuro vai na MESMA pilha de background, por cima da imagem: é o
  que garante que o nome continue legível seja qual for a foto escolhida.
*/
function backgroundRecipe(userId: string) {
  return `/* Um fundo só no seu nome, na lista de membros e no rodapé. */
[data-gc-usuario="${userId}"] {
  background-image:
    linear-gradient(rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.55)),
    gc-ativo("fundo");
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg, 0.5rem);
}`;
}

const SHRINK = `/* A lista de membros encolhe sozinha e volta quando o mouse chega. */
.lista-de-membros {
  transition: width 0.3s ease;
}

body:not(:has(.lista-de-membros:hover)) .lista-de-membros {
  width: 3rem;
}`;

function useListHooks(needs: boolean) {
  const [list, setList] = useState<string[] | null>(null);

  useEffect(() => {
    if (!needs || list) return;

    let live = true;

    void import("~/features/configuracoes/lib/ganchos.json").then((modulo) => {
      if (live) setList(modulo.default as string[]);
    });

    return () => {
      live = false;
    };
  }, [needs, list]);

  return list;
}

const CommentsBroken: React.FC<{
  css: string;
  onFix: (css: string) => void;
}> = ({ css, onFix }) => {
  const matches = useMemo(() => findCommentsBroken(css), [css]);

  if (!matches.length) return null;

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--18" className="shrink-0 border-t border-line bg-aviso/[0.07] px-6 py-3">
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--12" className="text-xs font-semibold uppercase tracking-wide text-aviso">
        {matches.length === 1
          ? "1 comentário quebrado"
          : `${matches.length} comentários quebrados`}
      </p>

      <p data-gc="configuracoes.estudio.estudio-de-temas.p--13" className="mt-1.5 text-xs text-ink-muted">
        Um comentário fecha e emenda outro asterisco logo em seguida. O navegador
        descarta o que sobra até o ponto e vírgula, e leva junto a declaração
        seguinte — que é por que parte do tema não pega.
      </p>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--19" className="mt-2 flex max-h-24 flex-col gap-0.5 overflow-y-auto">
        {matches.map((match, index) => (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--14" key={`${match.line}-${index}`} className="font-mono text-xs text-ink-muted">
            linha {match.line}
            {match.variable ? ` — some ${match.variable}` : " — some a declaração seguinte"}
          </p>
        ))}
      </div>

      <Button data-gc="configuracoes.estudio.estudio-de-temas.button--12"
        variant="surface"
        size="sm"
        className="mt-2"
        onClick={() => {
          onFix(fixCommentsBroken(css));
          toast.success("Comentários consertados.");
        }}
      >
        Consertar
      </Button>
    </div>
  );
};

const PickersDated: React.FC<{ stuck: number; withDiv: number; css: string }> = ({
  stuck,
  withDiv,
  css,
}) => {
  const activeId = useStudio((e) => e.activeId);
  const loose = useStudio((e) => e.stripe);
  const fromLibrary = useStudio((e) => e.library.find((t) => t.id === e.activeId)?.stripe);
  const setStripe = useStudio((e) => e.setStripe);

  const selection = activeId ? fromLibrary : loose;
  const automatic = selection === undefined || selection === null;
  const stripe = selection ?? !mustTranslate(css);

  const existsLoose = useStudio((e) => e.soExistsLa);
  const libraryExists = useStudio(
    (e) => e.library.find((t) => t.id === e.activeId)?.soExistsLa,
  );
  const setSoExistsLa = useStudio((e) => e.setSoExistsLa);
  const soExistsLa = (activeId ? libraryExists : existsLoose) ?? true;
  const dead = countRulesDead(css, existsReference);

  const parts = [
    stuck > 0 && `${stuck} ${stuck === 1 ? "presa ao hash" : "presas ao hash"} do build`,
    withDiv > 0 && `${withDiv} ${withDiv === 1 ? "escrita" : "escritas"} com \`div\` na frente`,
  ].filter(Boolean);

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--20" className="mt-2">
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--15" className="text-xs text-ink-muted">
        Este tema tem {parts.join(" e ")}. As duas coisas apontam para o cliente de quem
        escreveu, no dia em que escreveu — o hash muda a cada build, e o `div` era a tag daquele
        elemento naquela versão. Aplicado como está, o que morreu lá morre aqui também: é isso
        que faz o tema aparecer aqui igual ao que você vê na referência.
      </p>

      <Choice data-gc="configuracoes.estudio.estudio-de-temas.choice.set-so-exists-la"
        title="Só o que existe na referência hoje"
        detail={
          `Ligado, as regras deste tema que miram nome de um build antigo — que lá já não pegam — não pegam aqui também: ${dead} regra(s). É o que faz o tema aparecer aqui como aparece lá. Desligado, o arquivo vale inteiro.`
        }
        on={soExistsLa}
        onChange={setSoExistsLa}
      />

      <Choice data-gc="configuracoes.estudio.estudio-de-temas.choice.set-stripe"
        title="Seguir o tema à risca"
        detail={
          (automatic
            ? stripe
              ? "Escolhido pelo app: este tema tem seletor solto o bastante para valer como está. "
              : "Escolhido pelo app: este tema é quase só nome preso a build, e como está não sobraria nada dele. "
            : "") +
          `Ligado, o arquivo entra sem troca nenhuma. Desligado, o que está datado é traduzido — ${stuck + withDiv} regra(s) aqui.`
        }
        on={stripe}
        onChange={setStripe}
      />
    </div>
  );
};

const ThemeImported: React.FC<{ css: string }> = ({ css }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { matches, missing } = useMemo(() => checkCompatibility(css), [css]);

  const dated = useMemo(() => countPickersDated(css), [css]);
  const total = matches.length + missing.length;

  const tokens = useMemo(() => checkTokens(css), [css]);
  const totalDeTokens = tokens.translated.length + tokens.ignoredList.length;

  if (!total && !totalDeTokens) return null;

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--21" className="shrink-0 border-t border-line px-6 py-3">
      <button data-gc="configuracoes.estudio.estudio-de-temas.button--13"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right--2" size={14} className={cn("transition-transform", isOpen && "rotate-90")} />
        Tema importado
        <span data-gc="configuracoes.estudio.estudio-de-temas.span--7" className="ml-auto flex items-center gap-2 normal-case tracking-normal">
          {totalDeTokens > 0 && (
            <span data-gc="configuracoes.estudio.estudio-de-temas.span--8"
              title="Variáveis que o tema declara e que chegam na tela"
              className={cn(
                "font-mono",
                tokens.ignoredList.length ? "text-aviso" : "text-online",
              )}
            >
              {tokens.translated.length}/{totalDeTokens} cores
            </span>
          )}

          {total > 0 && (
            <span data-gc="configuracoes.estudio.estudio-de-temas.span--9" className={cn("font-mono", missing.length ? "text-aviso" : "text-online")}>
              {matches.length}/{total} lugares
            </span>
          )}
        </span>
      </button>

      {isOpen && (
        <>
          {(dated.stuck > 0 || dated.withDiv > 0) && (
            <PickersDated data-gc="configuracoes.estudio.estudio-de-temas.pickers-dated" {...dated} css={css} />
          )}

          {totalDeTokens > 0 && (
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--16" className="mt-2 text-xs text-ink-faint">
              Ele declara {totalDeTokens} {totalDeTokens === 1 ? "cor" : "cores"}.{" "}
              {tokens.ignoredList.length
                ? `${tokens.ignoredList.length} ${tokens.ignoredList.length === 1 ? "não chega" : "não chegam"} na tela — não há nada aqui que leia esses nomes.`
                : "Todas chegam na tela."}
              {tokens.translated.length > 0 &&
                " O resto das superfícies sai por derivação, a partir do que ele disse."}
            </p>
          )}

          {tokens.ignoredList.length > 0 && (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--22" className="mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {tokens.ignoredList.map((name) => (
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--17" key={name} className="truncate font-mono text-xs text-ink-muted">
                  {name}
                </p>
              ))}
            </div>
          )}

          {total > 0 && (
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--18" className="mt-2 text-xs text-ink-faint">
              Este tema mira {total} {total === 1 ? "lugar" : "lugares"} de outro cliente.{" "}
              {missing.length
                ? `${missing.length} não ${missing.length === 1 ? "existe" : "existem"} aqui — o que o tema faz neles não tem efeito.`
                : "Todos existem aqui."}
            </p>
          )}

          {missing.length > 0 && (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--23" className="mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
              {missing.map((name) => (
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--19" key={name} className="truncate font-mono text-xs text-ink-muted">
                  {name}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Recipe: React.FC<{
  css: string;
  onUse: (snippet: string) => void;
  note?: string;
}> = ({ css, onUse, note }) => (
  <div data-gc="configuracoes.estudio.estudio-de-temas.div--24" className="mt-3 rounded-lg border border-line bg-surface-1 p-3">
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--25" className="flex items-start gap-2">
      <pre data-gc="configuracoes.estudio.estudio-de-temas.pre" className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-ink-muted">
        {css}
      </pre>

      <Button data-gc="configuracoes.estudio.estudio-de-temas.button--14" variant="surface" size="sm" onClick={() => onUse(css)}>
        Usar
      </Button>
    </div>

    {note && <p data-gc="configuracoes.estudio.estudio-de-temas.p--20" className="mt-2 text-xs text-ink-faint">{note}</p>}
  </div>
);

const Hooks: React.FC<{ onUse: (snippet: string) => void }> = ({ onUse }) => {
  const { user } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const list = useListHooks(isOpen);
  const term = search.trim().toLowerCase();

  const { show, total } = useMemo(() => {
    if (!list || term.length < 2) return { show: [], total: 0 };

    const match = list.filter((name) => name.includes(term));

    return { show: match.slice(0, 40), total: match.length };
  }, [list, term]);

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--26" className="shrink-0 border-t border-line px-6 py-3">
      <button data-gc="configuracoes.estudio.estudio-de-temas.button--15"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronRight data-gc="configuracoes.estudio.estudio-de-temas.chevron-right--3"
          size={14}
          className={cn("transition-transform", isOpen && "rotate-90")}
        />
        Em que dá para mexer
      </button>

      {isOpen && (
        <>
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--21" className="mt-2 text-xs text-ink-faint">
            Estas classes ficam paradas em cada região da tela — é nelas que um
            tema se agarra. O resto das classes é gerado e muda a cada build.
          </p>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--27" className="mt-2 flex flex-wrap gap-1.5">
            {HOOKS.map((hook) => (
              <button data-gc="configuracoes.estudio.estudio-de-temas.button--16"
                key={hook.cssClass}
                type="button"
                title={hook.oQueE}
                onClick={() => onUse(`.${hook.cssClass} {\n  \n}`)}
                className="rounded border border-line px-2 py-1 font-mono text-xs text-ink-muted transition hover:border-ink-faint hover:text-ink"
              >
                .{hook.cssClass}
              </button>
            ))}
          </div>

          <div data-gc="configuracoes.estudio.estudio-de-temas.div--28" className="mt-4 border-t border-line pt-3">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--22" className="text-xs text-ink-faint">
              E cada elemento do app carrega um{" "}
              <code data-gc="configuracoes.estudio.estudio-de-temas.code" className="font-mono text-ink-muted">data-gc</code> com o
              caminho de onde ele está. São {list ? list.length : "4754"} —
              procure pelo nome da tela, do componente ou do botão.
            </p>

            <input data-gc="configuracoes.estudio.estudio-de-temas.input--5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="conversa, avatar, apagar…"
              aria-label="Procurar um gancho"
              className="mt-2 w-full rounded border border-line bg-campo px-2 py-1.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
            />

            {term.length >= 2 && (
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--29" className="mt-2">
                {!list ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--23" className="text-xs text-ink-faint">Carregando a lista…</p>
                ) : !total ? (
                  <p data-gc="configuracoes.estudio.estudio-de-temas.p--24" className="text-xs text-ink-faint">
                    Nada com esse nome. Tente um pedaço menor.
                  </p>
                ) : (
                  <>
                    <div data-gc="configuracoes.estudio.estudio-de-temas.div--30" className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                      {show.map((name) => (
                        <button data-gc="configuracoes.estudio.estudio-de-temas.button--17"
                          key={name}
                          type="button"
                          onClick={() => onUse(`[data-gc="${name}"] {\n  \n}`)}
                          className="truncate rounded px-2 py-1 text-left font-mono text-xs text-ink-muted transition hover:bg-hover hover:text-ink"
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {total > show.length && (
                      <p data-gc="configuracoes.estudio.estudio-de-temas.p--25" className="mt-1 px-2 text-xs text-ink-faint">
                        e mais {total - show.length}. Escreva mais para
                        estreitar.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <Recipe data-gc="configuracoes.estudio.estudio-de-temas.recipe.on-use" css={SHRINK} onUse={onUse} />

          {user && (
            <Recipe data-gc="configuracoes.estudio.estudio-de-temas.recipe.on-use--2"
              css={backgroundRecipe(user.id)}
              onUse={onUse}
              note='Suba a imagem na aba Arquivos com o nome "fundo". Ela viaja junto quando você publicar o tema.'
            />
          )}
        </>
      )}
    </div>
  );
};

const ActiveTab: React.FC = () => {
  const actives = useStudio((s) => s.actives);
  const css = useStudio((s) => s.css);
  const activeStore = useStudio((s) => s.activeStore);
  const deleteActive = useStudio((s) => s.deleteActive);
  const confirm = useConfirm();
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [missing, setMissing] = useState<string[]>(activeMissing);

  useEffect(() => {
    const read = () => setMissing(activeMissing());

    read();
    window.addEventListener(THEME_APPLIED, read);
    return () => window.removeEventListener(THEME_APPLIED, read);
  }, [css, actives]);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    setUploading(true);
    const attachment = await sendFile(picked).catch(() => null);
    setUploading(false);

    if (!attachment) return toast.error("Não deu pra subir o arquivo.");

    activeStore({
      name: picked.name,
      url: attachment.url,
      kind: picked.type,
      bytes: picked.size,
    });
  };

  return (
    <>
      <div data-gc="configuracoes.estudio.estudio-de-temas.div--31" className="flex shrink-0 items-center gap-2 border-b border-line px-6 py-3.5 pr-14">
        <Button data-gc="configuracoes.estudio.estudio-de-temas.button--18"
          variant="surface"
          size="sm"
          disabled={uploading}
          onClick={() => file.current?.click()}
        >
          <Upload data-gc="configuracoes.estudio.estudio-de-temas.upload--2" size={14} /> {uploading ? "Enviando…" : "Carregar arquivo"}
        </Button>
        <input data-gc="configuracoes.estudio.estudio-de-temas.input--6"
          ref={file}
          type="file"
          accept="image/*,font/*,.woff,.woff2,.ttf,.otf"
          className="hidden"
          onChange={(e) => void pick(e)}
        />
        <p data-gc="configuracoes.estudio.estudio-de-temas.p--26" className="text-xs text-ink-faint">
          Imagem ou fonte. No CSS, chame pelo nome:{" "}
          <code data-gc="configuracoes.estudio.estudio-de-temas.code--2" className="font-mono">gc-ativo("fundo")</code>.
        </p>
      </div>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--32" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {missing.length > 0 && (
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--33" className="mb-4 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-xs">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--27" className="font-medium">
              O tema pede {missing.length}{" "}
              {missing.length === 1 ? "arquivo" : "arquivos"} que não estão
              aqui.
            </p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--28" className="mt-1 text-ink-muted">
              Suba com o mesmo nome e ele aparece:{" "}
              <span data-gc="configuracoes.estudio.estudio-de-temas.span--10" className="font-mono">{missing.join(", ")}</span>
            </p>
          </div>
        )}

        {!actives.length && (
          <p data-gc="configuracoes.estudio.estudio-de-temas.p--29" className="py-10 text-center text-sm text-ink-faint">
            Nenhum arquivo ainda. Suba uma imagem e cole o{" "}
            <code data-gc="configuracoes.estudio.estudio-de-temas.code--3" className="font-mono">url(…)</code> no seu CSS.
          </p>
        )}

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--34" className="grid grid-cols-2 gap-3 @3xl:grid-cols-3">
          {actives.map((active) => (
            <div data-gc="configuracoes.estudio.estudio-de-temas.div--35"
              key={active.id}
              className="overflow-hidden rounded-lg border border-line"
            >
              <div data-gc="configuracoes.estudio.estudio-de-temas.div--36" className="flex h-28 items-center justify-center bg-surface-1">
                {active.kind.startsWith("image/") ? (
                  <img data-gc="configuracoes.estudio.estudio-de-temas.img"
                    src={active.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <FileCode2 data-gc="configuracoes.estudio.estudio-de-temas.file-code2--2" size={28} className="text-ink-faint" />
                )}
              </div>

              <div data-gc="configuracoes.estudio.estudio-de-temas.div--37" className="flex items-center gap-2 p-2">
                <p data-gc="configuracoes.estudio.estudio-de-temas.p--30"
                  className="min-w-0 flex-1 truncate text-xs"
                  title={active.name}
                >
                  {active.name}
                </p>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--19"
                  onClick={() =>
                    void copyText(`gc-ativo("${active.name}")`).then(
                      (ok) => ok && toast.success("Copiado. Cole no CSS."),
                    )
                  }
                  title={`Copiar como gc-ativo("${active.name}") — é assim que o tema viaja para outra máquina`}
                  aria-label={`Copiar o nome de ${active.name}`}
                  className="rounded p-1 text-ink-faint transition hover:text-ink"
                >
                  <Copy data-gc="configuracoes.estudio.estudio-de-temas.copy" size={14} />
                </button>

                <button data-gc="configuracoes.estudio.estudio-de-temas.button--20"
                  onClick={() =>
                    void confirm({
                      title: `Tirar "${active.name}" da lista?`,
                      description:
                        "O CSS que usa este endereço para de achar o arquivo. O arquivo em si continua onde está.",
                      action: "Tirar",
                    }).then(
                      ({ confirmed }) => confirmed && deleteActive(active.id),
                    )
                  }
                  aria-label={`Tirar ${active.name}`}
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

const SettingsTab: React.FC = () => {
  const clearOverrides = useStudio((s) => s.clearOverrides);
  const clearEverything = useStudio((s) => s.clearEverything);
  const confirm = useConfirm();

  return (
    <div data-gc="configuracoes.estudio.estudio-de-temas.div--38" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <h3 data-gc="configuracoes.estudio.estudio-de-temas.h3" className="mb-1 text-sm font-semibold text-danger">Zona de perigo</h3>
      <p data-gc="configuracoes.estudio.estudio-de-temas.p--31" className="mb-4 text-sm text-ink-muted">
        Nada aqui viaja com a conta: tudo o que o estúdio guarda é deste
        aparelho.
      </p>

      <div data-gc="configuracoes.estudio.estudio-de-temas.div--39" className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        <div data-gc="configuracoes.estudio.estudio-de-temas.div--40" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--41" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--32" className="text-sm font-medium">
              Limpar as substituições de token
            </p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--33" className="text-xs text-ink-faint">
              As cores voltam a ser as do tema. A biblioteca e o CSS ficam.
            </p>
          </div>
          <Button data-gc="configuracoes.estudio.estudio-de-temas.button.clear-overrides" variant="surface" size="sm" onClick={clearOverrides}>
            Limpar
          </Button>
        </div>

        <div data-gc="configuracoes.estudio.estudio-de-temas.div--42" className="flex items-center gap-4 p-4">
          <div data-gc="configuracoes.estudio.estudio-de-temas.div--43" className="min-w-0 flex-1">
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--34" className="text-sm font-medium">Apagar tudo do estúdio</p>
            <p data-gc="configuracoes.estudio.estudio-de-temas.p--35" className="text-xs text-ink-faint">
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
              }).then(({ confirmed }) => confirmed && clearEverything())
            }
          >
            <Trash2 data-gc="configuracoes.estudio.estudio-de-temas.trash2--2" size={14} /> Apagar tudo
          </Button>
        </div>
      </div>
    </div>
  );
};

function download(name: string, content: string, kind: string) {
  const url = URL.createObjectURL(new Blob([content], { type: kind }));
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  link.click();

  URL.revokeObjectURL(url);
}
