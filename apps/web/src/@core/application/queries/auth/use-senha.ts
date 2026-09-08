import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  entrar,
  pedirSenhaNova,
  redefinirSenha,
  registrar,
  trocarSenha,
} from "~/@core/application/requests/auth/senha";
import type { EntrarDTO, RegistrarDTO, TrocarSenhaDTO } from "~/@core/domain/dtos/auth-dto";
import type { SessionModel } from "~/@core/domain/models/user-model";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

const usaSessao = (queryClient: ReturnType<typeof useQueryClient>) => (session: SessionModel) => {
  queryClient.setQueryData([queryKeys.auth.me], session.user);
  queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
};

export const useRegistrar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegistrarDTO) => registrar(data),
    onSuccess: usaSessao(queryClient),
  });
};

export const useEntrar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EntrarDTO) => entrar(data),
    onSuccess: usaSessao(queryClient),
  });
};

export const useTrocarSenha = () =>
  useMutation({
    mutationFn: (data: TrocarSenhaDTO) => trocarSenha(data),
    onSuccess: () => {
      toast.success("Senha salva.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para salvar a senha.")),
  });

export const usePedirSenhaNova = () =>
  useMutation({ mutationFn: (email: string) => pedirSenhaNova(email) });

export const useRedefinirSenha = () =>
  useMutation({ mutationFn: (data: { token: string; senha: string }) => redefinirSenha(data) });
