import { useQueries, useQuery } from "@tanstack/react-query";

import {
  AMBIENTES,
  REPOSITORIO,
  type Ambiente,
  type VersaoDaApi,
} from "~/features/configuracoes/lib/publicacoes";

const buscarVersao = async (ambiente: Ambiente): Promise<VersaoDaApi> => {
  const resposta = await fetch(`${ambiente.api}/api/publico/versao`, { cache: "no-store" });
  if (!resposta.ok) throw new Error(`${ambiente.nome} respondeu ${resposta.status}`);

  return (await resposta.json()) as VersaoDaApi;
};

const buscarBranch = async (branch: string) => {
  const resposta = await fetch(
    `https://api.github.com/repos/${REPOSITORIO}/commits/${branch}`,
    { headers: { accept: "application/vnd.github+json" }, cache: "no-store" },
  );

  if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as {
    sha: string;
    commit: { message: string; author: { date: string } };
  };

  return {
    sha: dados.sha,
    mensagem: dados.commit.message.split("\n")[0] ?? "",
    quando: dados.commit.author.date,
  };
};

export const usePublicacoes = (habilitado: boolean) => {
  const apis = useQueries({
    queries: AMBIENTES.map((ambiente) => ({
      queryKey: ["publicacao-api", ambiente.id],
      queryFn: () => buscarVersao(ambiente),
      enabled: habilitado,
      retry: 0,
      refetchInterval: 30_000,
    })),
  });

  const branches = useQueries({
    queries: AMBIENTES.map((ambiente) => ({
      queryKey: ["publicacao-branch", ambiente.branch],
      queryFn: () => buscarBranch(ambiente.branch),
      enabled: habilitado,
      retry: 0,
      staleTime: 30_000,
    })),
  });

  return AMBIENTES.map((ambiente, i) => ({
    ambiente,
    api: apis[i]!,
    branch: branches[i]!,
  }));
};

export const useBranchDoGit = (branch: string, habilitado: boolean) =>
  useQuery({
    queryKey: ["publicacao-branch", branch],
    queryFn: () => buscarBranch(branch),
    enabled: habilitado,
    retry: 0,
    staleTime: 30_000,
  });
