import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { AccountSection } from "~/components/user-settings/AccountSection";
import { VoiceSection } from "~/components/user-settings/VoiceSection";
import { cn } from "~/lib/utils";

type Secao = "conta" | "voz" | "aparencia";

interface UserSettingsModalProps {
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
  onLogout: () => void;
  /** abre direto numa seção — o botão de voz do painel usa isto */
  secaoInicial?: Secao;
  /** o cabeçalho leva pro editor de perfil, que vive num modal próprio */
  onEditarPerfil: () => void;
}

const ITENS: { id: Secao; label: string }[] = [
  { id: "conta", label: "Minha conta" },
  { id: "voz", label: "Voz e vídeo" },
  { id: "aparencia", label: "Aparência" },
];

/**
 * Configurações do usuário, em modal.
 *
 * Deixou de ser tela cheia: tela cheia ficou reservada para as configurações do
 * SERVIDOR, que têm treze seções e listas de membros e cargos. As do usuário são
 * três telas curtas — engolir o app inteiro por causa delas fazia a volta pro
 * chat parecer uma navegação, e não um fechar de janela.
 *
 * O perfil saiu daqui e virou modal próprio: ele precisa da coluna de controles
 * ao lado do cartão, e isso não cabia numa aba. O acesso continua sendo pelo
 * mesmo lugar — o cabeçalho aqui em cima e o botão do cartão.
 */
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
            {/*
              O atalho pro perfil mora no topo do menu, com a sua cara. É o item
              que as pessoas mais procuram aqui dentro, e o único que abre outra
              coisa em vez de trocar o painel da direita.
            */}
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
