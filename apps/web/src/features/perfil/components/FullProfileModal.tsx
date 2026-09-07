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
import { flx, flxCls, type Lugares } from "~/lib/compat-de-tema";

interface FullProfileModalProps {
  open: boolean;
  perfil: ProfileModel;
  cargos?: Role[];
  onClose: () => void;
}

type Aba = "geral" | "amigos" | "servidores";

/*
  A máscara que recorta o círculo do avatar na faixa.

  É um `<mask>` SVG com um `<circle>`, e não um `mask-image` de gradiente, por
  um motivo só: o tema que quer a faixa inteira apaga o círculo com
  `display: none` — e para isso o círculo precisa ser um elemento. A faixa
  aplica a máscara por `mask: url(#id)`; sem o círculo, sobra o retângulo
  branco e nada é recortado.
*/
const MascaraDaFaixa: React.FC<{ id: string; lugar: Lugares; cx: number; raio: number }> = ({
  id,
  lugar,
  cx,
  raio,
}) => (
  <svg data-gc="perfil.full-profile-modal.svg" aria-hidden className={cn(flxCls(lugar), "absolute size-0")}>
    <mask data-gc="perfil.full-profile-modal.mask" id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
      <rect data-gc="perfil.full-profile-modal.rect" width="100%" height="100%" fill="white" />
      <circle data-gc="perfil.full-profile-modal.circle" cx={cx} cy="100%" r={raio} fill="black" />
    </mask>
  </svg>
);

export const FullProfileModal: React.FC<FullProfileModalProps> = ({
  open,
  perfil,
  cargos = [],
  onClose,
}) => {
  const { t } = useTranslation();
  const idDaMascara = React.useId();
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
      className={cn("max-w-lg overflow-hidden border-2 border-brand p-0", flxCls("perfilCompleto"), flxCls("conteudoDoPerfilCompleto"))}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <MascaraDaFaixa data-gc="perfil.full-profile-modal.mascara-da-faixa" id={idDaMascara} lugar="mascaraDaFaixaNoPerfil" cx={72} raio={56} />
      <div data-gc="perfil.full-profile-modal.div"
        className="h-28 bg-cover bg-center"
        style={{
          mask: `url(#${idDaMascara})`,
          WebkitMask: `url(#${idDaMascara})`,
          backgroundColor: perfil.perfil?.bannerCor ?? avatarColor(perfil.id),
          ...(perfil.perfil?.bannerUrl
            ? { backgroundImage: `url(${perfil.perfil.bannerUrl})` }
            : null),
        }}
      />

      <div data-gc="perfil.full-profile-modal.div--2" {...flx("conteudoDoPerfil", "px-6 pb-6")}>
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
          <div data-gc="perfil.full-profile-modal.div--4" {...flx("molduraDasAbas", "mt-4 flex gap-4 border-b border-line")}>
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

        {aba === "geral" && perfil.pronomes && (
          <p data-gc="perfil.full-profile-modal.p--2"
            className={cn("text-sm text-ink-faint", flxCls("pronomesNoPerfil"))}
          >
            {perfil.pronomes}
          </p>
        )}

        {aba === "geral" && perfil.bio && (
          <Bloco data-gc="perfil.full-profile-modal.bloco" titulo={t("perfil.sobre")}>
            <p data-gc="perfil.full-profile-modal.p--3"
              className={cn("whitespace-pre-wrap text-sm text-ink-muted", flxCls("bioDoPerfil"))}
            >
              {perfil.bio}
            </p>
          </Bloco>
        )}

        {aba === "geral" && cargos.length > 0 && (
          <Bloco data-gc="perfil.full-profile-modal.bloco--2" titulo={t("perfil.cargosTitulo")}>
            <div data-gc="perfil.full-profile-modal.div--9" className="flex flex-wrap gap-1.5">
              {cargos.map((cargo) => (
                <span data-gc="perfil.full-profile-modal.span--5"
                  key={cargo.id}
                  className={cn(
                    flxCls("seloDeCargo"),
                    "flex items-center gap-1.5 rounded bg-surface-1 px-2 py-1 text-xs",
                  )}
                >
                  <span data-gc="perfil.full-profile-modal.span--6"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: cargo.color || "#99aab5" }}
                  />
                  <span data-gc="perfil.full-profile-modal.span--7" className={flxCls("nomeDoCargo")}>{cargo.name}</span>
                </span>
              ))}
            </div>
          </Bloco>
        )}

        {aba === "geral" && (
          <Bloco data-gc="perfil.full-profile-modal.bloco--3" titulo={t("perfil.membroDesde")}>
            <p data-gc="perfil.full-profile-modal.p--4" className="text-sm text-ink-muted">
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
