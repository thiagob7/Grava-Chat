import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  cancelEvent,
  createEvent,
  findEvents,
  setEventInterest,
  type GuildEventInput,
} from "~/@core/application/requests/guild/events";
import { apiErrorMessage } from "~/@core/lib/api";

const eventsKey = (guildId: string) => ["events", guildId] as const;

export const useEvents = (guildId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: eventsKey(guildId ?? ""),
    queryFn: () => findEvents(guildId!),
    enabled: Boolean(guildId) && enabled,
  });

export const useCreateEvent = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GuildEventInput) => createEvent(guildId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: eventsKey(guildId) }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para criar o evento.")),
  });
};

export const useCancelEvent = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => cancelEvent(guildId, eventId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: eventsKey(guildId) }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para cancelar.")),
  });
};

export const useSetEventInterest = (guildId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, interested }: { eventId: string; interested: boolean }) =>
      setEventInterest(guildId, eventId, interested),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: eventsKey(guildId) }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para marcar.")),
  });
};
