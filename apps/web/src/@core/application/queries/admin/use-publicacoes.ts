import { useQueries, useQuery } from "@tanstack/react-query";

import {
  AMBIENTES,
  FLUXO_DA_API,
  lerSituacao,
  REPOSITORIO,
  type Ambiente,
  type Publicacao,
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

const buscarPublicacoes = async (): Promise<Publicacao[]> => {
  const resposta = await fetch(
    `https://api.github.com/repos/${REPOSITORIO}/actions/workflows/${FLUXO_DA_API}/runs?per_page=5`,
    { headers: { accept: "application/vnd.github+json" }, cache: "no-store" },
  );

  if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as {
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

  return (dados.workflow_runs ?? []).map((r) => ({
    id: r.id,
    titulo: r.display_title,
    commit: r.head_sha.slice(0, 7),
    situacao: lerSituacao(r.status, r.conclusion),
    quando: r.created_at,
    link: r.html_url,
  }));
};

export const useHistoricoDePublicacoes = (habilitado: boolean) =>
  useQuery({
    queryKey: ["publicacoes-do-fluxo"],
    queryFn: buscarPublicacoes,
    enabled: habilitado,
    retry: 0,
    refetchInterval: 20_000,
  });
