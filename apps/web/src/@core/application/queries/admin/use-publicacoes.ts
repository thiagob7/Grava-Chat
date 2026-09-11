import { useQueries, useQuery } from "@tanstack/react-query";

import {
  ENVIRONMENTS,
  API_FLOW,
  readSituation,
  REPOSITORY,
  type Environment,
  type Post,
  type ApiVersion,
} from "~/features/configuracoes/lib/publicacoes";

const searchVersion = async (environment: Environment): Promise<ApiVersion> => {
  const reply = await fetch(`${environment.api}/api/publico/versao`, { cache: "no-store" });
  if (!reply.ok) throw new Error(`${environment.name} respondeu ${reply.status}`);

  return (await reply.json()) as ApiVersion;
};

const searchBranch = async (branch: string) => {
  const reply = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/commits/${branch}`,
    { headers: { accept: "application/vnd.github+json" }, cache: "no-store" },
  );

  if (!reply.ok) throw new Error(`GitHub respondeu ${reply.status}`);

  const data = (await reply.json()) as {
    sha: string;
    commit: { message: string; author: { date: string } };
  };

  return {
    sha: data.sha,
    message: data.commit.message.split("\n")[0] ?? "",
    when: data.commit.author.date,
  };
};

export const usePosts = (enabled: boolean) => {
  const apis = useQueries({
    queries: ENVIRONMENTS.map((environment) => ({
      queryKey: ["publicacao-api", environment.id],
      queryFn: () => searchVersion(environment),
      enabled: enabled,
      retry: 0,
      refetchInterval: 30_000,
    })),
  });

  const branches = useQueries({
    queries: ENVIRONMENTS.map((environment) => ({
      queryKey: ["publicacao-branch", environment.branch],
      queryFn: () => searchBranch(environment.branch),
      enabled: enabled,
      retry: 0,
      staleTime: 30_000,
    })),
  });

  return ENVIRONMENTS.map((environment, i) => ({
    environment,
    api: apis[i]!,
    branch: branches[i]!,
  }));
};

export const useBranchDoGit = (branch: string, enabled: boolean) =>
  useQuery({
    queryKey: ["publicacao-branch", branch],
    queryFn: () => searchBranch(branch),
    enabled: enabled,
    retry: 0,
    staleTime: 30_000,
  });

const searchPosts = async (): Promise<Post[]> => {
  const reply = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/actions/workflows/${API_FLOW}/runs?per_page=5`,
    { headers: { accept: "application/vnd.github+json" }, cache: "no-store" },
  );

  if (!reply.ok) throw new Error(`GitHub respondeu ${reply.status}`);

  const data = (await reply.json()) as {
    workflow_runs: {
      id: number;
      display_title: string;
      head_sha: string;
      status: string;
      conclusion: string | null;
      created_at: string;
      html_url: string;
    }[];
  };

  return (data.workflow_runs ?? []).map((r) => ({
    id: r.id,
    title: r.display_title,
    commit: r.head_sha.slice(0, 7),
    situation: readSituation(r.status, r.conclusion),
    when: r.created_at,
    link: r.html_url,
  }));
};

export const usePostsHistory = (enabled: boolean) =>
  useQuery({
    queryKey: ["publicacoes-do-fluxo"],
    queryFn: searchPosts,
    enabled: enabled,
    retry: 0,
    refetchInterval: 20_000,
  });
