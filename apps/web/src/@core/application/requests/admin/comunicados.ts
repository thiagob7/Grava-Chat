import { api } from "~/@core/lib/api";

export interface AnnouncementDto {
  content: string;
  userIds?: string[];
}

export async function sendAnnouncement(data: AnnouncementDto) {
  const response = await api.post<{ recipients: number }>("/admin/comunicados", data);
  return response.data;
}

export async function countPeople() {
  const response = await api.get<{ total: number }>("/admin/pessoas");
  return response.data;
}
