export const SCOPES_OAUTH = [
  { id: "identify", description: "Acessar suas informações básicas de perfil (nome de usuário, avatar, etc.)", required: false },
  { id: "email", description: "Ver seu endereço de e-mail", required: false },
  { id: "guilds", description: "Ver as comunidades de que você é membro", required: false },
  { id: "connections", description: "Ver suas contas conectadas", required: false },
  { id: "bot", description: "Adicionar um bot a uma comunidade com as permissões solicitadas", required: true },
] as const;

export type ScopeAuth = (typeof SCOPES_OAUTH)[number]["id"];

export const SCOPES = SCOPES_OAUTH.map((e) => e.id) as readonly ScopeAuth[];

export const isScope = (value: string): value is ScopeAuth => (SCOPES as readonly string[]).includes(value);
