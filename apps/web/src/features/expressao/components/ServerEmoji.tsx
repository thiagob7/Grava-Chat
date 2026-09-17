import React from "react";
import { useQuery } from "@tanstack/react-query";

import { findEmojiById } from "~/@core/application/requests/expression/find-emojis-by-id";
import { cn } from "~/lib/utils";

export const useServerEmoji = (id: string | null) =>
  useQuery({
    queryKey: ["server-emoji", id],
    queryFn: () => findEmojiById(id!),
    enabled: Boolean(id),
    staleTime: Infinity,
    retry: false,
  });

export const ServerEmoji: React.FC<{ id: string; name: string; className?: string }> = ({ id, name, className = "size-6" }) => {
  const { data } = useServerEmoji(id);

  if (!data) return <>{`:${name}:`}</>;

  return (
    <img data-gc="expressao.server-emoji.img"
      src={data.url}
      alt={`:${data.name}:`}
      title={`:${data.name}:`}
      className={cn("inline-block align-text-bottom object-contain", className)}
    />
  );
};
