export interface ApiVersion {
  commit: string | null;
  branch: string | null;
  builtAt: string | null;
  sinceSeconds: number | null;
}

export interface Environment {
  id: "producao" | "staging";
  name: string;
  api: string;
  front: string;
  branch: string;
}

export const ENVIRONMENTS: Environment[] = [
  {
    id: "producao",
    name: "Produção",
    api: "https://gravaechat-api.duckdns.org",
    front: "https://gravae-chat.vercel.app",
    branch: "master",
  },
  {
    id: "staging",
    name: "Staging",
    api: "https://gravaechat-api-staging.duckdns.org",
    front: "https://gravae-chat-staging.vercel.app",
    branch: "staging",
  },
];

export const REPOSITORY = "thiagob7/Grava-Chat";
export const API_FLOW = "api.yml";

export interface Post {
  id: number;
  title: string;
  commit: string;
  situation: "esperando" | "rodando" | "boa" | "falhou" | "cancelada";
  when: string;
  link: string;
}

const SITUATION: Record<string, Post["situation"]> = {
  waiting: "esperando",
  queued: "rodando",
  requested: "rodando",
  pending: "rodando",
  in_progress: "rodando",
};

export function readSituation(status: string, conclusion: string | null): Post["situation"] {
  if (status !== "completed") return SITUATION[status] ?? "rodando";
  if (conclusion === "success") return "boa";

  return conclusion === "cancelled" ? "cancelada" : "falhou";
}

export const WAITING_APPROVAL = (p: Post) => p.situation === "esperando";

export function writeSince(seconds: number | null): string {
  if (seconds === null) return "—";

  const days = Math.floor(seconds / 86_400);
  if (days >= 1) return `${days}d`;

  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return `${hours}h`;

  return `${Math.max(1, Math.floor(seconds / 60))}min`;
}

export function delay(fromApi: string | null, fromGit: string | null): "igual" | "atras" | "desconhecido" {
  if (!fromApi || !fromGit) return "desconhecido";

  return fromGit.startsWith(fromApi) || fromApi.startsWith(fromGit) ? "igual" : "atras";
}
