export interface EmojiUnicode {
  emoji: string;
  name: string;
  slug: string;
}

export interface EmojiGroup {
  slug: string;
  title: string;
  emojis: EmojiUnicode[];
}

const TITLES: Record<string, string> = {
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

const NICKNAMES: Record<string, string[]> = {
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
  warning: ["notice", "atencao", "cuidado"],
  money_bag: ["dinheiro", "grana", "pix"],
  smiling_face_with_smiling_eyes: ["sorriso", "fofo", "feliz"],
  beaming_face_with_smiling_eyes: ["sorrisao", "feliz"],
  winking_face: ["piscada", "piscando"],
  face_blowing_a_kiss: ["beijo", "beijinho"],
  smiling_face_with_hearts: ["apaixonado", "amor", "coracao"],
  star_struck: ["estrelas", "uau", "incrivel"],
  partying_face: ["festa", "comemorando"],
  smiling_face_with_sunglasses: ["oculos", "estiloso", "de boa"],
  nerd_face: ["nerd", "oculos", "estudioso"],
  face_with_raised_eyebrow: ["desconfiado", "duvida"],
  zipper_mouth_face: ["calado", "boca fechada", "segredo"],
  face_with_hand_over_mouth: ["ops", "risada", "vergonha"],
  shushing_face: ["silencio", "psiu", "segredo"],
  sleeping_face: ["dormindo", "sono"],
  face_with_thermometer: ["doente", "febre"],
  nauseated_face: ["enjoado", "nojo"],
  exploding_head: ["explodindo", "mente", "uau"],
  cowboy_hat_face: ["cowboy", "chapeu"],
  clown_face: ["palhaco", "piada"],
  smiling_face_with_horns: ["diabo", "safado"],
  ghost: ["fantasma", "assombracao"],
  alien: ["alien", "et"],
  robot: ["robo", "bot"],
  pile_of_poo: ["coco", "merda", "ruim"],
  angry_face: ["bravo", "raiva"],
  pouting_face: ["furioso", "raiva"],
  face_screaming_in_fear: ["gritando", "medo", "susto"],
  fearful_face: ["medo", "assustado"],
  disappointed_face: ["decepcionado", "triste"],
  weary_face: ["cansado", "exausto"],
  face_with_symbols_on_mouth: ["xingando", "palavrao"],
  smiling_face_with_halo: ["anjo", "santo"],
  hugging_face: ["abraco", "carinho"],
  face_with_monocle: ["analisando", "monoculo"],
  waving_hand: ["tchau", "oi", "aceno"],
  raised_hand: ["mao", "pare", "oi"],
  ok_hand: ["ok", "beleza", "joia"],
  victory_hand: ["paz", "vitoria", "dois"],
  crossed_fingers: ["torcendo", "dedos cruzados", "sorte"],
  love_you_gesture: ["te amo", "amor"],
  call_me_hand: ["me liga", "shaka"],
  index_pointing_up: ["apontando", "atencao"],
  raising_hands: ["maos ao alto", "aleluia", "comemorando"],
  handshake: ["aperto de mao", "acordo", "combinado"],
  writing_hand: ["escrevendo", "anotando"],
  flexed_biceps: ["forca", "musculo", "bombado"],
  brain: ["cerebro", "ideia", "inteligente"],
  person_shrugging: ["sei la", "ombros", "nao sei"],
  person_facepalming: ["facepalm", "vergonha alheia"],
  person_running: ["correndo", "fugindo"],
  person_raising_hand: ["levantando a mao", "pergunta"],
  dog_face: ["cachorro", "dog", "cao"],
  cat_face: ["gato", "gatinho"],
  monkey_face: ["macaco"],
  unicorn: ["unicornio"],
  butterfly: ["borboleta"],
  four_leaf_clover: ["trevo", "sorte"],
  sun: ["sol", "calor"],
  cloud: ["nuvem", "nublado"],
  cloud_with_rain: ["chuva", "chovendo"],
  snowflake: ["neve", "frio"],
  high_voltage: ["raio", "energia", "rapido"],
  droplet: ["gota", "agua"],
  hamburger: ["hamburguer", "lanche"],
  french_fries: ["batata frita", "fritas"],
  hot_dog: ["cachorro quente", "dogao"],
  taco: ["taco"],
  popcorn: ["pipoca", "filme"],
  birthday_cake: ["bolo", "aniversario", "parabens"],
  cookie: ["biscoito", "bolacha"],
  doughnut: ["rosquinha", "donut"],
  hot_beverage: ["cafe", "cafezinho"],
  wine_glass: ["vinho", "taca"],
  clinking_beer_mugs: ["brinde", "cerveja", "saude"],
  tropical_drink: ["drink", "praia", "ferias"],
  bomb: ["bomba", "explosao"],
  trophy: ["trofeu", "vitoria", "campeao"],
  sports_medal: ["medalha", "premio"],
  first_place_medal: ["ouro", "primeiro", "medalha"],
  game_die: ["dado", "sorte", "jogo"],
  musical_note: ["musica", "nota"],
  headphone: ["fone", "musica"],
  microphone: ["microfone", "cantar", "podcast"],
  camera: ["camera", "foto"],
  film_frames: ["filme", "cinema"],
  laptop: ["notebook", "computador", "pc"],
  desktop_computer: ["computador", "pc", "monitor"],
  mobile_phone: ["celular", "telefone"],
  television: ["tv", "televisao"],
  light_bulb: ["ideia", "lampada"],
  gear: ["engrenagem", "configuracao", "ajuste"],
  wrench: ["chave inglesa", "conserto", "ferramenta"],
  hammer: ["martelo", "conserto"],
  lock: ["cadeado", "trancado", "seguranca"],
  key: ["key"],
  magnifying_glass_tilted_left: ["lupa", "buscar", "procurar"],
  bell: ["sino", "notice", "notificacao"],
  bell_with_slash: ["silenciado", "sem aviso"],
  books: ["livros", "estudo"],
  memo: ["nota", "anotacao", "escrever"],
  calendar: ["calendario", "data"],
  pushpin: ["fixar", "alfinete"],
  paperclip: ["anexo", "clipe"],
  chart_increasing: ["grafico", "subindo", "crescimento"],
  chart_decreasing: ["grafico", "caindo", "queda"],
  credit_card: ["cartao", "pagamento"],
  gem_stone: ["diamante", "joia", "raro"],
  crown: ["coroa", "rei", "dono"],
  gift: ["presente", "surpresa"],
  balloon: ["balloon", "festa"],
  confetti_ball: ["confete", "festa", "comemora"],
  airplane: ["aviao", "viagem"],
  car: ["carro"],
  bicycle: ["bicicleta", "bike"],
  house: ["casa"],
  office_building: ["predio", "escritorio"],
  hospital: ["hospital"],
  school: ["escola"],
  world_map: ["mapa", "mundo"],
  globe_showing_americas: ["mundo", "globo", "planeta"],
  stopwatch: ["cronometro", "tempo"],
  alarm_clock: ["despertador", "alarme", "hora"],
  hourglass_done: ["ampulheta", "esperando", "tempo"],
  wastebasket: ["lixo", "apagar", "excluir"],
  broom: ["vassoura", "limpar"],
  package: ["pacote", "caixa", "entrega"],
  envelope: ["envelope", "email", "carta"],
  speech_balloon: ["balao de fala", "conversa", "mensagem"],
  thought_balloon: ["pensamento", "ideia"],
  hundred_points: ["cem", "nota dez", "perfeito"],
  sparkles: ["brilho", "novo", "magia"],
  star: ["estrela", "favorito"],
  glowing_star: ["estrela", "brilhando"],
  collision: ["explosao", "impacto"],
  anger_symbol: ["raiva", "irritado"],
  zzz: ["dormindo", "sono", "tedio"],
  inEntry: ["proibido", "bloqueado"],
  prohibited: ["proibido", "nao pode"],
  white_heavy_check_mark: ["certo", "feito", "ok"],
  recycling_symbol: ["reciclar", "reuso"],
  question_mark: ["duvida", "pergunta", "interrogacao"],
  exclamation_mark: ["atencao", "exclamacao"],
  heart_on_fire: ["coracao", "paixao", "fogo"],
  broken_heart: ["coracao partido", "tristeza"],
  purple_heart: ["coracao roxo", "amor"],
  green_heart: ["coracao verde", "amor"],
  blue_heart: ["coracao azul", "amor"],
  yellow_heart: ["coracao amarelo", "amor"],
  black_heart: ["coracao preto", "luto"],
  rainbow: ["arco iris", "orgulho"],
  rainbow_flag: ["orgulho", "lgbt", "bandeira"],
  chequered_flag: ["bandeira quadriculada", "fim", "corrida"],
  triangular_flag: ["bandeira", "marcar"],
};

let catalog: Promise<EmojiGroup[]> | null = null;

export function loadEmojis(): Promise<EmojiGroup[]> {
  catalog ??= import("unicode-emoji-json/data-by-group.json").then((mod) => {
    const data = (mod.default ?? mod) as { slug: string; emojis: EmojiUnicode[] }[];

    return data.map((group) => ({
      slug: group.slug,
      title: TITLES[group.slug] ?? group.slug,
      emojis: group.emojis.map((e) => ({ emoji: e.emoji, name: e.name, slug: e.slug })),
    }));
  });

  return catalog;
}

const withoutAccent = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function matches(emoji: EmojiUnicode, term: string) {
  const words = withoutAccent(term).split(/\s+/).filter(Boolean);
  if (!words.length) return true;

  const targets = [
    withoutAccent(emoji.name),
    withoutAccent(emoji.slug).replace(/_/g, " "),
    ...(NICKNAMES[emoji.slug] ?? []).map(withoutAccent),
  ];

  return words.every((word) => targets.some((target) => target.includes(word)));
}

const RECENT_KEY = "gravae:emojis-recentes";

export function recentEmojis(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function registerUse(emoji: string) {
  try {
    const current = recentEmojis().filter((e) => e !== emoji);
    localStorage.setItem(RECENT_KEY, JSON.stringify([emoji, ...current].slice(0, 36)));
  } catch {
  }
}
