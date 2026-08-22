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
import { doUsuario, paraPerfil } from "~/components/user-settings/perfil/rascunho";
import { useRascunho } from "~/hooks/use-rascunho";

/**
 * O editor de perfil, em modal próprio.
 *
 * Saiu de dentro das configurações porque ali ele competia com voz, conta e
 * aparência por um espaço que ele não tem: o desenho pede a coluna de controles
 * **ao lado** do cartão, não abaixo dele. Aqui o cartão fica no meio, grande, e
 * cada mexida aparece nele na hora — que é a única razão de existir um editor
 * de aparência.
 *
 * O cartão do meio é o COMPONENTE REAL, o mesmo que os outros veem ao clicar em
 * você. Uma prévia que fosse cópia mentiria na primeira mudança de layout — e
 * mentiria justamente para quem está decidindo como vai aparecer.
 */
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

  /**
   * O status é salvo NA HORA, sem passar pela barra de "não salvas".
   *
   * Ele não é aparência: é um recado com validade — "volto em 10 minutos" que
   * só vale se sair agora. Deixá-lo esperando um botão Salvar do outro lado da
   * tela transformaria um aviso em rascunho esquecido.
   */
  const salvarStatus = (status: StatusPersonalizado | null) =>
    void updateProfile
      .mutateAsync({ statusPersonalizado: status })
      .then(() => setDefinindoStatus(false))
      .catch(() => null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[85vh] w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-surface-2 shadow-2xl outline-none"
          aria-label="Editar perfil"
        >
          <DialogPrimitive.Title className="sr-only">Editar perfil</DialogPrimitive.Title>

          {/* coluna 1: os controles */}
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

          {/* coluna 2: o cartão de verdade, ao vivo */}
          <main className="min-w-0 flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-md">
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
                onEtiquetaDoServidor={(guildId) => definir("tagGuildId", guildId)}
                onStatus={() => setDefinindoStatus(true)}
              />

              {/*
                A linha de chat vai junto porque o enfeite se comporta diferente
                nos dois: aqui em cima o nome é grande e animado, lá embaixo é
                14px e parado — e gradiente e brilho nem aparecem. Só o cartão
                faria a pessoa escolher um gradiente lindo e descobrir depois que
                onde ela realmente aparece ele não existe.
              */}
              <div className="mt-6">
                <p className="mb-1.5 text-xs font-semibold uppercase text-ink-muted">No chat</p>
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

              <UnsavedBar
                visivel={sujo}
                salvando={updateProfile.isPending}
                onDescartar={descartar}
                onSalvar={salvar}
              />
            </div>
          </main>

          {/* coluna 3: o que você está fazendo agora */}
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
            <p className="mb-3 text-sm font-semibold">Atividade</p>
            <p className="text-sm text-ink-faint">
              Quando você entrar numa chamada, ela aparece aqui — e no seu cartão, pra quem abrir.
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
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
