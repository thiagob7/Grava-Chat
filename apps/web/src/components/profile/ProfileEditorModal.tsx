import React, { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { StatusPersonalizado } from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { StatusModal } from "~/components/profile/StatusModal";
import { UserName } from "~/components/UserName";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { EnfeitesAba } from "~/components/user-settings/perfil/EnfeitesAba";
import { IdentidadeAba } from "~/components/user-settings/perfil/IdentidadeAba";
import {
  doUsuario,
  paraPerfil,
} from "~/components/user-settings/perfil/rascunho";
import { useRascunho } from "~/hooks/use-rascunho";

export const ProfileEditorModal: React.FC<{
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
}> = ({ open, user, onClose }) => {
  const updateProfile = useUpdateProfile();
  const [definindoStatus, setDefinindoStatus] = useState(false);

  const salvo = useMemo(() => doUsuario(user), [user]);
  const { rascunho, definir, descartar, sujo } = useRascunho(salvo);
  const perfil = paraPerfil(rascunho);

  const salvar = () =>
    void updateProfile
      .mutateAsync({
        displayName: rascunho.displayName.trim(),
        bio: rascunho.bio.trim() || null,
        avatarUrl: rascunho.avatarUrl,
        perfil,
      })
      .then(() => descartar())
      .catch(() => null);

  const salvarStatus = (status: StatusPersonalizado | null) =>
    void updateProfile
      .mutateAsync({ statusPersonalizado: status })
      .then(() => setDefinindoStatus(false))
      .catch(() => null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[78vh] w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-surface-2 shadow-2xl outline-none"
          aria-label="Editar perfil"
        >
          <DialogPrimitive.Title className="sr-only">
            Editar perfil
          </DialogPrimitive.Title>

          <aside className="w-80 shrink-0 overflow-y-auto bg-surface-1 p-5">
            <h2 className="mb-4 text-sm font-semibold">Perfil principal</h2>

            <div className="space-y-6">
              <IdentidadeAba
                id={user.id}
                username={user.username}
                rascunho={rascunho}
                definir={definir}
              />
              <div className="h-px bg-line" />
              <EnfeitesAba rascunho={rascunho} definir={definir} />
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-8">
            <div className="mx-auto w-[416px]">
              <div className="w-80">
                <div style={{ zoom: 1.3 }}>
                  <ProfileCardVisual
                    id={user.id}
                    displayName={rascunho.displayName || user.displayName}
                    username={user.username}
                    avatarUrl={rascunho.avatarUrl}
                    status={user.status}
                    perfil={perfil}
                    statusPersonalizado={user.statusPersonalizado}
                    bio={rascunho.bio || null}
                    createdAt={user.createdAt}
                    editavel
                    onEtiqueta={(valor) => definir("etiqueta", valor)}
                    onEtiquetaDoServidor={(guildId) =>
                      definir("tagGuildId", guildId)
                    }
                    onStatus={() => setDefinindoStatus(true)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-1.5 text-xs font-semibold uppercase text-ink-muted">
                  No chat
                </p>
                <div className="flex gap-3 rounded bg-surface-1 px-3 py-2">
                  <Avatar
                    id={user.id}
                    name={rascunho.displayName || user.displayName}
                    url={rascunho.avatarUrl}
                    size={40}
                    enfeites={perfil}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      <UserName
                        nome={rascunho.displayName || user.displayName}
                        perfil={perfil}
                      />
                    </p>
                    <p className="text-sm text-ink-muted">
                      é assim que seu nome aparece numa conversa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
            <p className="mb-3 text-sm font-semibold">Atividade</p>
            <p className="text-sm text-ink-faint">
              Quando você entrar numa chamada, ela aparece aqui — e no seu
              cartão, pra quem abrir.
            </p>
          </aside>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          >
            <X size={20} />
          </DialogPrimitive.Close>

          {definindoStatus && (
            <StatusModal
              open
              user={user}
              perfil={perfil}
              onClose={() => setDefinindoStatus(false)}
              onSalvar={salvarStatus}
              salvando={updateProfile.isPending}
            />
          )}
        </DialogPrimitive.Content>

        <UnsavedBar
          visivel={sujo}
          salvando={updateProfile.isPending}
          onDescartar={descartar}
          onSalvar={salvar}
          texto="Não se esqueça de salvar suas alterações!"
          acaoDescartar="Redefinir"
          flutuante
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
