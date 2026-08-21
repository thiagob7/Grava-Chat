import { useQuery } from "@tanstack/react-query";

import { findInvite } from "~/@core/application/requests/invite/find-invite";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindInvite = (code: string | undefined) =>
  useQuery({
    queryKey: queryKeys.invite.find(code ?? ""),
    queryFn: () => findInvite(code!),
    enabled: Boolean(code),
    retry: false,
  });
