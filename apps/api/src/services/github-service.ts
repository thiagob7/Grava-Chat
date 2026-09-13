import type {
  PendingCommit,
  PublicationsView,
  WebDeploy,
  WorkflowJob,
  WorkflowRun,
  WorkflowState,
} from "@gravae/shared";

import { env } from "~/env.js";
import { AppError, NotFoundError } from "~/lib/http.js";

/*
  O GitHub visto pelo painel.

  O token fica só aqui, no servidor. Com ele a API do GitHub responde bem mais
  vezes por hora e deixa aprovar a publicação. Sem ele o painel ainda mostra o
  que é público do repositório, e o botão de aprovar some.

  A leitura guarda o resultado por alguns segundos: o painel pergunta de tempos
  em tempos, e várias pessoas com ele aberto não podem virar várias perguntas ao
  GitHub.
*/
const API = "https://api.github.com";
const WORKFLOWS = ["api.yml", "desktop.yml"];
const CACHE_MS = 20_000;

let cached: { at: number; view: PublicationsView } | null = null;

/*
  Execução e deploy que terminaram não mudam mais. Guardados por id, a leitura
  seguinte só pergunta pelo que ainda está andando, e o painel aberto fica bem
  abaixo do limite do token.
*/
const finishedRuns = new Map<number, WorkflowRun>();
const finishedDeploys = new Map<number, WebDeploy>();

const remember = <K, V>(map: Map<K, V>, key: K, value: V) => {
  map.set(key, value);
  if (map.size > 60) map.delete(map.keys().next().value as K);
};

async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const reply = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!reply.ok) {
    const text = await reply.text().catch(() => "");
    throw new AppError(`GitHub respondeu ${reply.status}${text ? `: ${text.slice(0, 160)}` : ""}`, 502);
  }

  return (reply.status === 204 ? null : await reply.json()) as T;
}

const repo = () => `/repos/${env.GITHUB_REPOSITORY}`;

export function stateOf(status: string | null, conclusion: string | null): WorkflowState {
  if (status === "waiting") return "esperando";
  if (status !== "completed") return "rodando";
  if (conclusion === "success" || conclusion === "skipped") return "boa";

  return conclusion === "cancelled" ? "cancelada" : "falhou";
}

export function deployStateOf(state: string | undefined): WorkflowState {
  if (state === "success") return "boa";
  if (state === "failure" || state === "error") return "falhou";
  if (state === "inactive") return "cancelada";

  return "rodando";
}

type RawRun = {
  id: number;
  name: string;
  display_title: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  actor?: { login: string } | null;
};

type RawJob = {
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
  steps?: { name: string; status: string; conclusion: string | null; started_at: string | null; completed_at: string | null }[];
};

async function branch(name: string) {
  const data = await github<{ sha: string; commit: { message: string; author: { date: string } } }>(
    `${repo()}/commits/${name}`,
  ).catch(() => null);

  return data
    ? { sha: data.sha, message: data.commit.message.split("\n")[0] ?? "", when: data.commit.author.date }
    : null;
}

async function runs(): Promise<WorkflowRun[]> {
  const lists = await Promise.all(
    WORKFLOWS.map((file) =>
      github<{ workflow_runs: RawRun[] }>(`${repo()}/actions/workflows/${file}/runs?per_page=6`)
        .then((d) => d.workflow_runs.map((run) => ({ ...run, file })))
        .catch(() => []),
    ),
  );

  const recent = lists
    .flat()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  return Promise.all(
    recent.map(async (run): Promise<WorkflowRun> => {
      const kept = finishedRuns.get(run.id);
      if (kept) return kept;

      const state = stateOf(run.status, run.conclusion);

      const [jobs, pending, reviews] = await Promise.all([
        github<{ jobs: RawJob[] }>(`${repo()}/actions/runs/${run.id}/jobs`)
          .then((d) => d.jobs)
          .catch(() => [] as RawJob[]),
        state === "esperando" && env.GITHUB_TOKEN
          ? github<{ environment: { name: string }; current_user_can_approve: boolean }[]>(
              `${repo()}/actions/runs/${run.id}/pending_deployments`,
            ).catch(() => [])
          : Promise.resolve([]),
        github<{ user: { login: string }; state: string; comment: string | null }[]>(
          `${repo()}/actions/runs/${run.id}/approvals`,
        ).catch(() => []),
      ]);

      const view: WorkflowRun = {
        id: run.id,
        workflow: run.name,
        title: run.display_title,
        branch: run.head_branch,
        commit: run.head_sha.slice(0, 7),
        actor: run.actor?.login ?? null,
        state,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        link: run.html_url,
        jobs: jobs.map(
          (job): WorkflowJob => ({
            name: job.name,
            state: stateOf(job.status, job.conclusion),
            startedAt: job.started_at,
            completedAt: job.completed_at,
            link: job.html_url,
            steps: (job.steps ?? []).map((step) => ({
              name: step.name,
              state: stateOf(step.status, step.conclusion),
              startedAt: step.started_at,
              completedAt: step.completed_at,
            })),
          }),
        ),
        pending: pending.map((p) => ({ environment: p.environment.name, canApprove: p.current_user_can_approve })),
        reviews: reviews.map((r) => ({ user: r.user.login, state: r.state, comment: r.comment })),
      };

      if (run.status === "completed") remember(finishedRuns, run.id, view);
      return view;
    }),
  );
}

async function webDeploys(): Promise<WebDeploy[]> {
  const deployments = await github<
    { id: number; sha: string; environment: string; created_at: string }[]
  >(`${repo()}/deployments?per_page=10`).catch(() => []);

  const production = deployments.filter((d) => d.environment === "Production").slice(0, 3);
  const preview = deployments.filter((d) => d.environment !== "Production" && d.environment !== "producao").slice(0, 2);

  return Promise.all(
    [...production, ...preview].map(async (deployment) => {
      const kept = finishedDeploys.get(deployment.id);
      if (kept) return kept;

      const [status] = await github<{ state: string; environment_url?: string; target_url?: string }[]>(
        `${repo()}/deployments/${deployment.id}/statuses?per_page=1`,
      ).catch(() => []);

      const view: WebDeploy = {
        environment: deployment.environment,
        commit: deployment.sha.slice(0, 7),
        state: deployStateOf(status?.state),
        createdAt: deployment.created_at,
        link: status?.environment_url || status?.target_url || null,
      };

      if (view.state !== "rodando") remember(finishedDeploys, deployment.id, view);
      return view;
    }),
  );
}

async function toShip(): Promise<PublicationsView["toShip"]> {
  const compare = await github<{
    ahead_by: number;
    commits: { sha: string; commit: { message: string; author: { name: string; date: string } } }[];
  }>(`${repo()}/compare/master...dev`).catch(() => null);

  if (!compare) return { count: 0, commits: [] };

  const commits = compare.commits
    .filter((c) => !c.commit.message.startsWith("Merge pull request"))
    .reverse()
    .slice(0, 15)
    .map(
      (c): PendingCommit => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0] ?? "",
        author: c.commit.author.name ?? null,
        when: c.commit.author.date,
      }),
    );

  return { count: compare.commits.filter((c) => !c.commit.message.startsWith("Merge pull request")).length, commits };
}

export const githubService = {
  async publications(canApprove: boolean, fresh = false): Promise<PublicationsView> {
    if (!fresh && cached && Date.now() - cached.at < CACHE_MS) {
      return { ...cached.view, canApprove: canApprove && cached.view.tokenConfigured };
    }

    try {
      const [master, staging, dev, recent, web, shipping] = await Promise.all([
        branch("master"),
        branch("staging"),
        branch("dev"),
        runs(),
        webDeploys(),
        toShip(),
      ]);

      const view: PublicationsView = {
        repository: env.GITHUB_REPOSITORY,
        tokenConfigured: Boolean(env.GITHUB_TOKEN),
        canApprove: false,
        branches: { master, staging, dev },
        web,
        runs: recent,
        toShip: shipping,
        error: null,
      };

      cached = { at: Date.now(), view };
      return { ...view, canApprove: canApprove && view.tokenConfigured };
    } catch (error) {
      return {
        repository: env.GITHUB_REPOSITORY,
        tokenConfigured: Boolean(env.GITHUB_TOKEN),
        canApprove: false,
        branches: { master: null, staging: null, dev: null },
        web: [],
        runs: [],
        toShip: { count: 0, commits: [] },
        error: error instanceof Error ? error.message : "Não consegui falar com o GitHub.",
      };
    }
  },

  /*
    Aprova ou recusa tudo o que a execução está esperando. No GitHub a revisão
    sai no nome do dono do token; o comentário leva o nome de quem clicou, e o
    registro do painel guarda o mesmo.
  */
  async review(runId: number, approve: boolean, actorName: string) {
    if (!env.GITHUB_TOKEN) throw new AppError("O servidor não tem GITHUB_TOKEN; aprove direto no GitHub.");

    const pending = await github<{ environment: { id: number; name: string } }[]>(
      `${repo()}/actions/runs/${runId}/pending_deployments`,
    );

    if (!pending.length) throw new NotFoundError("Esta execução não está esperando aprovação.");

    await github(`${repo()}/actions/runs/${runId}/pending_deployments`, {
      method: "POST",
      body: JSON.stringify({
        environment_ids: pending.map((p) => p.environment.id),
        state: approve ? "approved" : "rejected",
        comment: `${approve ? "Aprovado" : "Recusado"} no painel do Gravaê por ${actorName}.`,
      }),
    });

    cached = null;

    return { environments: pending.map((p) => p.environment.name) };
  },
};
