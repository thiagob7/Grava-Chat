import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { contarPessoas, mandarComunicado, type ComunicadoDTO } from "~/@core/application/requests/admin/comunicados";
import { apiErrorMessage } from "~/@core/lib/api";

export const useContarPessoas = (enabled: boolean) =>
  useQuery({ queryKey: ["admin-pessoas"], queryFn: contarPessoas, enabled, staleTime: 60_000 });

export const useMandarComunicado = () =>
  useMutation({
    mutationFn: (data: ComunicadoDTO) => mandarComunicado(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para mandar o comunicado.")),
  });
