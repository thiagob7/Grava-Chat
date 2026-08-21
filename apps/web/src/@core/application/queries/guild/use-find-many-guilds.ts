import { useQuery } from "@tanstack/react-query";

import { findManyGuilds } from "~/@core/application/requests/guild/find-many-guilds";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindManyGuilds = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.guild.find_many],
    queryFn: findManyGuilds,
    enabled,
  });
