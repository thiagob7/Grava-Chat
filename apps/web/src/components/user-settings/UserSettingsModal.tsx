import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { AccountSection } from "~/components/user-settings/AccountSection";
import { ProfileSection } from "~/components/user-settings/ProfileSection";
import { VoiceSection } from "~/components/user-settings/VoiceSection";
import { cn } from "~/lib/utils";

type Secao = "conta" | "perfil" | "voz" | "aparencia";

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  /** abre direto numa seção — o botão de voz do painel usa isto */
  secaoInicial?: Secao;
}

const ITENS: { id: Secao; label: string }[] = [
  { id: "conta", label: "Minha conta" },
  { id: "perfil", label: "Perfil" },
  { id: "voz", label: "Voz e vídeo" },
  { id: "aparencia", label: "Aparência" },
];

/**
 * Configurações do usuário em tela cheia, no formato do Discord. Absorveu o
 * modalzinho de perfil que existia antes: com voz, conta e aparência juntas,
 * uma caixa pequena não dá conta.
 */
export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  open,
  user,
  onClose,
  onLogout,
  secaoInicial = "conta",
}) => {
  const [secao, setSecao] = useState<Secao>(secaoInicial);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-2" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex outline-none"
          aria-label="Configurações do usuário"
        >
          <DialogPrimitive.Title className="sr-only">Configurações do usuário</DialogPrimitive.Title>

          <nav className="w-60 shrink-0 overflow-y-auto bg-surface-1 px-3 py-12">
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

          <div className="flex-1 overflow-y-auto bg-surface-2 px-10 py-12">
            {secao === "conta" && <AccountSection user={user} onLogout={onLogout} />}
            {secao === "perfil" && <ProfileSection user={user} />}
            {secao === "voz" && <VoiceSection />}

            {secao === "aparencia" && (
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold">Aparência</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Por enquanto só o tema escuro. O claro entra quando alguém pedir — ninguém abre um
                  chat de voz de madrugada no branco.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-10 top-12 flex flex-col items-center gap-1 text-ink-muted transition hover:text-ink"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-current">
              <X size={18} />
            </span>
            <span className="text-xs font-semibold">ESC</span>
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
