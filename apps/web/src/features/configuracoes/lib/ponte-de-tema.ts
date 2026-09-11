export const THEME_BRIDGE: Record<string, string[]> = {
  "--background-floating": ["--color-surface-4"],
  "--background-accent": ["--color-brand"],
  "--background-mobile-primary": ["--color-surface-0"],
  "--background-mobile-secondary": ["--color-surface-1"],
  "--background-message-hover": ["--color-hover"],
  "--background-modifier-active": ["--color-selecionado"],
  "--channeltextarea-background": ["--color-campo"],
  "--deprecated-panel-background": ["--color-painel"],
  "--deprecated-quickswitcher-input-background": ["--color-campo"],

  "--header-primary": ["--color-ink"],
  "--header-secondary": ["--color-ink-muted"],
  "--text-normal": ["--color-ink-muted"],
  "--text-muted": ["--color-ink-faint"],
  "--channels-default": ["--color-ink-muted"],

  "--interactive-normal": ["--color-ink-muted"],
  "--interactive-hover": ["--color-ink"],

  "--brand-experiment": ["--color-brand"],
  "--brand-500": ["--color-brand"],
  "--brand-560": ["--color-brand-hover"],

  "--status-positive": ["--color-online"],
  "--status-warning-background": ["--color-idle"],
  "--info-danger-foreground": ["--color-danger"],
  "--info-warning-foreground": ["--color-idle"],
  "--info-positive-foreground": ["--color-online"],

  "--bg-primary": ["--color-surface-0"],
  "--bg-secondary": ["--color-surface-1"],
  "--bg-tertiary": ["--color-surface-3"],
  "--bg-hover": ["--color-hover"],
  "--bg-active": ["--color-selecionado"],
  "--bg-code": ["--color-codigo"],
  "--bg-code-block": ["--color-codigo-bloco"],
  "--bg-table-header": ["--color-surface-3"],
  "--background-header-primary-hover": ["--color-hover"],

  "--panel-control-bg": ["--color-surface-3"],
  "--panel-control-border": ["--color-line"],
  "--panel-control-divider": ["--color-divisor"],

  "--control-button-normal-text": ["--color-ink-muted"],
  "--control-button-hover-text": ["--color-ink"],
  "--control-button-active-text": ["--color-ink"],
  "--control-button-hover-bg": ["--color-hover"],
  "--control-button-active-bg": ["--color-selecionado"],
  "--control-button-danger-text": ["--color-danger"],
  "--control-button-danger-hover-bg": ["--color-danger-fundo"],

  "--interactive-muted": ["--color-ink-faint"],
  "--interactive-active": ["--color-ink"],

  "--accent-info": ["--color-link"],
  "--accent-purple": ["--color-everyone"],
  "--status-warning": ["--color-idle"],

  "--alert-note-color": ["--color-link"],
  "--alert-tip-color": ["--color-online"],
  "--alert-important-color": ["--color-everyone"],
  "--alert-warning-color": ["--color-aviso"],
  "--alert-caution-color": ["--color-danger"],

  "--button-ghost-text": ["--color-ink-muted"],
  "--button-secondary-text": ["--color-ink"],
  "--button-primary-active-fill": ["--color-brand-hover"],
  "--button-primary-fill": ["--color-brand"],
  "--brand-primary-fill": ["--color-sobre-marca"],
  "--button-primary-text": ["--color-sobre-marca"],
  "--button-danger-active-fill": ["--color-danger"],
  "--button-danger-fill": ["--color-danger", "--color-dnd"],
  "--button-danger-text": ["--color-sobre-marca"],
  "--text-on-brand-primary": ["--color-sobre-marca"],

  "--background-secondary": ["--color-surface-1"],
  "--markup-mention-text": ["--color-mencao"],

  "--message-mention-color": ["--color-destaque"],
  "--message-mention-bg": ["--color-destaque-fundo"],

  "--composer-surface-color": ["--color-composer"],

  "--background-secondary-lighter": ["--color-surface-2", "--color-composer"],
  "--background-secondary-alt": ["--color-painel"],
  "--background-primary": ["--color-surface-0"],
  "--background-tertiary": ["--color-surface-3"],
  "--background-channel-header": ["--color-cabecalho"],
  "--background-header-primary": ["--color-cabecalho"],
  "--form-surface-background": ["--color-surface-4"],
  "--background-textarea": ["--color-campo"],
  "--background-modifier-selected": ["--color-selecionado"],
  "--background-modifier-hover": ["--color-hover"],
  "--background-modifier-accent": ["--color-divisor"],
  "--background-header-secondary": ["--color-line"],
  "--border-color": ["--color-line"],
  "--border-color-focus": ["--color-campo-foco"],

  "--text-primary": ["--color-ink"],
  "--text-chat": ["--color-ink"],
  "--text-secondary": ["--color-ink-muted"],
  "--text-primary-muted": ["--color-ink-muted"],
  "--text-tertiary": ["--color-ink-faint"],
  "--text-link": ["--color-link", "--color-mencao"],
  "--text-warning": ["--color-aviso"],

  "--brand-primary": ["--color-brand"],
  "--brand-secondary": ["--color-brand-hover"],
  "--accent-primary": ["--color-brand"],
  "--accent-danger": ["--color-danger"],
  "--accent-success": ["--color-online"],
  "--accent-warning": ["--color-idle", "--color-aviso"],
  "--status-danger": ["--color-danger"],
  "--status-online": ["--color-online"],
  "--status-idle": ["--color-idle"],
  "--status-dnd": ["--color-dnd"],

  "--brand-primary-light": ["--color-brand-hover"],
  "--surface-interactive-hover-bg": ["--color-hover"],
  "--settings-hover-background": ["--color-hover"],
  "--surface-interactive-selected-bg": ["--color-selecionado"],
  "--surface-interactive-selected-color": ["--color-ink"],
  "--text-tertiary-muted": ["--color-ink-faint"],
  "--text-chat-muted": ["--color-ink-muted"],
  "--voice-text-strong": ["--color-ink"],
  "--user-area-divider-color": ["--color-divisor"],
  "--settings-border-color": ["--color-line"],
  "--settings-surface-background": ["--color-surface-2"],
  "--background-modifier-accent-focus": ["--color-campo-foco"],

  "--guild-list-foreground": ["--color-surface-3"],
  "--focus-primary": ["--color-foco-anel"],

  "--code-block-bg": ["--color-codigo-bloco"],
  "--code-inline-bg": ["--color-codigo"],
  "--scrollbar-thumb-bg": ["--color-trilho"],
  "--scrollbar-thumb-bg-hover": ["--color-trilho"],
  "--scrollbar-track-bg": ["--scrollbar-track-bg"],
  "--font-primary": ["--font-sans"],
  "--font-display": ["--font-display"],
  "--font-mono": ["--font-mono"],
};

export const ORIGIN_NAMES = Object.keys(THEME_BRIDGE);

export function translateTheme(
  read: Record<string, string>,
  untouchable: ReadonlySet<string> = new Set(),
): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [origin, destinations] of Object.entries(THEME_BRIDGE)) {
    const value = read[origin]?.trim();
    if (!value) continue;

    for (const destination of destinations) {
      if (!untouchable.has(destination)) output[destination] = value;
    }
  }

  return output;
}

export function namesDeclaredTheme(css: string): Set<string> {
  const matches = new Set<string>();

  for (const declaration of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
    if (declaration[1]) matches.add(declaration[1]);
  }

  return matches;
}
