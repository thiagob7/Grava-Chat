import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import type { AdminArea } from "@gravae/shared";

import {
  addAdmin,
  changePanelPassword,
  findAdminLog,
  findAdminMe,
  findAdmins,
  findPublications,
  lockPanel,
  removeAdmin,
  resetAdminPassword,
  reviewPublication,
  setAdminAreas,
  unlockPanel,
} from "~/@core/application/requests/admin/painel";
import { apiErrorMessage, setAdminToken } from "~/@core/lib/api";

const ME = ["painel-eu"];
const ADMINS = ["painel-administradores"];
const LOG = ["painel-registro"];
const PUBLICATIONS = ["painel-publicacoes"];

export const useAdminMe = () =>
  useQuery({ queryKey: ME, queryFn: findAdminMe, retry: false, staleTime: 30_000 });

export const useUnlockPanel = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: unlockPanel,
    onSuccess: ({ token }) => {
      setAdminToken(token);
      void client.invalidateQueries({ queryKey: ME });
    },
  });
};

export const useChangePanelPassword = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ current, fresh }: { current: string; fresh: string }) => changePanelPassword(current, fresh),
    onSuccess: ({ token }) => {
      setAdminToken(token);
      toast.success("Senha do painel trocada.");
      void client.invalidateQueries({ queryKey: ME });
    },
  });
};

export const useLockPanel = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: lockPanel,
    onSettled: () => {
      setAdminToken(null);
      client.removeQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("painel-") && q.queryKey[0] !== ME[0] });
      void client.invalidateQueries({ queryKey: ME });
    },
  });
};

export const useAdmins = (enabled: boolean) =>
  useQuery({ queryKey: ADMINS, queryFn: findAdmins, enabled });

export const useAdminLog = (enabled: boolean) =>
  useQuery({ queryKey: LOG, queryFn: findAdminLog, enabled, refetchInterval: 60_000 });

const useManage = <T,>(fn: (vars: T) => Promise<unknown>, done: string) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(done);
      void client.invalidateQueries({ queryKey: ADMINS });
      void client.invalidateQueries({ queryKey: LOG });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu certo.")),
  });
};

export const useAddAdmin = () =>
  useManage((data: { email: string; areas: AdminArea[]; password: string }) => addAdmin(data), "Administrador adicionado.");

export const useSetAdminAreas = () =>
  useManage(({ id, areas }: { id: string; areas: AdminArea[] }) => setAdminAreas(id, areas), "Áreas atualizadas.");

export const useResetAdminPassword = () =>
  useManage(({ id, password }: { id: string; password: string }) => resetAdminPassword(id, password), "Senha provisória definida.");

export const useRemoveAdmin = () => useManage((id: string) => removeAdmin(id), "Administrador removido.");

export const usePublications = (enabled: boolean) =>
  useQuery({
    queryKey: PUBLICATIONS,
    queryFn: () => findPublications(),
    enabled,
    refetchInterval: (query) =>
      query.state.data?.runs.some((run) => run.state === "rodando" || run.state === "esperando") ? 10_000 : 30_000,
  });

export const useReviewPublication = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ runId, approve }: { runId: number; approve: boolean }) => reviewPublication(runId, approve),
    onSuccess: (_, { approve }) => {
      toast.success(approve ? "Publicação aprovada. Já está subindo." : "Publicação recusada.");
      void client.fetchQuery({ queryKey: PUBLICATIONS, queryFn: () => findPublications(true) });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "O GitHub não aceitou.")),
  });
};
