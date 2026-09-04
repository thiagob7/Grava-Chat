import React, { useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";
import type { StatusPersonalizado } from "@gravae/shared";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useEnvioDeImagemDePerfil } from "~/hooks/use-envio-de-imagem-de-perfil";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { StatusModal } from "~/components/profile/StatusModal";
import { EscolherEnfeiteModal } from "~/components/profile/EscolherEnfeiteModal";
import { DECORACOES_DE_AVATAR } from "~/lib/cosmeticos/catalogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UserName } from "~/components/UserName";
import { UnsavedBar } from "~/components/ui/unsaved-bar";
import { Amostra, EnfeitesAba } from "~/components/user-settings/perfil/EnfeitesAba";
import { IdentidadeAba } from "~/components/user-settings/perfil/IdentidadeAba";
import {
  doUsuario,
  paraPerfil,
} from "~/components/user-settings/perfil/rascunho";
import { useRascunho } from "~/hooks/use-rascunho";
import { useTranslation } from "~/traducao";

export const ProfileEditorModal: React.FC<{
  open: boolean;
  user: SelfUserModel;
  onClose: () => void;
}> = ({ open, user, onClose }) => {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const [definindoStatus, setDefinindoStatus] = useState(false);
  const escolherFoto = useRef<HTMLInputElement>(null);
  const escolherFaixa = useRef<HTMLInputElement>(null);
  const [enfeiteAberto, setEnfeiteAberto] = useState<"decoracao" | null>(null);

  const salvo = useMemo(() => doUsuario(user), [user]);
  const { rascunho, definir, descartar, sujo } = useRascunho(salvo);
  const perfil = paraPerfil(rascunho);
  const { enviar } = useEnvioDeImagemDePerfil((campo, url) => definir(campo, url));

  const previaDoCartao = {
    id: user.id,
    displayName: rascunho.displayName || user.displayName,
    username: user.username,
    avatarUrl: rascunho.avatarUrl,
    status: user.status,
    perfil,
    statusPersonalizado: user.statusPersonalizado,
    bio: rascunho.bio || null,
    createdAt: user.createdAt,
  };

  const salvar = () => {
    const displayName = rascunho.displayName.trim();
    const bio = rascunho.bio.trim() || null;

    void updateProfile
      .mutateAsync({
        ...(displayName !== salvo.displayName ? { displayName } : {}),
        ...(bio !== (salvo.bio || null) ? { bio } : {}),
        ...(rascunho.avatarUrl !== salvo.avatarUrl ? { avatarUrl: rascunho.avatarUrl } : {}),
        ...(JSON.stringify(perfil) !== JSON.stringify(paraPerfil(salvo)) ? { perfil } : {}),
      })
      .then(() => descartar())
      .catch(() => null);
  };

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
          className="regiao-sem-arrasto fixed inset-0 z-50 m-auto flex h-[78vh] w-full max-w-6xl overflow-hidden rounded-lg bg-surface-2 shadow-2xl outline-none"
          aria-label={t("perfil.editar")}
        >
          <DialogPrimitive.Title className="sr-only">
            {t("perfil.editar")}
          </DialogPrimitive.Title>

          <aside className="w-80 shrink-0 overflow-y-auto bg-surface-1 p-5">
            <h2 className="mb-4 text-sm font-semibold">{t("perfil.editor.principal")}</h2>

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
            <input
              ref={escolherFoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void enviar(e, "avatarUrl")}
            />
            <input
              ref={escolherFaixa}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void enviar(e, "bannerUrl")}
            />

            <div className="mx-auto w-96">
              <div>
                <div>
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
                    onEditarFoto={() => escolherFoto.current?.click()}
                    menuDaFaixa={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Editar o cartão"
                            className="rounded-full bg-black/45 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/65 hover:text-white"
                          >
                            <Pencil size={15} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => escolherFaixa.current?.click()}
                          >
                            Trocar a faixa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEnfeiteAberto("decoracao")}>
                            {t("perfil.editor.decoracao")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                    onBio={(valor) => definir("bio", valor)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-1.5 text-xs font-semibold uppercase text-ink-muted">
                  No chat
                </p>
                <div className="flex gap-3 rounded-lg border border-line bg-surface-1 px-3 py-2.5">
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

          <EscolherEnfeiteModal
            open={enfeiteAberto === "decoracao"}
            titulo={t("perfil.editor.decoracao")}
            legenda="Suas decorações"
            opcoes={DECORACOES_DE_AVATAR}
            valor={rascunho.decoracao}
            onEscolher={(id) => definir("decoracao", id)}
            onClose={() => setEnfeiteAberto(null)}
            amostra={(id) => <Amostra familia="decoracao" id={id} />}
            previa={<ProfileCardVisual {...previaDoCartao} />}
          />

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
          texto={t("perfil.editor.naoSalvo")}
          acaoDescartar={t("comum.redefinir")}
          flutuante
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
