import { useQueries } from "@tanstack/react-query";

import {
  ENVIRONMENTS,
  REPOSITORY,
  type Environment,
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
