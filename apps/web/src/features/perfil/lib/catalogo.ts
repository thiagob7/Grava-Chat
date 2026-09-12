import {
  DECORATIONS,
  NAME_EFFECTS,
  PROFILE_EFFECTS,
  ROLE_STYLES,
  NAME_FONTS,
  FRAMES,
  RANKS,
  PLATES,
  type Decoration,
  type NameEffect,
  type ProfileEffect,
  type RoleStyle,
  type NameFont,
  type Frame,
  type Rank,
  type Plate,
} from "@gravae/shared";

export interface Choice<T extends string> {
  id: T;
  label: string;
  description?: string;
}

function catalog<T extends string>(
  ids: readonly T[],
  labels: Record<T, string | [string, string]>,
): Choice<T>[] {
  return ids.map((id) => {
    const entry = labels[id];
    const [label, description] = Array.isArray(entry) ? entry : [entry, undefined];

    return { id, label, description };
  });
}

export const FONTS: Choice<NameFont>[] = catalog(NAME_FONTS, {
  padrao: ["Padrão", "a mesma fonte do resto do app"],
  serifada: "Serifada",
  monoespacada: "Monoespaçada",
  titulo: "Título",
  manuscrita: "Manuscrita",
});

export const NAME_EFFECT_OPTIONS: Choice<NameEffect>[] = catalog(NAME_EFFECTS, {
  solido: ["Nenhum", "cor chapada"],
  gradiente: ["Gradiente", "duas cores; some em texto pequeno"],
  neon: "Neon",
  brilho: ["Brilho", "um lampejo que atravessa o nome"],
});

export const AVATAR_DECORATIONS: Choice<Decoration>[] = catalog(DECORATIONS, {
  nenhuma: "Nenhuma",
  alada: ["Moldura alada", "animada — asas e estrela"],
  gelo: ["Anel de gelo", "animada — neve acumulada e cristais"],
  coroa: ["Coroa dourada", "imagem — gemas piscando e lampejo girando"],
  runas: ["Anel rúnico", "imagem — glifos acendendo em pedra"],
  loureiro: ["Coroa de louros", "imagem — ramos com balanço leve"],
  capivara: ["Capivara", "bicho — dorme na cabeça e respira"],
  gato: ["Gato", "bicho — enrodilhado, com o rabo batendo"],
  tucano: ["Tucano", "bicho — pousa na borda e vira o bico"],
  sapo: ["Sapo", "bicho — pisca e dá um pulinho"],
  "beija-flor": ["Beija-flor", "bicho — para no ar batendo as asas"],
  arara: ["Arara", "bicho — inclina a cabeça e balança a cauda"],
  preguica: ["Preguiça", "bicho — pendura no galho e balança devagar"],
  coruja: ["Coruja", "bicho — vira a cabeça e pisca"],
  borboleta: ["Borboleta", "bicho — abre e fecha as asas"],
  cachorro: ["Cachorro", "bicho — abana o rabo e sacode a orelha"],
});

export const AVATAR_FRAMES: Choice<Frame>[] = catalog(FRAMES, {
  nenhuma: "Nenhuma",
  neon: "Neon",
  dourada: "Dourada",
  vidro: "Vidro",
  pixel: "Pixel",
  espinhos: "Espinhos",
  prisma: ["Prisma", "arco-íris varrendo a borda"],
  estelar: ["Estelar", "céu profundo com estrelas"],
  filete: ["Filete", "dois fios finos, sem brilho nem movimento"],
  rosas: ["Filigrana de rosas", "desenhada — ornamento nos cantos"],
  arabesco: ["Arabesco", "desenhada — volutas de ferro dourado"],
  grega: ["Grega", "desenhada — meandro geométrico, sóbria"],
  espinheiro: ["Espinheiro", "desenhada — ramo de espinhos"],
});

export const PROFILE_EFFECT_OPTIONS: Choice<ProfileEffect>[] = catalog(PROFILE_EFFECTS, {
  nenhum: "Nenhum",
  poeira: "Poeira",
  chuva: "Chuva",
  brasas: "Brasas",
  bolhas: "Bolhas",
});

export const PROFILE_PLATES: Choice<Plate>[] = catalog(PLATES, {
  nenhuma: "Nenhuma",
  fita: "Fita",
  holograma: "Holograma",
  carimbo: "Carimbo",
  cristal: "Cristal",
});

export const PROFILE_RANKS: Choice<Rank>[] = catalog(RANKS, {
  nenhuma: "Nenhuma",
  orbe: ["Orbe alado", "monta uma vez quando o cartão abre"],
});

export const ROLE_STYLE_OPTIONS: Choice<RoleStyle>[] = catalog(ROLE_STYLES, {
  solido: ["Sólido", "uma cor só"],
  gradiente: ["Gradiente", "usa a segunda cor"],
  holografico: "Holográfico",
});

export const EMPTY = new Set<string>(["nenhum", "nenhuma", "solido", "padrao"]);

export const FAMILIES_OFF = new Set<string>(["moldura", "perfil", "placa"]);
