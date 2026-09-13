/*
  As áreas do painel de administração.

  Quem é dono (e-mail em ADMIN_EMAILS no servidor) tem todas e não depende de
  senha de painel. Quem é adicionado pelo painel tem só as áreas marcadas, e
  entra com uma senha própria, separada da senha da conta.

  "aprovar" é a mais delicada: com ela a pessoa manda código para produção sem
  passar pelo GitHub. Por isso fica separada de "publicacoes", que só mostra.
*/
export const ADMIN_AREAS = [
  "publicacoes",
  "aprovar",
  "servidor",
  "denuncias",
  "comunicado",
  "comunidades",
  "administradores",
] as const;

export type AdminArea = (typeof ADMIN_AREAS)[number];

export const ADMIN_TOKEN_HEADER = "x-gravae-admin";

export const ADMIN_PASSWORD_MIN = 10;

export const isAdminArea = (value: unknown): value is AdminArea =>
  ADMIN_AREAS.includes(value as AdminArea);

export interface AdminMe {
  role: "dono" | "admin";
  email: string;
  areas: AdminArea[];
  /** Precisa digitar a senha do painel antes de ver qualquer área. */
  locked: boolean;
  /** Entrou com senha provisória e ainda não trocou. */
  mustChangePassword: boolean;
}

export interface AdminMemberView {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  areas: AdminArea[];
  mustChangePassword: boolean;
  addedBy: string | null;
  createdAt: string;
  lastUnlockAt: string | null;
}

export interface AdminOwnerView {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AdminLogEntry {
  id: string;
  actor: string;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export type WorkflowState = "esperando" | "rodando" | "boa" | "falhou" | "cancelada";

export interface WorkflowStep {
  name: string;
  state: WorkflowState;
  startedAt: string | null;
  completedAt: string | null;
}

export interface WorkflowJob {
  name: string;
  state: WorkflowState;
  startedAt: string | null;
  completedAt: string | null;
  steps: WorkflowStep[];
  link: string;
}

export interface WorkflowRun {
  id: number;
  workflow: string;
  title: string;
  branch: string;
  commit: string;
  actor: string | null;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
  link: string;
  jobs: WorkflowJob[];
  /** Ambientes esperando aprovação nesta execução. */
  pending: { environment: string; canApprove: boolean }[];
  reviews: { user: string; state: string; comment: string | null }[];
}

export interface WebDeploy {
  environment: string;
  commit: string;
  state: WorkflowState;
  createdAt: string;
  link: string | null;
}

export interface PendingCommit {
  sha: string;
  message: string;
  author: string | null;
  when: string;
}

export interface PublicationsView {
  repository: string;
  tokenConfigured: boolean;
  canApprove: boolean;
  branches: Record<"master" | "staging" | "dev", { sha: string; message: string; when: string } | null>;
  web: WebDeploy[];
  runs: WorkflowRun[];
  /** Commits que estão na dev e ainda não chegaram na master. */
  toShip: { count: number; commits: PendingCommit[] };
  error: string | null;
}
