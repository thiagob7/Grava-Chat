import { create } from "zustand";

import existsReference from "~/features/configuracoes/lib/existe-na-referencia.json";

import { readThemeHeader } from "@gravae/shared";

import {
  THEME_FIXES,
  outsideLooksTheme,
} from "~/features/configuracoes/lib/correcoes-de-tema";
import { resolveActive } from "~/features/configuracoes/lib/ativos-do-tema";
import {
  completeWithDerivation,
  buildTheme,
} from "~/features/configuracoes/lib/cores-mae";
import {
  SHIELD_ID,
  shieldCss,
  measureBase,
} from "~/features/configuracoes/lib/escudo-do-estudio";
import { notifyThemeApplied } from "~/features/configuracoes/lib/evento-de-tema";
import {
  translatePickersLocked,
  filterRulesDead,
} from "~/features/configuracoes/lib/normalizar-tema";
import { themeOffByUrl } from "~/features/configuracoes/lib/saida-de-emergencia";
import {
  ORIGIN_NAMES,
  namesDeclaredTheme,
  translateTheme,
} from "~/features/configuracoes/lib/ponte-de-tema";

export interface ThemeSaved {
  id: string;
  name: string;
  author?: string | null;
  version?: string | null;
  description?: string | null;
  tags?: string[];
  overrides: Record<string, string>;
  colorsBase?: Record<string, string>;
  saturation?: number;
  manual?: Record<string, string>;
  css: string;
  stripe?: boolean | null;
  soExistsLa?: boolean | null;
  originId?: string | null;
}

export interface ThemeActive {
  id: string;
  name: string;
  url: string;
  kind: string;
  bytes?: number;
}

interface ActiveArrived {
  name: string;
  url: string;
  kind?: string;
  bytes?: number;
}

interface StudioState {
  overrides: Record<string, string>;
  colorsBase: Record<string, string>;
  saturation: number;
  manual: Record<string, string>;
  css: string;
  library: ThemeSaved[];
  actives: ThemeActive[];
  activeId: string | null;
  stripe: boolean | null;
  soExistsLa: boolean | null;
  /*
    De qual tema publicado o CSS de agora veio. Sem isso o tema importado
    congela: quem publicou solta uma versão nova e a cópia daqui nunca fica
    sabendo.
  */
  originId: string | null;
}

interface StudioStore extends StudioState {
  setToken: (name: string, value: string | null) => void;
  setColorBase: (id: string, value: string | null) => void;
  setSaturation: (factor: number) => void;
  setCss: (css: string) => void;
  saveLibrary: (name: string) => void;
  applyLibrary: (id: string) => void;
  deleteLibrary: (id: string) => void;
  doImport: (theme: {
    overrides?: Record<string, string>;
    css?: string;
    name?: string;
    actives?: ActiveArrived[];
    originId?: string | null;
  }) => void;
  importCssAsTheme: (css: string, fileName?: string) => string;
  updateLibrary: (id: string, data: Partial<Omit<ThemeSaved, "id">>) => void;
  libraryDuplicate: (id: string) => void;
  toggleTheme: (id: string) => void;
  setStripe: (stripe: boolean) => void;
  setSoExistsLa: (on: boolean) => void;
  importLibrary: (themes: ThemeSaved[]) => void;
  activeStore: (active: Omit<ThemeActive, "id">) => void;
  deleteActive: (id: string) => void;
  clearOverrides: () => void;
  clearEverything: () => void;
}

const KEY = "gravae:estudio";

let channel: BroadcastChannel | null = null;
const EMPTY: StudioState = {
  overrides: {},
  colorsBase: {},
  saturation: 1,
  manual: {},
  css: "",
  library: [],
  actives: [],
  activeId: null,
  stripe: null,
  soExistsLa: null,
  originId: null,
};

function read(): StudioState {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return EMPTY;

    const kept = JSON.parse(saved) as Partial<StudioState>;

    const pickedStripe = (kept.library ?? []).some((t) => t.stripe !== undefined);

    return {
      ...EMPTY,
      ...kept,
      manual: kept.manual ?? kept.overrides ?? {},
      stripe: pickedStripe ? (kept.stripe ?? null) : null,
    };
  } catch {
    return EMPTY;
  }
}

const WITHOUT_THEME = { colorsBase: {}, saturation: 1, manual: {} };

function fromTheme(theme: ThemeSaved) {
  return {
    colorsBase: { ...(theme.colorsBase ?? {}) },
    saturation: theme.saturation ?? 1,
    manual: { ...(theme.manual ?? theme.overrides) },
  };
}

const STYLE_ID = "gc-estudio-css";
const FIXES_ID = "gc-correcoes-de-tema";

const isStudioWindow = () =>
  typeof window !== "undefined" && window.location.pathname === "/estudio";

let written = new Set<string>();

function apply(state: StudioState) {
  const root = document.documentElement;

  for (const name of written) {
    if (!(name in state.overrides)) root.style.removeProperty(name);
  }

  written = new Set(Object.keys(state.overrides));

  if (isStudioWindow() || themeOffByUrl()) {
    notifyThemeApplied();
    return;
  }

  for (const [name, value] of Object.entries(state.overrides)) {
    root.style.setProperty(name, value);
  }

  if (state.saturation === 1) root.style.removeProperty("--saturation-factor");
  else root.style.setProperty("--saturation-factor", String(state.saturation));

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  const activeFrom = state.library.find((t) => t.id === state.activeId);
  const selection = activeFrom ? activeFrom.stripe : state.stripe;

  const stripe = selection ?? false;

  const existChoice = activeFrom ? activeFrom.soExistsLa : state.soExistsLa;
  const soExistsLa = existChoice ?? true;
  const cssSeen = soExistsLa ? filterRulesDead(state.css, existsReference) : state.css;

  const resolved = resolveActive(
    stripe ? cssSeen : translatePickersLocked(cssSeen),
    state.actives,
  );

  missingNow = resolved.missing;
  style.textContent = resolved.css;

  let fixes = document.getElementById(FIXES_ID);

  if (outsideLooksTheme(state.css)) {
    if (!fixes) {
      fixes = document.createElement("style");
      fixes.id = FIXES_ID;
      document.head.appendChild(fixes);
    }

    fixes.textContent = THEME_FIXES;
  } else {
    fixes?.remove();
  }

  applyBridge(state);
  applyShield();
  notifyThemeApplied();
}

let missingNow: string[] = [];

export const activeMissing = () => missingNow;

let shieldFor: string | null = null;

function applyShield() {
  const variant = document.documentElement.dataset.tema ?? "";
  if (shieldFor === variant) return;

  let shield = document.getElementById(SHIELD_ID);

  if (!shield) {
    shield = document.createElement("style");
    shield.id = SHIELD_ID;
  }

  shield.textContent = shieldCss(measureBase(STYLE_ID));
  document.head.appendChild(shield);
  shieldFor = variant;
}

export function reviewShield() {
  shieldFor = null;
  applyShield();
}

let fromBridge = new Set<string>();

function applyBridge(state: StudioState) {
  const root = document.documentElement;

  for (const name of fromBridge) {
    if (!(name in state.overrides)) root.style.removeProperty(name);
  }

  fromBridge = new Set();

  if (!state.css.trim()) return;

  const declared = namesDeclaredTheme(state.css);

  const read = getComputedStyle(document.body ?? root);
  const origins: Record<string, string> = {};

  for (const name of ORIGIN_NAMES) {
    if (declared.has(name)) origins[name] = read.getPropertyValue(name);
  }

  const picked = new Set(Object.keys(state.overrides));
  const translated = translateTheme(origins, picked);

  for (const [name, value] of Object.entries(
    completeWithDerivation(translated, state.saturation),
  )) {
    if (picked.has(name)) continue;

    root.style.setProperty(name, value);
    fromBridge.add(name);
  }

}

export const useStudio = create<StudioStore>((set, store) => {
  const keep = (change: Partial<StudioState>) => {
    set(change);

    const {
      css,
      library,
      actives,
      activeId,
      colorsBase,
      saturation,
      manual,
      stripe,
      soExistsLa,
      originId,
    } = store();

    const overrides = buildTheme(colorsBase, saturation, manual);
    set({ overrides });

    const whole = {
      overrides,
      colorsBase,
      saturation,
      manual,
      css,
      library,
      actives,
      activeId,
      stripe,
      soExistsLa,
      originId,
    };

    apply(whole);

    try {
      localStorage.setItem(KEY, JSON.stringify(whole));
    } catch {
    }

    channel?.postMessage(1);
  };

  return {
    ...read(),

    setToken: (name, value) => {
      const manual = { ...store().manual };
      if (value === null) delete manual[name];
      else manual[name] = value;

      keep({ manual });
    },

    setColorBase: (id, value) => {
      const colorsBase = { ...store().colorsBase };
      if (value === null) delete colorsBase[id];
      else colorsBase[id] = value;

      keep({ colorsBase });
    },

    setSaturation: (factor) => keep({ saturation: factor }),

    setStripe: (stripe) => {
      const { activeId, library } = store();
      if (!activeId) return keep({ stripe });

      keep({
        stripe,
        library: library.map((t) => (t.id === activeId ? { ...t, stripe } : t)),
      });
    },

    setSoExistsLa: (on) => {
      const { activeId, library } = store();
      if (!activeId) return keep({ soExistsLa: on });

      keep({
        soExistsLa: on,
        library: library.map((t) => (t.id === activeId ? { ...t, soExistsLa: on } : t)),
      });
    },

    setCss: (css) => keep({ css }),

    saveLibrary: (name) =>
      keep({
        library: [
          ...store().library,
          {
            id: crypto.randomUUID(),
            name,
            overrides: { ...store().overrides },
            colorsBase: { ...store().colorsBase },
            saturation: store().saturation,
            manual: { ...store().manual },
            css: store().css,
            originId: store().originId,
          },
        ],
      }),

    applyLibrary: (id) => {
      const theme = store().library.find((t) => t.id === id);
      if (!theme) return;

      keep({
        ...fromTheme(theme),
        css: theme.css,
        activeId: id,
        originId: theme.originId ?? null,
      });
    },

    toggleTheme: (id) => {
      const theme = store().library.find((t) => t.id === id);
      if (!theme) return;

      if (store().activeId === id) {
        keep({ ...WITHOUT_THEME, css: "", activeId: null, originId: null });
        return;
      }

      keep({
        ...fromTheme(theme),
        css: theme.css,
        activeId: id,
        originId: theme.originId ?? null,
      });
    },

    updateLibrary: (id, data) => {
      const library = store().library.map((theme) =>
        theme.id === id ? { ...theme, ...data } : theme,
      );

      const worth = store().activeId === id;
      const current = library.find((t) => t.id === id);

      keep(
        worth && current
          ? { library, ...fromTheme(current), css: current.css }
          : { library },
      );
    },

    libraryDuplicate: (id) => {
      const theme = store().library.find((t) => t.id === id);
      if (!theme) return;

      keep({
        library: [
          ...store().library,
          { ...theme, id: crypto.randomUUID(), name: `${theme.name} (cópia)` },
        ],
      });
    },

    importCssAsTheme: (css, fileName) => {
      const header = readThemeHeader(css);
      const id = crypto.randomUUID();

      keep({
        library: [
          ...store().library,
          {
            id,
            name: header.name ?? fileName ?? "Tema sem nome",
            author: header.author,
            version: header.version,
            description: header.description,
            tags: header.tags,
            overrides: {},
            css,
          },
        ],
      });

      return id;
    },

    importLibrary: (themes) =>
      keep({
        library: [
          ...store().library,
          ...themes.map((theme) => ({ ...theme, id: crypto.randomUUID() })),
        ],
      }),

    deleteLibrary: (id) =>
      keep({
        library: store().library.filter((theme) => theme.id !== id),
        ...(store().activeId === id ? { ...WITHOUT_THEME, css: "", activeId: null } : {}),
      }),

    /*
      O tema chega com as imagens dele. Um arquivo com o mesmo nome que já
      estava aqui sai do caminho, senão o `gc-ativo()` do tema novo resolveria
      para a imagem do tema velho.
    */
    doImport: ({ overrides, css, actives, originId }) => {
      const arrived = (actives ?? []).map((active) => ({
        id: crypto.randomUUID(),
        name: active.name,
        url: active.url,
        kind: active.kind ?? "",
        ...(active.bytes === undefined ? {} : { bytes: active.bytes }),
      }));

      const names = new Set(arrived.map((active) => active.name));

      keep({
        ...WITHOUT_THEME,
        manual: { ...(overrides ?? {}) },
        css: css ?? "",
        actives: [...store().actives.filter((a) => !names.has(a.name)), ...arrived],
        originId: originId ?? null,
      });
    },

    activeStore: (active) =>
      keep({ actives: [...store().actives, { ...active, id: crypto.randomUUID() }] }),

    deleteActive: (id) => keep({ actives: store().actives.filter((a) => a.id !== id) }),

    clearOverrides: () => keep({ ...WITHOUT_THEME }),

    clearEverything: () =>
      keep({
        ...WITHOUT_THEME,
        css: "",
        library: [],
        actives: [],
        activeId: null,
        originId: null,
      }),
  };
});

apply(useStudio.getState());

function receive() {
  const arrived = read();

  useStudio.setState(arrived);
  apply(arrived);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) receive();
  });

  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(KEY);
    channel.onmessage = receive;
  }
}
