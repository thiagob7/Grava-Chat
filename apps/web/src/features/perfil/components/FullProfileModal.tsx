import React, { useState } from "react";
import type { Role } from "@gravae/shared";

import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { useFindEmComum } from "~/@core/application/queries/user/use-find-em-comum";
import { corMaisAlta } from "~/features/perfil/lib/cargo";
import { cn } from "~/lib/utils";
import { avatarColor } from "~/lib/format";
import { idiomaAtual, useTranslation } from "~/traducao";

interface FullProfileModalProps {
  open: boolean;
  perfil: ProfileModel;
  cargos?: Role[];
  onClose: () => void;
}

type Aba = "geral" | "amigos" | "servidores";

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  open,
  perfil,
  cargos = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const [aba, setAba] = useState<Aba>("geral");
  const emComum = useFindEmComum(perfil.id, aba !== "geral");

  const abas: { id: Aba; rotulo: string }[] = [
    { id: "geral" as const, rotulo: t("perfil.visaoGeral") },
    ...(perfil.mutualFriends > 0
      ? [{ id: "amigos" as const, rotulo: t("perfil.amigosEmComum", { quantidade: perfil.mutualFriends }) }]
      : []),
    ...(perfil.mutualGuilds > 0
      ? [{ id: "servidores" as const, rotulo: t("perfil.servidoresEmComum", { quantidade: perfil.mutualGuilds }) }]
      : []),
  ];

  return (
  <Dialog data-gc="perfil.full-profile-modal.dialog" open={open} onOpenChange={(aberto) => !aberto && onClose()}>
    <DialogContent data-gc="perfil.full-profile-modal.dialog-content"
      className="max-w-lg overflow-hidden border-2 border-brand p-0"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div data-gc="perfil.full-profile-modal.div"
        className="h-28 bg-cover bg-center"
        style={{
          backgroundColor: perfil.perfil?.bannerCor ?? avatarColor(perfil.id),
          ...(perfil.perfil?.bannerUrl
            ? { backgroundImage: `url(${perfil.perfil.bannerUrl})` }
            : null),
        }}
      />

      <div data-gc="perfil.full-profile-modal.div--2" className="px-6 pb-6">
        <div data-gc="perfil.full-profile-modal.div--3" className="-mt-14 mb-4">
          <Avatar data-gc="perfil.full-profile-modal.avatar"
            id={perfil.id}
            name={perfil.displayName}
            url={perfil.avatarUrl}
            size={96}
            status={perfil.status}
            enfeites={perfil.perfil}
            animar
            className="rounded-full ring-[6px] ring-surface-3"
          />
        </div>

        <DialogTitle data-gc="perfil.full-profile-modal.dialog-title" className="text-2xl font-bold leading-tight">
          <UserName data-gc="perfil.full-profile-modal.user-name"
            nome={perfil.displayName}
            perfil={perfil.perfil}
            corDoCargo={corMaisAlta(cargos)}
            tamanho="md"
            animar
            fundo="#27272a"
          />
        </DialogTitle>
        <DialogDescription data-gc="perfil.full-profile-modal.dialog-description" className="text-base">@{perfil.username}</DialogDescription>

        {abas.length > 1 && (
          <div data-gc="perfil.full-profile-modal.div--4" className="mt-4 flex gap-4 border-b border-line">
            {abas.map((item) => (
              <button data-gc="perfil.full-profile-modal.button"
                key={item.id}
                onClick={() => setAba(item.id)}
                aria-current={aba === item.id}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-sm transition",
                  aba === item.id
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {item.rotulo}
              </button>
            ))}
          </div>
        )}

        {aba !== "geral" && emComum.isPending && (
          <p data-gc="perfil.full-profile-modal.p" className="py-8 text-center text-sm text-ink-faint">{t("perfil.carregando")}</p>
        )}

        {aba === "amigos" && emComum.data && (
          <div data-gc="perfil.full-profile-modal.div--5" className="mt-4 space-y-1">
            {emComum.data.amigos.map((amigo) => (
              <div data-gc="perfil.full-profile-modal.div--6" key={amigo.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                <Avatar data-gc="perfil.full-profile-modal.avatar--2"
                  id={amigo.id}
                  name={amigo.displayName}
                  url={amigo.avatarUrl}
                  size={32}
                  status={amigo.status}
                />
                <span data-gc="perfil.full-profile-modal.span" className="min-w-0 flex-1 truncate text-sm font-medium">
                  {amigo.displayName}
                </span>
                <span data-gc="perfil.full-profile-modal.span--2" className="shrink-0 text-xs text-ink-faint">@{amigo.username}</span>
              </div>
            ))}
          </div>
        )}

        {aba === "servidores" && emComum.data && (
          <div data-gc="perfil.full-profile-modal.div--7" className="mt-4 space-y-1">
            {emComum.data.servidores.map((servidor) => (
              <div data-gc="perfil.full-profile-modal.div--8" key={servidor.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                {servidor.iconUrl ? (
                  <img data-gc="perfil.full-profile-modal.img" src={servidor.iconUrl} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <span data-gc="perfil.full-profile-modal.span--3" className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold">
                    {servidor.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span data-gc="perfil.full-profile-modal.span--4" className="min-w-0 flex-1 truncate text-sm font-medium">{servidor.name}</span>
              </div>
            ))}
          </div>
        )}

        {aba === "geral" && perfil.bio && (
          <Bloco data-gc="perfil.full-profile-modal.bloco" titulo={t("perfil.sobre")}>
            <p data-gc="perfil.full-profile-modal.p--2" className="whitespace-pre-wrap text-sm text-ink-muted">{perfil.bio}</p>
          </Bloco>
        )}

        {aba === "geral" && cargos.length > 0 && (
          <Bloco data-gc="perfil.full-profile-modal.bloco--2" titulo={t("perfil.cargosTitulo")}>
            <div data-gc="perfil.full-profile-modal.div--9" className="flex flex-wrap gap-1.5">
              {cargos.map((cargo) => (
                <span data-gc="perfil.full-profile-modal.span--5"
                  key={cargo.id}
                  className="flex items-center gap-1.5 rounded bg-surface-1 px-2 py-1 text-xs"
                >
                  <span data-gc="perfil.full-profile-modal.span--6"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: cargo.color || "#99aab5" }}
                  />
                  {cargo.name}
                </span>
              ))}
            </div>
          </Bloco>
        )}

        {aba === "geral" && (
          <Bloco data-gc="perfil.full-profile-modal.bloco--3" titulo={t("perfil.membroDesde")}>
            <p data-gc="perfil.full-profile-modal.p--3" className="text-sm text-ink-muted">
              {new Intl.DateTimeFormat(idiomaAtual(), { dateStyle: "long" }).format(
                new Date(perfil.createdAt),
              )}
            </p>
          </Bloco>
        )}
      </div>
    </DialogContent>
  </Dialog>
  );
};

const Bloco: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section data-gc="perfil.full-profile-modal.section" className="mt-5">
    <h3 data-gc="perfil.full-profile-modal.h3" className="mb-1.5 text-sm font-bold text-ink">{titulo}</h3>
    {children}
  </section>
);
