/**
 * Permissões do servidor.
 *
 * Guardadas como LISTA DE NOMES, não como bitfield. O Discord usa bitfield
 * porque transmite bilhões de eventos por dia; aqui isso só tornaria o banco
 * ilegível e traria BigInt para dentro de tudo (número em JS quebra acima de
 * 2³¹). Com nomes, dá para abrir o Mongo e entender o que um cargo pode.
 */
export const PERMISSIONS = [
  // servidor
  "ADMINISTRATOR",
  "MANAGE_GUILD",
  "MANAGE_ROLES",
  "MANAGE_CHANNELS",
  "MANAGE_WEBHOOKS",
  "MANAGE_EXPRESSIONS",
  "CREATE_INVITE",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MODERATE_MEMBERS",
  "MANAGE_NICKNAMES",
  "VIEW_AUDIT_LOG",
  // texto
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "MANAGE_MESSAGES",
  "ATTACH_FILES",
  "ADD_REACTIONS",
  "MENTION_EVERYONE",
  // voz
  "CONNECT",
  "SPEAK",
  "VIDEO",
  "SHARE_SCREEN",
  "MUTE_MEMBERS",
  "DEAFEN_MEMBERS",
  "MOVE_MEMBERS",
  "USE_SOUNDBOARD",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Agrupamento usado na tela de edição de cargo. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Geral do servidor",
    permissions: [
      "ADMINISTRATOR",
      "MANAGE_GUILD",
      "MANAGE_ROLES",
      "MANAGE_CHANNELS",
      "MANAGE_WEBHOOKS",
      "MANAGE_EXPRESSIONS",
      "CREATE_INVITE",
      "VIEW_AUDIT_LOG",
    ],
  },
  {
    label: "Moderação",
    permissions: ["KICK_MEMBERS", "BAN_MEMBERS", "MODERATE_MEMBERS", "MANAGE_NICKNAMES"],
  },
  {
    label: "Canais de texto",
    permissions: [
      "VIEW_CHANNEL",
      "SEND_MESSAGES",
      "MANAGE_MESSAGES",
      "ATTACH_FILES",
      "ADD_REACTIONS",
      "MENTION_EVERYONE",
    ],
  },
  {
    label: "Canais de voz",
    permissions: [
      "CONNECT",
      "SPEAK",
      "VIDEO",
      "SHARE_SCREEN",
      "USE_SOUNDBOARD",
      "MUTE_MEMBERS",
      "DEAFEN_MEMBERS",
      "MOVE_MEMBERS",
    ],
  },
];

export const PERMISSION_LABELS: Record<Permission, { nome: string; descricao: string }> = {
  ADMINISTRATOR: {
    nome: "Administrador",
    descricao: "Concede TODAS as permissões e ignora restrições de canal. Dê com cuidado.",
  },
  MANAGE_GUILD: { nome: "Gerenciar servidor", descricao: "Mudar nome, ícone e descrição." },
  MANAGE_ROLES: {
    nome: "Gerenciar cargos",
    descricao: "Criar e editar cargos abaixo do seu mais alto, e atribuí-los.",
  },
  MANAGE_CHANNELS: { nome: "Gerenciar canais", descricao: "Criar, editar e apagar canais." },
  MANAGE_WEBHOOKS: { nome: "Gerenciar webhooks", descricao: "Criar e apagar integrações." },
  MANAGE_EXPRESSIONS: {
    nome: "Gerenciar expressões",
    descricao: "Subir e apagar emojis, figurinhas e efeitos sonoros do servidor.",
  },
  VIEW_AUDIT_LOG: {
    nome: "Ver registro de auditoria",
    descricao: "Ver quem fez o quê no servidor.",
  },
  CREATE_INVITE: { nome: "Criar convite", descricao: "Gerar links para convidar pessoas." },
  KICK_MEMBERS: { nome: "Expulsar membros", descricao: "Remover quem está abaixo de você." },
  BAN_MEMBERS: {
    nome: "Banir membros",
    descricao: "Remover e impedir de voltar, mesmo com convite novo.",
  },
  MODERATE_MEMBERS: {
    nome: "Castigar membros",
    descricao: "Deixar alguém sem escrever nem falar por um tempo.",
  },
  MANAGE_NICKNAMES: { nome: "Gerenciar apelidos", descricao: "Mudar o apelido de outras pessoas." },

  VIEW_CHANNEL: { nome: "Ver canal", descricao: "Ver o canal e ler o histórico." },
  SEND_MESSAGES: { nome: "Enviar mensagens", descricao: "Escrever nos canais de texto." },
  MANAGE_MESSAGES: { nome: "Gerenciar mensagens", descricao: "Apagar mensagens de outras pessoas." },
  ATTACH_FILES: { nome: "Anexar arquivos", descricao: "Enviar imagens e arquivos." },
  ADD_REACTIONS: { nome: "Adicionar reações", descricao: "Reagir às mensagens." },
  MENTION_EVERYONE: { nome: "Mencionar @everyone", descricao: "Notificar o servidor inteiro." },

  CONNECT: { nome: "Conectar", descricao: "Entrar em canais de voz." },
  SPEAK: { nome: "Falar", descricao: "Transmitir áudio na chamada." },
  VIDEO: { nome: "Câmera", descricao: "Ligar a webcam na chamada." },
  SHARE_SCREEN: { nome: "Compartilhar tela", descricao: "Transmitir a tela na chamada." },
  USE_SOUNDBOARD: {
    nome: "Usar efeitos sonoros",
    descricao: "Tocar os sons do painel na chamada.",
  },
  MUTE_MEMBERS: { nome: "Silenciar membros", descricao: "Mutar outras pessoas na chamada." },
  DEAFEN_MEMBERS: {
    nome: "Ensurdecer membros",
    descricao: "Tirar o áudio da chamada de outra pessoa.",
  },
  MOVE_MEMBERS: {
    nome: "Mover membros",
    descricao: "Puxar alguém para outro canal de voz, ou desconectar.",
  },
};

/** O que o @everyone recebe num servidor novo: conversar e entrar em call. */
export const DEFAULT_EVERYONE_PERMISSIONS: Permission[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "ATTACH_FILES",
  "ADD_REACTIONS",
  "CREATE_INVITE",
  "CONNECT",
  "SPEAK",
  "VIDEO",
  "SHARE_SCREEN",
];

export interface RoleLike {
  id: string;
  position: number;
  permissions: string[];
  isEveryone: boolean;
}

export type OverwriteTarget = "ROLE" | "MEMBER";

export interface OverwriteLike {
  targetId: string;
  type: OverwriteTarget;
  allow: string[];
  deny: string[];
}

const asPermissions = (lista: string[]) => lista.filter(ehPermissao);
const ehPermissao = (valor: string): valor is Permission =>
  (PERMISSIONS as readonly string[]).includes(valor);

/**
 * Permissões efetivas de alguém, opcionalmente dentro de um canal.
 *
 * Mesma ordem de precedência do Discord — a ordem importa: o overwrite da
 * pessoa vence o do cargo, que vence o do @everyone.
 *
 *   dono do servidor              → tudo
 *   @everyone + cargos            → base
 *   base tem ADMINISTRATOR        → tudo
 *   overwrite do @everyone        → base &= ~deny; base |= allow
 *   overwrites dos cargos (juntos) → base &= ~deny; base |= allow
 *   overwrite da pessoa           → base &= ~deny; base |= allow
 */
export function computePermissions(params: {
  userId: string;
  isOwner: boolean;
  roles: RoleLike[];
  /** overwrites do canal; omitir para as permissões no nível do servidor */
  overwrites?: OverwriteLike[];
}): Set<Permission> {
  if (params.isOwner) return new Set(PERMISSIONS);

  const base = new Set<Permission>();
  for (const role of params.roles) {
    for (const permissao of asPermissions(role.permissions)) base.add(permissao);
  }

  // Administrador ignora inclusive as restrições por canal — é o atalho que
  // impede alguém de se trancar fora do próprio servidor.
  if (base.has("ADMINISTRATOR")) return new Set(PERMISSIONS);

  const overwrites = params.overwrites;
  if (!overwrites?.length) return base;

  const idsDosCargos = new Set(params.roles.map((r) => r.id));
  const everyoneId = params.roles.find((r) => r.isEveryone)?.id;

  const aplicar = (allow: string[], deny: string[]) => {
    for (const permissao of asPermissions(deny)) base.delete(permissao);
    for (const permissao of asPermissions(allow)) base.add(permissao);
  };

  const doEveryone = overwrites.find((o) => o.type === "ROLE" && o.targetId === everyoneId);
  if (doEveryone) aplicar(doEveryone.allow, doEveryone.deny);

  /**
   * Os overwrites de cargo são acumulados ANTES de aplicar: se um cargo nega e
   * outro permite, o permitir vence. Aplicar um a um faria o resultado depender
   * da ordem em que vieram do banco.
   */
  const dosCargos = overwrites.filter(
    (o) => o.type === "ROLE" && o.targetId !== everyoneId && idsDosCargos.has(o.targetId),
  );

  if (dosCargos.length) {
    aplicar(
      dosCargos.flatMap((o) => o.allow),
      dosCargos.flatMap((o) => o.deny),
    );
  }

  const daPessoa = overwrites.find((o) => o.type === "MEMBER" && o.targetId === params.userId);
  if (daPessoa) aplicar(daPessoa.allow, daPessoa.deny);

  return base;
}

export const has = (permissoes: Set<Permission>, permissao: Permission) =>
  permissoes.has("ADMINISTRATOR") || permissoes.has(permissao);

/**
 * O cargo mais alto de alguém. É o que limita o que a pessoa pode fazer com
 * cargos e com outras pessoas — sem isso, quem tem "gerenciar cargos" se
 * promoveria a administrador em dois cliques.
 */
export const highestPosition = (roles: RoleLike[]) =>
  roles.reduce((maior, role) => Math.max(maior, role.position), -1);
