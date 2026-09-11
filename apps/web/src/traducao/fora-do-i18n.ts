import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const CODE =
  /[;=]|=>|&&|\|\||\?\.|\) :|: \(|\b(const|let|return|React|useState|useRef|useMemo|useEffect|interface|typeof|keyof|null|undefined|void|Promise|Partial|Record|string|number|boolean)\b/;

const CLASS =
  /(^|\s)(flex|grid|absolute|relative|block|inline|hidden|truncate|shrink|grow|group|sticky|fixed|w-|h-|p[xytblr]?-|m[xytblr]?-|text-|bg-|border|rounded|gap-|min-|max-|overflow|items-|justify-|font-|leading-|tracking-|z-|top-|left-|right-|bottom-|inset-|transition|animate-|cursor-|opacity-|space-|divide-|ring-|shadow-|backdrop-)/;

const PATH = /^[~.@]?\//;

const ACCENT = /[ãõáéíóúâêôçàÁÉÍÓÚÂÊÔÃÕÇ]/;

const WORDS =
  /\b(a|o|as|os|um|uma|de|do|da|dos|das|em|no|na|nos|nas|para|pra|por|com|sem|que|quem|se|seu|sua|você|voce|não|nao|mais|já|ja|ou|e|é|ao|à|aqui|isso|este|esta|esse|essa|todo|toda|tudo|nada|quando|onde|como|só|so|até|ate|depois|antes|entre|sobre|pelo|pela|nem|mas|ainda|cada|outro|outra|muito|pouco|também|tambem)\b/i;

const ATTRIBUTES =
  /\b(aria-label|placeholder|title|label|titulo|descricao|rotulo|detalhe|texto|mensagem|dica|alt|legenda|subtitulo|acao|vazio|nome)=\{?"([^"]{3,})"/g;

const TEXT_JSX = />([^<>{}]*?[A-Za-zÀ-ÿ][^<>{}]*?)</g;

const CALLS =
  /\b(?:toast\.(?:success|error|info|warning|message|loading)|confirm|alert)\(\s*"([^"]{4,})"/g;

const FIELDS =
  /\b(?:title|description|action|cancel|label|titulo|descricao|texto|mensagem|nome|rotulo|dica|detalhe):\s*"([^"]{3,})"/g;

const ANY = /"([^"\n]{3,})"/g;

const NOISE = [/data-gc="[^"]*"/g, /className=\{?"[^"]*"/g, /flx\("[^"]*"/g];

function isText(raw: string, jsx = false): boolean {
  const text = raw.trim();

  if (text.length < 3) return false;
  if (!/[a-zà-ÿ]{2}/i.test(text)) return false;
  if (jsx && CODE.test(text)) return false;
  if (jsx && /^[,;:]|[,:]$/.test(text)) return false;
  if (CLASS.test(text) || PATH.test(text)) return false;
  if (jsx && /^[A-Za-zÀ-ÿ]{3,}$/.test(text)) return true;
  if (/^[A-Za-z0-9_.\-/]+$/.test(text)) return false;

  return ACCENT.test(text) || WORDS.test(text) || /\s/.test(text);
}

function isPortuguese(text: string): boolean {
  if (ACCENT.test(text)) return true;

  return [...text.matchAll(new RegExp(WORDS, "gi"))].length >= 2;
}

function files(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((item) => {
    const path = join(folder, item.name);

    if (item.isDirectory())
      return item.name === "traducao" ? [] : files(path);

    return /\.tsx?$/.test(item.name) && !/\.test\./.test(item.name)
      ? [path]
      : [];
  });
}

export interface TextLoose {
  file: string;
  text: string;
}

export function i18nTextsOutside(root: string): TextLoose[] {
  const matches = new Map<string, TextLoose>();

  for (const path of files(root)) {
    const file = relative(root, path).split(sep).join("/");

    let font = readFileSync(path, "utf8");
    for (const noise of NOISE)
      font = font.replace(noise, (match) => " ".repeat(match.length));

    const keep = (raw: string) => {
      const text = raw.trim().replace(/\s+/g, " ");
      matches.set(`${file}|${text}`, { file, text });
    };

    for (const m of font.matchAll(ATTRIBUTES)) if (isText(m[2]!)) keep(m[2]!);
    for (const m of font.matchAll(CALLS)) if (isText(m[1]!)) keep(m[1]!);
    for (const m of font.matchAll(FIELDS)) if (isText(m[1]!)) keep(m[1]!);

    if (path.endsWith(".tsx"))
      for (const m of font.matchAll(TEXT_JSX))
        if (isText(m[1]!, true)) keep(m[1]!);

    for (const m of font.matchAll(ANY))
      if (isText(m[1]!, true) && isPortuguese(m[1]!)) keep(m[1]!);
  }

  return [...matches.values()].sort((a, b) =>
    a.file === b.file
      ? a.text.localeCompare(b.text)
      : a.file.localeCompare(b.file),
  );
}
