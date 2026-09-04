import React, { useState } from "react";
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
import { useFindEmComum } from "~/@core/application/queries/user/use-find-em-comum";
import { corMaisAlta } from "~/lib/cosmeticos/cargo";
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
  <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
    <DialogContent
      className="max-w-lg overflow-hidden border-2 border-brand p-0"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div
        className="h-28 bg-cover bg-center"
        style={{
          backgroundColor: perfil.perfil?.bannerCor ?? avatarColor(perfil.id),
          ...(perfil.perfil?.bannerUrl
            ? { backgroundImage: `url(${perfil.perfil.bannerUrl})` }
            : null),
        }}
      />

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

        {abas.length > 1 && (
          <div className="mt-4 flex gap-4 border-b border-line">
            {abas.map((item) => (
              <button
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
          <p className="py-8 text-center text-sm text-ink-faint">{t("perfil.carregando")}</p>
        )}

        {aba === "amigos" && emComum.data && (
          <div className="mt-4 space-y-1">
            {emComum.data.amigos.map((amigo) => (
              <div key={amigo.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                <Avatar
                  id={amigo.id}
                  name={amigo.displayName}
                  url={amigo.avatarUrl}
                  size={32}
                  status={amigo.status}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {amigo.displayName}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">@{amigo.username}</span>
              </div>
            ))}
          </div>
        )}

        {aba === "servidores" && emComum.data && (
          <div className="mt-4 space-y-1">
            {emComum.data.servidores.map((servidor) => (
              <div key={servidor.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
                {servidor.iconUrl ? (
                  <img src={servidor.iconUrl} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold">
                    {servidor.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{servidor.name}</span>
              </div>
            ))}
          </div>
        )}

        {aba === "geral" && perfil.bio && (
          <Bloco titulo={t("perfil.sobre")}>
            <p className="whitespace-pre-wrap text-sm text-ink-muted">{perfil.bio}</p>
          </Bloco>
        )}

        {aba === "geral" && cargos.length > 0 && (
          <Bloco titulo={t("perfil.cargosTitulo")}>
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

        {aba === "geral" && (
          <Bloco titulo={t("perfil.membroDesde")}>
            <p className="text-sm text-ink-muted">
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
  <section className="mt-5">
    <h3 className="mb-1.5 text-sm font-bold text-ink">{titulo}</h3>
    {children}
  </section>
);
