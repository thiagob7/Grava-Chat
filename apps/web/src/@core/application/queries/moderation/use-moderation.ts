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

const error = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useFindBans = (guildId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.moderation.bans(guildId ?? ""),
    queryFn: () => findBans(guildId!),
    enabled: Boolean(guildId) && enabled,
  });

export const useFindAuditLog = (
  guildId: string | undefined,
  filter: { actorId?: string; action?: string },
) =>
  useQuery({
    queryKey: queryKeys.moderation.audit(guildId ?? "", JSON.stringify(filter)),
    queryFn: () => findAuditLog(guildId!, filter),
    enabled: Boolean(guildId),
  });

export const useFindAutoModRules = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.moderation.automod(guildId ?? ""),
    queryFn: () => findAutoModRules(guildId!),
    enabled: Boolean(guildId),
  });

function useInvalidateModeration(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (!guildId) return;

    void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation.bans(guildId) });
    void queryClient.invalidateQueries({ queryKey: ["find-audit-log", guildId] });
  };
}

export const useBanMember = (guildId: string | undefined) => {
  const invalidate = useInvalidateModeration(guildId);

  return useMutation({
    mutationFn: banMember,
    onSuccess: () => {
      invalidate();
      toast.success("Pessoa banida.");
    },
    onError: error("Erro ao banir."),
  });
};

export const useUnbanMember = (guildId: string | undefined) => {
  const invalidate = useInvalidateModeration(guildId);

  return useMutation({
    mutationFn: unbanMember,
    onSuccess: () => {
      invalidate();
      toast.success("Banimento removido.");
    },
    onError: error("Erro ao desbanir."),
  });
};

export const useTimeoutMember = (guildId: string | undefined) => {
  const invalidate = useInvalidateModeration(guildId);

  return useMutation({
    mutationFn: timeoutMember,
    onSuccess: (_, variables) => {
      invalidate();
      toast.success(variables.minutes ? "Pessoa de castigo." : "Castigo removido.");
    },
    onError: error("Erro ao castigar."),
  });
};

export const useSetNickname = (guildId: string | undefined) => {
  const invalidate = useInvalidateModeration(guildId);

  return useMutation({
    mutationFn: setNickname,
    onSuccess: invalidate,
    onError: error("Erro ao mudar o apelido."),
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
    onError: error("Erro ao salvar a regra."),
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
    onError: error("Erro ao apagar a regra."),
  });
};
