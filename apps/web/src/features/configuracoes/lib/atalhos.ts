export type AreaDeAtalho = "navegacao" | "mensagens" | "voz";

export interface Combo {
  key: string;
  comando?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface Atalho {
  id: string;
  area: AreaDeAtalho;
  nome: string;
  detalhe: string;
  padrao: Combo;
  fixo?: boolean;
}

export const AREAS: { id: AreaDeAtalho; nome: string; detalhe: string }[] = [
  {
    id: "navegacao",
    nome: "Navegação",
    detalhe: "Valem em qualquer lugar do app.",
  },
  {
    id: "mensagens",
    nome: "Mensagens",
    detalhe: "Valem com o cursor na caixa de escrever.",
  },
  {
    id: "voz",
    nome: "Voz",
    detalhe: "A tecla do push-to-talk mora em Áudio, junto do resto da voz.",
  },
];

export const ATALHOS: Atalho[] = [
  {
    id: "servidor-novo",
    area: "navegacao",
    nome: "Criar servidor",
    detalhe: "Abre a janela de criar servidor de onde você estiver.",
    padrao: { key: "n", comando: true, shift: true },
  },
  {
    id: "configuracoes",
    area: "navegacao",
    nome: "Abrir configurações",
    detalhe: "Abre esta janela na última tela que você viu.",
    padrao: { key: ",", comando: true },
  },
  {
    id: "fechar",
    area: "navegacao",
    nome: "Fechar o que estiver aberto",
    detalhe: "Fecha a janela, o menu ou o painel da vez.",
    padrao: { key: "Escape" },
    fixo: true,
  },
  {
    id: "enviar",
    area: "mensagens",
    nome: "Enviar a mensagem",
    detalhe: "Com o botão de enviar ligado, o clique faz o mesmo.",
    padrao: { key: "Enter" },
    fixo: true,
  },
  {
    id: "quebrar-linha",
    area: "mensagens",
    nome: "Quebrar linha",
    detalhe: "Continua na mesma mensagem, numa linha nova.",
    padrao: { key: "Enter", shift: true },
    fixo: true,
  },
  {
    id: "editar-ultima",
    area: "mensagens",
    nome: "Editar a última mensagem",
    detalhe: "Só funciona com a caixa vazia, e só pega mensagem sua.",
    padrao: { key: "ArrowUp" },
    fixo: true,
  },
];

const ehMac = () =>
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.userAgent);

const NOMES: Record<string, string> = {
  Escape: "Esc",
  Enter: "Enter",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  " ": "Espaço",
};

export function escreverCombo(combo: Combo): string {
  const mac = ehMac();
  const partes: string[] = [];

  if (combo.comando) partes.push(mac ? "⌘" : "Ctrl");
  if (combo.shift) partes.push(mac ? "⇧" : "Shift");
  if (combo.alt) partes.push(mac ? "⌥" : "Alt");

  partes.push(NOMES[combo.key] ?? combo.key.toUpperCase());

  return partes.join(mac ? "" : " + ");
}

export function comboDoEvento(evento: KeyboardEvent): Combo | null {
  if (["Shift", "Control", "Alt", "Meta"].includes(evento.key)) return null;

  return {
    key: evento.key.length === 1 ? evento.key.toLowerCase() : evento.key,
    comando: evento.metaKey || evento.ctrlKey,
    shift: evento.shiftKey,
    alt: evento.altKey,
  };
}

export function combinam(a: Combo, b: Combo): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    Boolean(a.comando) === Boolean(b.comando) &&
    Boolean(a.shift) === Boolean(b.shift) &&
    Boolean(a.alt) === Boolean(b.alt)
  );
}

export function eventoCombina(evento: KeyboardEvent, combo: Combo): boolean {
  const doEvento = comboDoEvento(evento);

  return doEvento ? combinam(doEvento, combo) : false;
}
