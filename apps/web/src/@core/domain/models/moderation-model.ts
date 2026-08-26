import type { Permission } from "@gravae/shared";

export interface ModerationViewModel {
  atividade: { mensagens: number; links: number; midia: number };
  auditoria: { feitas: number; sofridas: number };
  permissoes: Permission[];
  roleIds: string[];
  entrouNoServidor: string;
  entrouNoGravae: string;
  timeoutUntil: string | null;
  adesao: { inviteCode: string | null; convidadoPor: string | null };
}

export interface ModerationMessageModel {
  id: string;
  channelId: string;
  channelName: string;
  channelType: "TEXT" | "VOICE" | "FORUM";
  content: string;
  attachments: { url: string; filename: string; contentType: string }[];
  createdAt: string;
}
