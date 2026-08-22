import type { Permission } from "@gravae/shared";

/** A ficha que a visualização de moderador mostra sobre um membro. */
export interface ModerationViewModel {
  atividade: { mensagens: number; links: number; midia: number };
  /** entradas de auditoria que a pessoa causou e que sofreu */
  auditoria: { feitas: number; sofridas: number };
  permissoes: Permission[];
  roleIds: string[];
  entrouNoServidor: string;
  entrouNoGravae: string;
  timeoutUntil: string | null;
  /** por qual convite entrou, e de quem era */
  adesao: { inviteCode: string | null; convidadoPor: string | null };
}

/** Uma mensagem na lista do "ver mais" da visualização de moderador. */
export interface ModerationMessageModel {
  id: string;
  channelId: string;
  channelName: string;
  channelType: "TEXT" | "VOICE" | "FORUM";
  content: string;
  attachments: { url: string; filename: string; contentType: string }[];
  createdAt: string;
}
