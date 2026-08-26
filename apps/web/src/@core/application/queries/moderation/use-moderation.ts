import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  banMember,
  deleteAutoModRule,
  findAuditLog,
  findAutoModRules,
  findBans,
  saveAutoModRule,
  setNickname,
  timeoutMember,
  unbanMember,
} from "~/@core/application/requests/moderation/moderation";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

const erro = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useFindBans = (guildId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.moderation.bans(guildId ?? ""),
    queryFn: () => findBans(guildId!),
    enabled: Boolean(guildId) && enabled,
  });

export const useFindAuditLog = (
  guildId: string | undefined,
  filtro: { actorId?: string; action?: string },
) =>
  useQuery({
    queryKey: queryKeys.moderation.audit(guildId ?? "", JSON.stringify(filtro)),
    queryFn: () => findAuditLog(guildId!, filtro),
    enabled: Boolean(guildId),
  });

export const useFindAutoModRules = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.moderation.automod(guildId ?? ""),
    queryFn: () => findAutoModRules(guildId!),
    enabled: Boolean(guildId),
  });

function useInvalidarModeracao(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (!guildId) return;

    void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation.bans(guildId) });
    void queryClient.invalidateQueries({ queryKey: ["find-audit-log", guildId] });
  };
}

export const useBanMember = (guildId: string | undefined) => {
  const invalidar = useInvalidarModeracao(guildId);

  return useMutation({
    mutationFn: banMember,
    onSuccess: () => {
      invalidar();
      toast.success("Pessoa banida.");
    },
    onError: erro("Erro ao banir."),
  });
};

export const useUnbanMember = (guildId: string | undefined) => {
  const invalidar = useInvalidarModeracao(guildId);

  return useMutation({
    mutationFn: unbanMember,
    onSuccess: () => {
      invalidar();
      toast.success("Banimento removido.");
    },
    onError: erro("Erro ao desbanir."),
  });
};

export const useTimeoutMember = (guildId: string | undefined) => {
  const invalidar = useInvalidarModeracao(guildId);

  return useMutation({
    mutationFn: timeoutMember,
    onSuccess: (_, variaveis) => {
      invalidar();
      toast.success(variaveis.minutos ? "Pessoa de castigo." : "Castigo removido.");
    },
    onError: erro("Erro ao castigar."),
  });
};

export const useSetNickname = (guildId: string | undefined) => {
  const invalidar = useInvalidarModeracao(guildId);

  return useMutation({
    mutationFn: setNickname,
    onSuccess: invalidar,
    onError: erro("Erro ao mudar o apelido."),
  });
};

export const useSaveAutoModRule = (guildId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveAutoModRule,
    onSuccess: () => {
      if (guildId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.moderation.automod(guildId) });
      }
      toast.success("Regra salva.");
    },
    onError: erro("Erro ao salvar a regra."),
  });
};

export const useDeleteAutoModRule = (guildId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAutoModRule,
    onSuccess: () => {
      if (guildId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.moderation.automod(guildId) });
      }
    },
    onError: erro("Erro ao apagar a regra."),
  });
};
