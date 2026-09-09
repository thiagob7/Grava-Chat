export const ESCOPOS_OAUTH = [
  { id: "identify", descricao: "Acessar suas informações básicas de perfil (nome de usuário, avatar, etc.)", obrigatorio: false },
  { id: "email", descricao: "Ver seu endereço de e-mail", obrigatorio: false },
  { id: "guilds", descricao: "Ver as comunidades de que você é membro", obrigatorio: false },
  { id: "connections", descricao: "Ver suas contas conectadas", obrigatorio: false },
  { id: "bot", descricao: "Adicionar um bot a uma comunidade com as permissões solicitadas", obrigatorio: true },
] as const;

export type EscopoOAuth = (typeof ESCOPOS_OAUTH)[number]["id"];

export const ESCOPOS = ESCOPOS_OAUTH.map((e) => e.id) as readonly EscopoOAuth[];

export const ehEscopo = (valor: string): valor is EscopoOAuth => (ESCOPOS as readonly string[]).includes(valor);
