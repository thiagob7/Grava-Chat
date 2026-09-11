import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { countPeople, sendAnnouncement, type AnnouncementDto } from "~/@core/application/requests/admin/comunicados";
import { apiErrorMessage } from "~/@core/lib/api";

export const useCountPeople = (enabled: boolean) =>
  useQuery({ queryKey: ["admin-pessoas"], queryFn: countPeople, enabled, staleTime: 60_000 });

export const useSendAnnouncement = () =>
  useMutation({
    mutationFn: (data: AnnouncementDto) => sendAnnouncement(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para mandar o comunicado.")),
  });
