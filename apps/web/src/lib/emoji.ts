export interface EmojiUnicode {
  emoji: string;
  name: string;
  slug: string;
}

export interface GrupoDeEmoji {
  slug: string;
  titulo: string;
  emojis: EmojiUnicode[];
}

const TITULOS: Record<string, string> = {
  smileys_emotion: "Carinhas e emoções",
  people_body: "Pessoas",
  animals_nature: "Animais e natureza",
  food_drink: "Comida e bebida",
  travel_places: "Viagem e lugares",
  activities: "Atividades",
  objects: "Objetos",
  symbols: "Símbolos",
  flags: "Bandeiras",
};

const APELIDOS: Record<string, string[]> = {
  grinning_face: ["sorriso", "feliz"],
  face_with_tears_of_joy: ["risada", "chorando de rir", "kkk"],
  rolling_on_the_floor_laughing: ["rolando de rir", "kkk", "risada"],
  smiling_face_with_heart_eyes: ["apaixonado", "amor", "coracao"],
  thinking_face: ["pensando", "duvida"],
  face_with_rolling_eyes: ["revirando os olhos", "afe"],
  crying_face: ["chorando", "triste"],
  loudly_crying_face: ["chorando muito", "triste"],
  pleading_face: ["pidao", "por favor"],
  fire: ["fogo", "chama", "top"],
  red_heart: ["coracao", "amor"],
  thumbs_up: ["joia", "positivo", "curti", "ok"],
  thumbs_down: ["negativo", "nao curti"],
  clapping_hands: ["palmas", "aplauso"],
  folded_hands: ["obrigado", "reza", "por favor"],
  party_popper: ["festa", "comemora"],
  rocket: ["foguete", "subiu", "rapido"],
  skull: ["caveira", "morri", "kkk"],
  eyes: ["olhos", "olha isso"],
  brazil: ["brasil", "bandeira"],
  pizza: ["pizza", "comida"],
  beer_mug: ["cerveja", "breja"],
  soccer_ball: ["futebol", "bola"],
  video_game: ["jogo", "game", "videogame"],
  check_mark_button: ["certo", "ok", "feito"],
  cross_mark: ["errado", "nao", "x"],
  warning: ["aviso", "atencao", "cuidado"],
  money_bag: ["dinheiro", "grana", "pix"],
};

let catalogo: Promise<GrupoDeEmoji[]> | null = null;

export function carregarEmojis(): Promise<GrupoDeEmoji[]> {
  catalogo ??= import("unicode-emoji-json/data-by-group.json").then((mod) => {
    const dados = (mod.default ?? mod) as { slug: string; emojis: EmojiUnicode[] }[];

    return dados.map((grupo) => ({
      slug: grupo.slug,
      titulo: TITULOS[grupo.slug] ?? grupo.slug,
      emojis: grupo.emojis.map((e) => ({ emoji: e.emoji, name: e.name, slug: e.slug })),
    }));
  });

  return catalogo;
}

export function combina(emoji: EmojiUnicode, termo: string) {
  const alvo = termo.toLowerCase().trim();
  if (!alvo) return true;

  if (emoji.name.includes(alvo) || emoji.slug.includes(alvo.replace(/\s+/g, "_"))) return true;
  return (APELIDOS[emoji.slug] ?? []).some((apelido) => apelido.includes(alvo));
}

const CHAVE_RECENTES = "gravae:emojis-recentes";

export function emojisRecentes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function registrarUso(emoji: string) {
  try {
    const atual = emojisRecentes().filter((e) => e !== emoji);
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify([emoji, ...atual].slice(0, 36)));
  } catch {
  }
}
