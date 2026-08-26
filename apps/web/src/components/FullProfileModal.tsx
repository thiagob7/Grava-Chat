import React from "react";
import type { Role } from "@gravae/shared";

import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { Avatar } from "~/components/Avatar";
import { UserName } from "~/components/UserName";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { corMaisAlta } from "~/lib/cosmeticos/cargo";
import { avatarColor } from "~/lib/format";

interface FullProfileModalProps {
  open: boolean;
  perfil: ProfileModel;
  cargos?: Role[];
  onClose: () => void;
}

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  open,
  perfil,
  cargos = [],
  onClose,
}) => (
  <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
    <DialogContent className="max-w-lg overflow-hidden p-0">
      <div className="h-24" style={{ backgroundColor: avatarColor(perfil.id) }} />

      <div className="px-6 pb-6">
        <div className="-mt-14 mb-4">
          <Avatar
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

        <DialogTitle className="text-2xl font-bold leading-tight">
          <UserName
            nome={perfil.displayName}
            perfil={perfil.perfil}
            corDoCargo={corMaisAlta(cargos)}
            tamanho="md"
            animar
            fundo="#27272a"
          />
        </DialogTitle>
        <DialogDescription className="text-base">@{perfil.username}</DialogDescription>

        {(perfil.mutualFriends > 0 || perfil.mutualGuilds > 0) && (
          <p className="mt-2 text-sm text-ink-faint">
            {[
              perfil.mutualFriends > 0 &&
                `${perfil.mutualFriends} amigo${perfil.mutualFriends > 1 ? "s" : ""} em comum`,
              perfil.mutualGuilds > 0 &&
                `${perfil.mutualGuilds} servidor${perfil.mutualGuilds > 1 ? "es" : ""} em comum`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {perfil.bio && (
          <Bloco titulo="Sobre">
            <p className="whitespace-pre-wrap text-sm text-ink-muted">{perfil.bio}</p>
          </Bloco>
        )}

        {cargos.length > 0 && (
          <Bloco titulo="Cargos">
            <div className="flex flex-wrap gap-1.5">
              {cargos.map((cargo) => (
                <span
                  key={cargo.id}
                  className="flex items-center gap-1.5 rounded bg-surface-1 px-2 py-1 text-xs"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: cargo.color || "#99aab5" }}
                  />
                  {cargo.name}
                </span>
              ))}
            </div>
          </Bloco>
        )}

        <Bloco titulo="Membro desde">
          <p className="text-sm text-ink-muted">
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
              new Date(perfil.createdAt),
            )}
          </p>
        </Bloco>
      </div>
    </DialogContent>
  </Dialog>
);

const Bloco: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="mt-5">
    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{titulo}</h3>
    {children}
  </section>
);
