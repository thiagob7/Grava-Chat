import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  confirmEmail,
  join,
  requestPasswordNew,
  emailRequestVerification,
  resetPassword,
  register,
  swapPassword,
} from "~/@core/application/requests/auth/senha";
import type { JoinDto, RegisterDto, SwapPasswordDto } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

const usesSession = (queryClient: ReturnType<typeof useQueryClient>) => (session: SessionModel) => {
  queryClient.setQueryData([queryKeys.auth.me], session.user);
  queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDto) => register(data),
    onSuccess: usesSession(queryClient),
  });
};

export const useJoin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinDto) => join(data),
    onSuccess: usesSession(queryClient),
  });
};

export const useSwapPassword = () =>
  useMutation({
    mutationFn: (data: SwapPasswordDto) => swapPassword(data),
    onSuccess: () => {
      toast.success("Senha salva.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para salvar a senha.")),
  });

export const useRequestPasswordNew = () =>
  useMutation({ mutationFn: (email: string) => requestPasswordNew(email) });

export const useResetPassword = () =>
  useMutation({ mutationFn: (data: { token: string; password: string }) => resetPassword(data) });

export const useEmailRequestVerification = () =>
  useMutation({ mutationFn: () => emailRequestVerification() });

export const useConfirmEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => confirmEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth.me] });
    },
  });
};
