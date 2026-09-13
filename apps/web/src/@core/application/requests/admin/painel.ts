import type {
  AdminArea,
  AdminLogEntry,
  AdminMe,
  AdminMemberView,
  AdminOwnerView,
  PublicationsView,
} from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findAdminMe = async () => (await api.get<AdminMe>("/admin/eu")).data;

export const unlockPanel = async (password: string) =>
  (await api.post<{ token: string; mustChangePassword: boolean }>("/admin/entrar", { password })).data;

export const lockPanel = async () => {
  await api.post("/admin/sair");
};

export const changePanelPassword = async (current: string, fresh: string) =>
  (await api.post<{ token: string }>("/admin/senha", { current, fresh })).data;

export const findAdmins = async () =>
  (await api.get<{ owners: AdminOwnerView[]; members: AdminMemberView[] }>("/admin/administradores")).data;

export const addAdmin = async (data: { email: string; areas: AdminArea[]; password: string }) =>
  (await api.post<{ id: string }>("/admin/administradores", data)).data;

export const setAdminAreas = async (memberId: string, areas: AdminArea[]) => {
  await api.patch(`/admin/administradores/${memberId}`, { areas });
};

export const resetAdminPassword = async (memberId: string, password: string) => {
  await api.post(`/admin/administradores/${memberId}/senha`, { password });
};

export const removeAdmin = async (memberId: string) => {
  await api.delete(`/admin/administradores/${memberId}`);
};

export const findAdminLog = async () => (await api.get<AdminLogEntry[]>("/admin/registro")).data;

export const findPublications = async (fresh = false) =>
  (await api.get<PublicationsView>("/admin/publicacoes", { params: fresh ? { fresh: true } : undefined })).data;

export const reviewPublication = async (runId: number, approve: boolean) =>
  (await api.post<{ environments: string[] }>(`/admin/publicacoes/${runId}/${approve ? "aprovar" : "recusar"}`)).data;
