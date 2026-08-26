import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { AccountSection } from "~/components/user-settings/AccountSection";
import { AppearanceSection } from "~/components/user-settings/AppearanceSection";
import { NotificationsSection } from "~/components/user-settings/NotificationsSection";
import { VoiceSection } from "~/components/user-settings/VoiceSection";
import { BotsSection } from "~/components/user-settings/BotsSection";
import { cn } from "~/lib/utils";

type Secao = "conta" | "voz" | "avisos" | "bots" | "aparencia";

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  secaoInicial?: Secao;
  onEditarPerfil: () => void;
}

const ITENS: { id: Secao; label: string }[] = [
  { id: "conta", label: "Minha conta" },
  { id: "voz", label: "Voz e vídeo" },
  { id: "avisos", label: "Notificações" },
  { id: "bots", label: "Bots" },
  { id: "aparencia", label: "Aparência" },
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  open,
  user,
  onClose,
  onLogout,
  secaoInicial = "conta",
  onEditarPerfil,
}) => {
  const [secao, setSecao] = useState<Secao>(secaoInicial);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-surface-2 shadow-2xl outline-none"
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title className="sr-only">Configurações do usuário</DialogPrimitive.Title>

          <nav className="w-60 shrink-0 overflow-y-auto bg-surface-1 px-3 py-5">
            <button
              onClick={onEditarPerfil}
              className="mb-4 flex w-full items-center gap-2.5 rounded px-2 py-2 text-left transition hover:bg-surface-3"
            >
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={36}
                enfeites={user.perfil}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{user.displayName}</span>
                <span className="flex items-center gap-1 text-xs text-ink-muted">
                  Editar perfil <Pencil size={11} />
                </span>
              </span>
            </button>

            <p className="mb-2 truncate px-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Configurações do usuário
            </p>

            {ITENS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSecao(item.id)}
                className={cn(
                  "mb-0.5 flex w-full items-center rounded px-2.5 py-1.5 text-left text-sm transition",
                  secao === item.id
                    ? "bg-surface-4 text-ink"
                    : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto bg-surface-2 px-8 py-6">
            {secao === "conta" && <AccountSection user={user} onLogout={onLogout} />}
            {secao === "voz" && <VoiceSection />}
            {secao === "avisos" && <NotificationsSection />}
            {secao === "bots" && <BotsSection />}

            {secao === "aparencia" && <AppearanceSection />}
          </div>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          >
            <X size={20} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
