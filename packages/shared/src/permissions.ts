export const PERMISSIONS = [
  "ADMINISTRATOR",
  "MANAGE_GUILD",
  "MANAGE_ROLES",
  "MANAGE_CHANNELS",
  "MANAGE_EVENTS",
  "MANAGE_WEBHOOKS",
  "MANAGE_EXPRESSIONS",
  "CREATE_EXPRESSIONS",
  "CREATE_INVITE",
  "KICK_MEMBERS",
  "BAN_MEMBERS",
  "MODERATE_MEMBERS",
  "MANAGE_NICKNAMES",
  "CHANGE_NICKNAME",
  "VIEW_AUDIT_LOG",
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "MANAGE_MESSAGES",
  "ATTACH_FILES",
  "ADD_REACTIONS",
  "MENTION_EVERYONE",
  "READ_MESSAGE_HISTORY",
  "PIN_MESSAGES",
  "BYPASS_SLOWMODE",
  "CREATE_POLLS",
  "CONNECT",
  "SPEAK",
  "VIDEO",
  "SHARE_SCREEN",
  "MUTE_MEMBERS",
  "DEAFEN_MEMBERS",
  "MOVE_MEMBERS",
  "USE_SOUNDBOARD",
  "USE_VAD",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Geral do servidor",
    permissions: [
      "ADMINISTRATOR",
      "MANAGE_GUILD",
      "MANAGE_ROLES",
      "MANAGE_CHANNELS",
      "MANAGE_EVENTS",
      "MANAGE_WEBHOOKS",
      "MANAGE_EXPRESSIONS",
      "CREATE_EXPRESSIONS",
      "CREATE_INVITE",
      "VIEW_AUDIT_LOG",
    ],
  },
  {
    label: "Moderação",
    permissions: [
      "KICK_MEMBERS",
      "BAN_MEMBERS",
      "MODERATE_MEMBERS",
      "MANAGE_NICKNAMES",
      "CHANGE_NICKNAME",
    ],
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
      "READ_MESSAGE_HISTORY",
      "PIN_MESSAGES",
      "BYPASS_SLOWMODE",
      "CREATE_POLLS",
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
      "USE_VAD",
      "MUTE_MEMBERS",
      "DEAFEN_MEMBERS",
      "MOVE_MEMBERS",
    ],
  },
];

export const PERMISSION_LABELS: Record<Permission, { name: string; description: string }> = {
  ADMINISTRATOR: {
    name: "Administrador",
    description: "Concede TODAS as permissões e ignora restrições de canal. Dê com cuidado.",
  },
  MANAGE_GUILD: { name: "Gerenciar servidor", description: "Mudar nome, ícone e descrição." },
  MANAGE_ROLES: {
    name: "Gerenciar cargos",
    description: "Criar e editar cargos abaixo do seu mais alto, e atribuí-los.",
  },
  MANAGE_CHANNELS: { name: "Gerenciar canais", description: "Criar, editar e apagar canais." },
  MANAGE_EVENTS: {
    name: "Gerenciar eventos",
    description: "Criar, editar e cancelar os eventos do servidor.",
  },
  MANAGE_WEBHOOKS: { name: "Gerenciar webhooks", description: "Criar e apagar integrações." },
  MANAGE_EXPRESSIONS: {
    name: "Gerenciar expressões",
    description: "Subir e apagar emojis, figurinhas e efeitos sonoros do servidor.",
  },
  VIEW_AUDIT_LOG: {
    name: "Ver registro de auditoria",
    description: "Ver quem fez o quê no servidor.",
  },
  CREATE_INVITE: { name: "Criar convite", description: "Gerar links para convidar pessoas." },
  KICK_MEMBERS: { name: "Expulsar membros", description: "Remover quem está abaixo de você." },
  BAN_MEMBERS: {
    name: "Banir membros",
    description: "Remover e impedir de voltar, mesmo com convite novo.",
  },
  MODERATE_MEMBERS: {
    name: "Castigar membros",
    description: "Deixar alguém sem escrever nem falar por um tempo.",
  },
  MANAGE_NICKNAMES: { name: "Gerenciar apelidos", description: "Mudar o apelido de outras pessoas." },
  CHANGE_NICKNAME: { name: "Alterar apelido", description: "Mudar o próprio apelido neste servidor." },
  CREATE_EXPRESSIONS: {
    name: "Criar expressões",
    description: "Subir emojis, figurinhas e sons — sem poder apagar os dos outros.",
  },

  VIEW_CHANNEL: { name: "Ver canal", description: "Ver o canal e ler o histórico." },
  SEND_MESSAGES: { name: "Enviar mensagens", description: "Escrever nos canais de texto." },
  MANAGE_MESSAGES: { name: "Gerenciar mensagens", description: "Apagar mensagens de outras pessoas." },
  ATTACH_FILES: { name: "Anexar arquivos", description: "Enviar imagens e arquivos." },
  ADD_REACTIONS: { name: "Adicionar reações", description: "Reagir às mensagens." },
  MENTION_EVERYONE: { name: "Mencionar @everyone", description: "Notificar o servidor inteiro." },
  READ_MESSAGE_HISTORY: {
    name: "Ver histórico de mensagens",
    description: "Ler o que foi dito antes de você abrir o canal.",
  },
  PIN_MESSAGES: { name: "Fixar mensagens", description: "Fixar e desafixar qualquer mensagem." },
  BYPASS_SLOWMODE: {
    name: "Ignorar modo lento",
    description: "Escrever sem esperar o intervalo do canal.",
  },
  CREATE_POLLS: { name: "Criar enquetes", description: "Publicar enquetes nos canais." },

  CONNECT: { name: "Conectar", description: "Entrar em canais de voz." },
  SPEAK: { name: "Falar", description: "Transmitir áudio na chamada." },
  VIDEO: { name: "Câmera", description: "Ligar a webcam na chamada." },
  SHARE_SCREEN: { name: "Compartilhar tela", description: "Transmitir a tela na chamada." },
  USE_SOUNDBOARD: {
    name: "Usar efeitos sonoros",
    description: "Tocar os sons do painel na chamada.",
  },
  MUTE_MEMBERS: { name: "Silenciar membros", description: "Mutar outras pessoas na chamada." },
  DEAFEN_MEMBERS: {
    name: "Ensurdecer membros",
    description: "Tirar o áudio da chamada de outra pessoa.",
  },
  MOVE_MEMBERS: {
    name: "Mover membros",
    description: "Puxar alguém para outro canal de voz, ou desconectar.",
  },
  USE_VAD: {
    name: "Usar detecção de voz",
    description: "Falar sem apertar tecla. Sem isto, só push-to-talk.",
  },
};

export const DEFAULT_EVERYONE_PERMISSIONS: Permission[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "ATTACH_FILES",
  "ADD_REACTIONS",
  "READ_MESSAGE_HISTORY",
  "CREATE_POLLS",
  "CHANGE_NICKNAME",
  "CREATE_INVITE",
  "CONNECT",
  "SPEAK",
  "VIDEO",
  "SHARE_SCREEN",
  "USE_VAD",
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

const asPermissions = (list: string[]) => list.filter(isPermission);
const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

export function computePermissions(params: {
  userId: string;
  isOwner: boolean;
  roles: RoleLike[];
  overwrites?: OverwriteLike[];
}): Set<Permission> {
  if (params.isOwner) return new Set(PERMISSIONS);

  const base = new Set<Permission>();
  for (const role of params.roles) {
    for (const permission of asPermissions(role.permissions)) base.add(permission);
  }

  if (base.has("ADMINISTRATOR")) return new Set(PERMISSIONS);

  const overwrites = params.overwrites;
  if (!overwrites?.length) return base;

  const rolesIds = new Set(params.roles.map((r) => r.id));
  const everyoneId = params.roles.find((r) => r.isEveryone)?.id;

  const apply = (allow: string[], deny: string[]) => {
    for (const permission of asPermissions(deny)) base.delete(permission);
    for (const permission of asPermissions(allow)) base.add(permission);
  };

  const fromEveryone = overwrites.find((o) => o.type === "ROLE" && o.targetId === everyoneId);
  if (fromEveryone) apply(fromEveryone.allow, fromEveryone.deny);

  const fromRoles = overwrites.filter(
    (o) => o.type === "ROLE" && o.targetId !== everyoneId && rolesIds.has(o.targetId),
  );

  if (fromRoles.length) {
    apply(
      fromRoles.flatMap((o) => o.allow),
      fromRoles.flatMap((o) => o.deny),
    );
  }

  const fromPerson = overwrites.find((o) => o.type === "MEMBER" && o.targetId === params.userId);
  if (fromPerson) apply(fromPerson.allow, fromPerson.deny);

  return base;
}

export const has = (permissions: Set<Permission>, permission: Permission) =>
  permissions.has("ADMINISTRATOR") || permissions.has(permission);

export const highestPosition = (roles: RoleLike[]) =>
  roles.reduce((larger, role) => Math.max(larger, role.position), -1);
