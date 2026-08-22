import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { blockUser, unblockUser } from "~/@core/application/requests/friend/block-user";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { apiErrorMessage } from "~/@core/lib/api";

/**
 * Bloquear derruba a amizade e fecha a DM do lado do servidor, então o perfil e
 * a lista de amigos precisam ser reconsultados — senão a tela continua
 * oferecendo "enviar mensagem" para alguém que já não aceita.
 */
export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
      void queryClient.invalidateQueries({ queryKey: ["find-profile"] });
      toast.success("Usuário bloqueado.");
    },
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não deu pra bloquear")),
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
      void queryClient.invalidateQueries({ queryKey: ["find-profile"] });
      toast.success("Usuário desbloqueado.");
    },
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não deu pra desbloquear")),
  });
};
