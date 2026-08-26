import React, { useState, type ReactNode } from "react";
import { PlusCircle } from "lucide-react";
import { LIMITS } from "@gravae/shared";
import type {
  Emblema,
  EstiloDePerfil,
  PresenceStatus,
  Role,
  StatusPersonalizado,
} from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { PatenteAnimada } from "~/components/PatenteAnimada";
import { SeletorDeEtiqueta } from "~/components/profile/SeletorDeEtiqueta";
import { ServerTag } from "~/components/ServerTag";
import { UserName } from "~/components/UserName";
import {
  classeDoEnfeite,
  variaveisDoEnfeite,
  type EstiloCss,
} from "~/lib/cosmeticos/estilos";
import { avatarColor } from "~/lib/format";
import { cn } from "~/lib/utils";

interface ProfileCardVisualProps {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  status?: PresenceStatus;
  perfil?: EstiloDePerfil | null;
  etiquetaDoServidor?: {
    guildId: string;
    tag: string;
    tagIcon: string | null;
  } | null;
  statusPersonalizado?: StatusPersonalizado | null;
  corDoCargo?: string | null;
  bio?: string | null;
  createdAt?: string | null;
  mutualFriends?: number;
  mutualGuilds?: number;
  cargos?: Role[];
  emblemas?: Emblema[];
  acoesDoTopo?: ReactNode;
  children?: ReactNode;
  className?: string;
  editavel?: boolean;
  onEtiqueta?: (valor: string) => void;
  onEtiquetaDoServidor?: (guildId: string | null) => void;
  onStatus?: () => void;
}

export const ProfileCardVisual: React.FC<ProfileCardVisualProps> = ({
  id,
  displayName,
  username,
  avatarUrl,
  status,
  perfil,
  etiquetaDoServidor,
  statusPersonalizado,
  corDoCargo,
  bio,
  createdAt,
  mutualFriends = 0,
  mutualGuilds = 0,
  cargos = [],
  emblemas = [],
  acoesDoTopo,
  children,
  className,
  editavel = false,
  onEtiqueta,
  onEtiquetaDoServidor,
  onStatus,
}) => {
  const [editandoEtiqueta, setEditandoEtiqueta] = useState(false);

  const temDecoracao = Boolean(perfil?.decoracao && perfil.decoracao !== "nenhuma");
  const efeito = classeDoEnfeite("perfil", perfil?.efeito);
  const placa = classeDoEnfeite("placa", perfil?.placa);

  const tema: EstiloCss | undefined = perfil?.temaPrimario
    ? {
        background: perfil.temaSecundario
          ? `linear-gradient(160deg, ${perfil.temaPrimario}, ${perfil.temaSecundario})`
          : perfil.temaPrimario,
        "--gc-recorte": perfil.temaSecundario ?? perfil.temaPrimario,
      }
    : undefined;

  return (
    <div
      className={cn("overflow-hidden rounded-lg bg-surface-0", className)}
      style={tema}
    >
      <div
        className="relative aspect-[5/2] bg-cover bg-center"
        style={{
          backgroundColor: perfil?.bannerCor ?? avatarColor(id),
          ...(perfil?.bannerUrl
            ? { backgroundImage: `url(${perfil.bannerUrl})` }
            : null),
        }}
      >
        {acoesDoTopo}
      </div>

      <div className="relative px-4 pb-4 [--gc-recorte:var(--color-surface-0)]">
        {efeito && (
          <span
            aria-hidden
            className={cn("gc-perfil", efeito)}
            style={variaveisDoEnfeite({ animar: true, velocidade: "12s" })}
          />
        )}

        <div className="relative -mt-10 mb-3 flex items-start gap-3">
          <Avatar
            id={id}
            name={displayName}
            url={avatarUrl}
            size={72}
            status={status}
            enfeites={perfil}
            animar
            className={cn(
              "rounded-full",
              !temDecoracao && "ring-[6px] ring-surface-0",
            )}
          />

          {(statusPersonalizado || onStatus) && (
            <span className="relative mt-1 min-w-0">
              <span
                aria-hidden
                className="absolute -bottom-1 -left-2 size-2.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />
              <span
                aria-hidden
                className="absolute -bottom-3 -left-4 size-1.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />

              {onStatus ? (
                <button
                  onClick={onStatus}
                  className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-left text-sm text-ink-muted shadow-lg shadow-black/30 transition hover:bg-surface-4 hover:text-ink"
                >
                  {statusPersonalizado ? (
                    <>
                      {statusPersonalizado.emoji && (
                        <span>{statusPersonalizado.emoji}</span>
                      )}
                      <span className="min-w-0 truncate italic">
                        {statusPersonalizado.texto}
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">
                        Adicionar status
                      </span>
                    </>
                  )}
                </button>
              ) : (
                statusPersonalizado && (
                  <span className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-sm text-ink-muted shadow-lg shadow-black/30">
                    {statusPersonalizado.emoji && (
                      <span>{statusPersonalizado.emoji}</span>
                    )}
                    <span className="min-w-0 truncate italic">
                      {statusPersonalizado.texto}
                    </span>
                  </span>
                )
              )}
            </span>
          )}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "min-w-0 truncate text-lg font-bold leading-tight",
                placa && "gc-placa",
                placa,
              )}
            >
              <UserName
                nome={displayName}
                perfil={perfil}
                corDoCargo={corDoCargo}
                tamanho="md"
                animar
              />
            </p>
          </div>

          <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            <span>@{username}</span>

            {editavel ? (
              <>
                <span className="text-ink-faint">•</span>
                {editandoEtiqueta ? (
                  <input
                    autoFocus
                    value={perfil?.etiqueta ?? ""}
                    onChange={(e) => onEtiqueta?.(e.target.value)}
                    onBlur={() => setEditandoEtiqueta(false)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setEditandoEtiqueta(false)
                    }
                    maxLength={LIMITS.etiqueta}
                    placeholder="etiqueta"
                    aria-label="Sua etiqueta"
                    size={LIMITS.etiqueta}
                    className="w-16 rounded bg-surface-3 px-1.5 py-0 text-sm font-semibold text-ink outline-none ring-ink-faint/70 transition focus:ring-2"
                  />
                ) : (
                  <button
                    onClick={() => setEditandoEtiqueta(true)}
                    title="Clique para editar sua etiqueta"
                    className="rounded px-1 font-semibold text-ink transition hover:bg-surface-3"
                  >
                    {perfil?.etiqueta || (
                      <span className="text-ink-faint">etiqueta</span>
                    )}
                  </button>
                )}
              </>
            ) : (
              perfil?.etiqueta && (
                <>
                  <span className="text-ink-faint">•</span>
                  <span className="font-semibold text-ink">
                    {perfil.etiqueta}
                  </span>
                </>
              )
            )}

            {editavel ? (
              <SeletorDeEtiqueta
                atual={perfil?.tagGuildId}
                onEscolher={(guildId) => onEtiquetaDoServidor?.(guildId)}
              />
            ) : (
              <ServerTag etiqueta={etiquetaDoServidor} />
            )}

            {perfil?.patente && (
              <PatenteAnimada patente={perfil.patente} animar />
            )}

            {emblemas.map((emblema) => (
              <span
                key={emblema.id}
                title={emblema.nome}
                className="inline-flex items-center"
              >
                {emblema.emoji ? (
                  <span className="text-base leading-none">
                    {emblema.emoji}
                  </span>
                ) : emblema.iconUrl ? (
                  <img
                    src={emblema.iconUrl}
                    alt={emblema.nome}
                    className="size-4 object-contain"
                  />
                ) : null}
              </span>
            ))}
          </p>

          {(mutualGuilds > 0 || mutualFriends > 0) && (
            <p className="mt-2 text-xs text-ink-faint">
              {[
                mutualFriends > 0 &&
                  `${mutualFriends} amigo${mutualFriends > 1 ? "s" : ""} em comum`,
                mutualGuilds > 0 &&
                  `${mutualGuilds} servidor${mutualGuilds > 1 ? "es" : ""} em comum`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {bio && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="whitespace-pre-wrap text-sm text-ink-muted">
                {bio}
              </p>
            </>
          )}

          {cargos.length > 0 && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="mb-1.5 text-xs font-semibold uppercase text-ink-faint">
                {cargos.length === 1 ? "Cargo" : `Cargos — ${cargos.length}`}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {cargos.map((cargo) => (
                  <span
                    key={cargo.id}
                    className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-0.5 text-xs font-medium"
                  >
                    {cargo.iconEmoji ? (
                      <span>{cargo.iconEmoji}</span>
                    ) : cargo.iconUrl ? (
                      <img
                        src={cargo.iconUrl}
                        alt=""
                        className="size-3.5 rounded-sm object-cover"
                      />
                    ) : (
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            cargo.color ?? "var(--color-ink-faint)",
                        }}
                      />
                    )}
                    {cargo.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {createdAt && (
            <>
              <div className="my-3 h-px bg-line" />
              <p className="text-xs font-semibold uppercase text-ink-faint">
                Membro desde
              </p>
              <p className="text-sm text-ink-muted">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                  new Date(createdAt),
                )}
              </p>
            </>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
