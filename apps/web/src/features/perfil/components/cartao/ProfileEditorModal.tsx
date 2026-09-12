import React, { useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";
import type { CustomStatus } from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useImageProfileSending } from "~/features/perfil/hooks/use-envio-de-imagem-de-perfil";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { ProfileImageFraming } from "~/features/perfil/components/EnquadrarImagemDePerfil";
import { StatusModal } from "~/features/perfil/components/cartao/StatusModal";
import { PickCharmModal } from "~/features/perfil/components/cartao/EscolherEnfeiteModal";
import { AVATAR_DECORATIONS } from "~/features/perfil/lib/catalogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserName } from "~/features/perfil/components/UserName";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Sample, CharmsTab } from "~/features/configuracoes/components/perfil/EnfeitesAba";
import { IdentityTab } from "~/features/configuracoes/components/perfil/IdentidadeAba";
import {
  fromUser,
  forProfile,
} from "~/features/configuracoes/components/perfil/rascunho";
import { useDraft } from "~/features/perfil/hooks/use-rascunho";
import { useTranslation } from "~/traducao";

export const ProfileEditorModal: React.FC<{
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
}> = ({ open, user, onClose }) => {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const [settingStatus, setSettingStatus] = useState(false);
  const pickPhoto = useRef<HTMLInputElement>(null);
  const pickTrack = useRef<HTMLInputElement>(null);
  const [charmIsOpen, setCharmIsOpen] = useState<"decoration" | null>(null);

  const saved = useMemo(() => fromUser(user), [user]);
  const { draft, set, discard, dirty } = useDraft(saved);
  const profile = forProfile(draft);
  const { send, framing, cancelFrame, applyFrame } = useImageProfileSending(
    (field, url) => set(field, url),
  );

  const cardPreview = {
    id: user.id,
    displayName: draft.displayName || user.displayName,
    username: user.username,
    avatarUrl: draft.avatarUrl,
    status: user.status,
    profile,
    customStatus: user.customStatus,
    bio: draft.bio || null,
    pronouns: draft.pronouns || null,
    createdAt: user.createdAt,
  };

  const save = () => {
    const displayName = draft.displayName.trim();
    const bio = draft.bio.trim() || null;
    const pronouns = draft.pronouns.trim() || null;

    void updateProfile
      .mutateAsync({
        ...(displayName !== saved.displayName ? { displayName } : {}),
        ...(bio !== (saved.bio || null) ? { bio } : {}),
        ...(pronouns !== (saved.pronouns || null) ? { pronouns } : {}),
        ...(draft.avatarUrl !== saved.avatarUrl ? { avatarUrl: draft.avatarUrl } : {}),
        ...(JSON.stringify(profile) !== JSON.stringify(forProfile(saved)) ? { profile } : {}),
      })
      .then(() => discard())
      .catch(() => null);
  };

  const saveStatus = (status: CustomStatus | null) =>
    void updateProfile
      .mutateAsync({ customStatus: status })
      .then(() => setSettingStatus(false))
      .catch(() => null);

  return (
    <DialogPrimitive.Root data-gc="perfil.cartao.profile-editor-modal.dialog-primitiveroot"
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="perfil.cartao.profile-editor-modal.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-veu" />
        <DialogPrimitive.Content data-gc="perfil.cartao.profile-editor-modal.dialog-primitivecontent"
          className="regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-full w-full flex-col overflow-hidden bg-surface-2 shadow-2xl outline-none md:h-[78vh] md:max-w-6xl md:flex-row md:rounded-lg"
          aria-label={t("perfil.editar")}
        >
          <DialogPrimitive.Title data-gc="perfil.cartao.profile-editor-modal.dialog-primitivetitle" className="sr-only">
            {t("perfil.editar")}
          </DialogPrimitive.Title>

          <aside data-gc="perfil.cartao.profile-editor-modal.aside" className="w-full shrink-0 overflow-y-auto bg-surface-1 p-5 md:w-80">
            <h2 data-gc="perfil.cartao.profile-editor-modal.h2" className="mb-4 text-sm font-semibold">{t("perfil.editor.principal")}</h2>

            <div data-gc="perfil.cartao.profile-editor-modal.div" className="space-y-6">
              <IdentityTab data-gc="perfil.cartao.profile-editor-modal.identity-tab"
                id={user.id}
                username={user.username}
                draft={draft}
                set={set}
              />
              <div data-gc="perfil.cartao.profile-editor-modal.div--2" className="h-px bg-line" />
              <CharmsTab data-gc="perfil.cartao.profile-editor-modal.charms-tab" draft={draft} set={set} />
            </div>
          </aside>

          <main data-gc="perfil.cartao.profile-editor-modal.main" className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
            <ProfileImageFraming data-gc="perfil.cartao.profile-editor-modal.profile-image-framing.cancel-frame"
              framing={framing}
              onCancel={cancelFrame}
              onApply={(cut) => void applyFrame(cut)}
            />

            <input data-gc="perfil.cartao.profile-editor-modal.input"
              ref={pickPhoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void send(e, "avatarUrl")}
            />
            <input data-gc="perfil.cartao.profile-editor-modal.input--2"
              ref={pickTrack}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void send(e, "bannerUrl")}
            />

            <div data-gc="perfil.cartao.profile-editor-modal.div--3" className="mx-auto w-full max-w-96">
              <div data-gc="perfil.cartao.profile-editor-modal.div--4">
                <div data-gc="perfil.cartao.profile-editor-modal.div--5">
                  <ProfileCardVisual data-gc="perfil.cartao.profile-editor-modal.profile-card-visual"
                    id={user.id}
                    displayName={draft.displayName || user.displayName}
                    username={user.username}
                    avatarUrl={draft.avatarUrl}
                    status={user.status}
                    profile={profile}
                    customStatus={user.customStatus}
                    bio={draft.bio || null}
                    pronouns={draft.pronouns || null}
                    createdAt={user.createdAt}
                    editable
                    onTag={(value) => set("tag", value)}
                    onServerTag={(guildId) =>
                      set("tagGuildId", guildId)
                    }
                    onStatus={() => setSettingStatus(true)}
                    onEditPhoto={() => pickPhoto.current?.click()}
                    trackMenu={
                      <DropdownMenu data-gc="perfil.cartao.profile-editor-modal.dropdown-menu">
                        <DropdownMenuTrigger data-gc="perfil.cartao.profile-editor-modal.dropdown-menu-trigger" asChild>
                          <button data-gc="perfil.cartao.profile-editor-modal.button"
                            type="button"
                            aria-label="Editar o cartão"
                            className="rounded-full bg-sobre-midia p-1.5 text-sobre-marca/80 backdrop-blur-sm transition hover:bg-sobre-midia hover:text-sobre-marca"
                          >
                            <Pencil data-gc="perfil.cartao.profile-editor-modal.pencil" size={15} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent data-gc="perfil.cartao.profile-editor-modal.dropdown-menu-content" align="end">
                          <DropdownMenuItem data-gc="perfil.cartao.profile-editor-modal.dropdown-menu-item"
                            onSelect={() => pickTrack.current?.click()}
                          >
                            Trocar a faixa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator data-gc="perfil.cartao.profile-editor-modal.dropdown-menu-separator" />
                          <DropdownMenuItem data-gc="perfil.cartao.profile-editor-modal.dropdown-menu-item--2" onSelect={() => setCharmIsOpen("decoration")}>
                            {t("perfil.editor.decoracao")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                    onBio={(value) => set("bio", value)}
                    onPronouns={(value) => set("pronouns", value)}
                  />
                </div>
              </div>

              <div data-gc="perfil.cartao.profile-editor-modal.div--6" className="mt-6">
                <p data-gc="perfil.cartao.profile-editor-modal.p" className="mb-1.5 text-xs font-semibold uppercase text-ink-muted">
                  No chat
                </p>
                <div data-gc="perfil.cartao.profile-editor-modal.div--7" className="flex gap-3 rounded-lg border border-line bg-surface-1 px-3 py-2.5">
                  <Avatar data-gc="perfil.cartao.profile-editor-modal.avatar"
                    id={user.id}
                    name={draft.displayName || user.displayName}
                    url={draft.avatarUrl}
                    size={40}
                    charms={profile}
                  />
                  <div data-gc="perfil.cartao.profile-editor-modal.div--8" className="min-w-0">
                    <p data-gc="perfil.cartao.profile-editor-modal.p--2" className="text-sm font-medium leading-tight">
                      <UserName data-gc="perfil.cartao.profile-editor-modal.user-name"
                        name={draft.displayName || user.displayName}
                        profile={profile}
                      />
                    </p>
                    <p data-gc="perfil.cartao.profile-editor-modal.p--3" className="text-sm text-ink-muted">
                      é assim que seu nome aparece numa conversa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside data-gc="perfil.cartao.profile-editor-modal.aside--2" className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
            <p data-gc="perfil.cartao.profile-editor-modal.p--4" className="mb-3 text-sm font-semibold">Atividade</p>
            <p data-gc="perfil.cartao.profile-editor-modal.p--5" className="text-sm text-ink-faint">
              Quando você entrar numa chamada, ela aparece aqui — e no seu
              cartão, pra quem abrir.
            </p>
          </aside>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          >
            <X data-gc="perfil.cartao.profile-editor-modal.x" size={20} />
          </DialogPrimitive.Close>

          <PickCharmModal data-gc="perfil.cartao.profile-editor-modal.pick-charm-modal"
            open={charmIsOpen === "decoration"}
            title={t("perfil.editor.decoracao")}
            legenda="Suas decorações"
            options={AVATAR_DECORATIONS}
            value={draft.decoration}
            onPick={(id) => set("decoration", id)}
            onClose={() => setCharmIsOpen(null)}
            sample={(id) => <Sample data-gc="perfil.cartao.profile-editor-modal.sample" family="decoration" id={id} />}
            preview={<ProfileCardVisual data-gc="perfil.cartao.profile-editor-modal.profile-card-visual--2" {...cardPreview} />}
          />

          {settingStatus && (
            <StatusModal data-gc="perfil.cartao.profile-editor-modal.status-modal.save-status"
              open
              user={user}
              profile={profile}
              onClose={() => setSettingStatus(false)}
              onSave={saveStatus}
              saving={updateProfile.isPending}
            />
          )}
        </DialogPrimitive.Content>

        <UnsavedBar data-gc="perfil.cartao.profile-editor-modal.unsaved-bar.discard"
          visible={dirty}
          saving={updateProfile.isPending}
          onDiscard={discard}
          onSave={save}
          text={t("perfil.editor.naoSalvo")}
          discardLabel={t("comum.redefinir")}
          floating
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
