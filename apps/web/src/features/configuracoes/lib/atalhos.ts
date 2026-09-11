export type ShortcutArea = "navigation" | "messages" | "voice";

export interface Combo {
  key: string;
  command?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface Shortcut {
  id: string;
  area: ShortcutArea;
  name: string;
  detail: string;
  fallback: Combo;
  fixed?: boolean;
}

export const AREAS: { id: ShortcutArea; name: string; detail: string }[] = [
  {
    id: "navigation",
    name: "Navegação",
    detail: "Valem em qualquer lugar do app.",
  },
  {
    id: "messages",
    name: "Mensagens",
    detail: "Valem com o cursor na caixa de escrever.",
  },
  {
    id: "voice",
    name: "Voz",
    detail: "A tecla do push-to-talk mora em Áudio, junto do resto da voz.",
  },
];

export const SHORTCUTS: Shortcut[] = [
  {
    id: "servidor-novo",
    area: "navigation",
    name: "Criar servidor",
    detail: "Abre a janela de criar servidor de onde você estiver.",
    fallback: { key: "n", command: true, shift: true },
  },
  {
    id: "configuracoes",
    area: "navigation",
    name: "Abrir configurações",
    detail: "Abre esta janela na última tela que você viu.",
    fallback: { key: ",", command: true },
  },
  {
    id: "fechar",
    area: "navigation",
    name: "Fechar o que estiver aberto",
    detail: "Fecha a janela, o menu ou o painel da vez.",
    fallback: { key: "Escape" },
    fixed: true,
  },
  {
    id: "enviar",
    area: "messages",
    name: "Enviar a mensagem",
    detail: "Com o botão de enviar ligado, o clique faz o mesmo.",
    fallback: { key: "Enter" },
    fixed: true,
  },
  {
    id: "quebrar-linha",
    area: "messages",
    name: "Quebrar linha",
    detail: "Continua na mesma mensagem, numa linha nova.",
    fallback: { key: "Enter", shift: true },
    fixed: true,
  },
  {
    id: "expressoes",
    area: "messages",
    name: "Abrir emojis e figurinhas",
    detail: "Abre o seletor na aba de emoji, com a caixa em foco.",
    fallback: { key: "e", command: true },
  },
  {
    id: "editar-ultima",
    area: "messages",
    name: "Editar a última mensagem",
    detail: "Só funciona com a caixa vazia, e só pega mensagem sua.",
    fallback: { key: "ArrowUp" },
    fixed: true,
  },
];

const isMac = () =>
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.userAgent);

const NAMES: Record<string, string> = {
  Escape: "Esc",
  Enter: "Enter",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  " ": "Espaço",
};

export function writeCombo(combo: Combo): string {
  const mac = isMac();
  const parts: string[] = [];

  if (combo.command) parts.push(mac ? "⌘" : "Ctrl");
  if (combo.shift) parts.push(mac ? "⇧" : "Shift");
  if (combo.alt) parts.push(mac ? "⌥" : "Alt");

  parts.push(NAMES[combo.key] ?? combo.key.toUpperCase());

  return parts.join(mac ? "" : " + ");
}

export function eventCombo(event: KeyboardEvent): Combo | null {
  if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return null;

  return {
    key: event.key.length === 1 ? event.key.toLowerCase() : event.key,
    command: event.metaKey || event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

export function match(a: Combo, b: Combo): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    Boolean(a.command) === Boolean(b.command) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt)
  );
}

export function eventMatches(event: KeyboardEvent, combo: Combo): boolean {
  const fromEvent = eventCombo(event);

  return fromEvent ? match(fromEvent, combo) : false;
}
