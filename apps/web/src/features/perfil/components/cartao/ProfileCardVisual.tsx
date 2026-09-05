import React, { useState, type ReactNode } from "react";
import { Camera, Pencil, PlusCircle, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";
import type {
  Emblema,
  EstiloDePerfil,
  PresenceStatus,
  Role,
  StatusPersonalizado,
} from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { PatenteAnimada } from "~/features/perfil/components/PatenteAnimada";
import { SeletorDeCargos } from "~/features/perfil/components/cartao/SeletorDeCargos";
import { SeletorDeEtiqueta } from "~/features/perfil/components/cartao/SeletorDeEtiqueta";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import {
  classeDoEnfeite,
  variaveisDoEnfeite,
  type EstiloCss,
} from "~/features/perfil/lib/estilos";
import { avatarColor } from "~/lib/format";
import { cn } from "~/lib/utils";
import { idiomaAtual, useTranslation } from "~/traducao";

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
  cargosDisponiveis?: Role[];
  onAlternarCargo?: (roleId: string) => void;
  salvandoCargos?: boolean;
  emblemas?: Emblema[];
  acoesDoTopo?: ReactNode;
  acoes?: ReactNode;
  children?: ReactNode;
  className?: string;
  editavel?: boolean;
  /// Clicar no nome ou no @usuário abre o perfil inteiro, como no Fluxer.
  /// Sem isto os dois seguem sendo texto — é o que vale no próprio cartão.
  onAbrirPerfil?: () => void;
  onEtiqueta?: (valor: string) => void;
  onEtiquetaDoServidor?: (guildId: string | null) => void;
  onStatus?: () => void;
  onEditarFaixa?: () => void;
  menuDaFaixa?: ReactNode;
  onEditarFoto?: () => void;
  onBio?: (valor: string) => void;
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
  cargosDisponiveis = [],
  onAlternarCargo,
  salvandoCargos = false,
  emblemas = [],
  acoesDoTopo,
  acoes,
  children,
  className,
  editavel = false,
  onAbrirPerfil,
  onEtiqueta,
  onEtiquetaDoServidor,
  onStatus,
  onEditarFaixa,
  menuDaFaixa,
  onEditarFoto,
  onBio,
}) => {
  const { t } = useTranslation();
  const [editandoEtiqueta, setEditandoEtiqueta] = useState(false);
  const [editandoBio, setEditandoBio] = useState(false);

  const gerenciaCargos = Boolean(onAlternarCargo);
  const cargosGeriveis = new Set(cargosDisponiveis.map((cargo) => cargo.id));

  const temDecoracao = Boolean(perfil?.decoracao && perfil.decoracao !== "nenhuma");
  const molduraDoCartao = classeDoEnfeite("moldura", perfil?.moldura);
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
      className={cn(
        "group/cartao relative overflow-hidden rounded-lg bg-surface-0",
        className,
      )}
      style={tema}
    >
      {molduraDoCartao && (
        <span
          aria-hidden
          className={cn("gc-camada--cartao", molduraDoCartao)}
          style={variaveisDoEnfeite({ animar: true, velocidade: "10s" })}
        />
      )}
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

        {menuDaFaixa && (
          <div className="absolute right-3 top-3">{menuDaFaixa}</div>
        )}

        {!menuDaFaixa && onEditarFaixa && (
          <button
            type="button"
            onClick={onEditarFaixa}
            aria-label={t("perfil.cartao.trocarFaixa")}
            title={t("perfil.cartao.trocarFaixaCurto")}
            className="absolute right-3 top-3 rounded-full bg-black/45 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/65 hover:text-white"
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      <div className="relative px-5 pb-5 [--gc-recorte:var(--color-surface-0)]">
        {efeito && (
          <span
            aria-hidden
            className={cn("gc-perfil", efeito)}
            style={variaveisDoEnfeite({ animar: true, velocidade: "12s" })}
          />
        )}

        <div className="relative -mt-12 mb-3 flex items-start gap-3">
          <span className="relative shrink-0">
          <Avatar
            id={id}
            name={displayName}
            url={avatarUrl}
            size={88}
            status={status}
            enfeites={perfil}
            animar
            className={cn(
              "rounded-full",
              !temDecoracao && "ring-[6px] ring-surface-0",
            )}
          />

          {onEditarFoto && (
            <button
              type="button"
              onClick={onEditarFoto}
              aria-label={t("perfil.cartao.trocarFoto")}
              title={t("perfil.cartao.trocarFotoCurto")}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
            >
              <Camera size={22} />
            </button>
          )}
          </span>

          {(statusPersonalizado || onStatus) && (
            <span className="relative ml-2 mt-8 min-w-0">
              <span
                aria-hidden
                className="absolute -left-3 top-0 size-2.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />
              <span
                aria-hidden
                className="absolute -left-5 -top-2.5 size-1.5 rounded-full bg-surface-3 shadow-md shadow-black/40"
              />

              {onStatus ? (
                <button
                  onClick={onStatus}
                  className="flex max-w-52 items-center gap-2 rounded-full bg-surface-3 px-4 py-2.5 text-left text-sm text-ink-muted shadow-lg shadow-black/30 transition hover:bg-surface-4 hover:text-ink"
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
                      <span className="truncate italic">{t("perfil.cartao.adicionarStatus")}</span>
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
                "min-w-0 truncate text-2xl font-bold leading-tight",
                placa && "gc-placa",
                placa,
              )}
            >
              {onAbrirPerfil ? (
                <button
                  type="button"
                  onClick={onAbrirPerfil}
                  className="min-w-0 max-w-full truncate text-left hover:underline"
                >
                  <UserName
                    nome={displayName}
                    perfil={perfil}
                    corDoCargo={corDoCargo}
                    tamanho="md"
                    animar
                  />
                </button>
              ) : (
                <UserName
                  nome={displayName}
                  perfil={perfil}
                  corDoCargo={corDoCargo}
                  tamanho="md"
                  animar
                />
              )}
            </p>
          </div>

          <p className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
            {onAbrirPerfil ? (
              <button type="button" onClick={onAbrirPerfil} className="hover:underline">
                @{username}
              </button>
            ) : (
              <span>@{username}</span>
            )}

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
                    aria-label={t("perfil.cartao.suaEtiqueta")}
                    size={LIMITS.etiqueta}
                    className="w-16 rounded bg-surface-3 px-1.5 py-0 text-sm font-semibold text-ink outline-none ring-ink-faint/70 transition focus:ring-2"
                  />
                ) : (
                  <button
                    onClick={() => setEditandoEtiqueta(true)}
                    title={t("perfil.cartao.editarEtiqueta")}
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

          {acoes && <div className="mt-3 flex items-center gap-2">{acoes}</div>}

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

          {onBio ? (
            editandoBio ? (
              <div className="mt-4">
                <textarea
                  autoFocus
                  rows={3}
                  value={bio ?? ""}
                  onChange={(e) => onBio(e.target.value)}
                  onBlur={() => setEditandoBio(false)}
                  maxLength={LIMITS.bio}
                  placeholder={t("perfil.cartao.conteAlgo")}
                  className="w-full resize-none rounded-lg border border-brand/70 bg-surface-1 px-3 py-2 text-sm text-ink outline-none ring-2 ring-brand/25 placeholder:text-ink-faint"
                />
                <p className="mt-1 text-right text-xs text-ink-faint">
                  {(bio ?? "").length} / {LIMITS.bio}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditandoBio(true)}
                className="mt-4 block w-full rounded-lg px-1 py-0.5 text-left text-sm transition hover:bg-surface-3/60"
              >
                {bio ? (
                  <span className="whitespace-pre-wrap text-ink">{bio}</span>
                ) : (
                  <span className="italic text-ink-faint">
                    {t("perfil.cartao.adicionarDescricao")}
                  </span>
                )}
              </button>
            )
          ) : (
            bio && <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{bio}</p>
          )}

          {(cargos.length > 0 || gerenciaCargos) && (
            <>
              <p className="mb-2 mt-5 text-sm font-bold text-ink">
                {cargos.length === 0
                  ? t("perfil.cartao.cargos")
                  : cargos.length === 1
                    ? t("perfil.cartao.cargo")
                    : t("perfil.cartao.cargosCom", { quantidade: cargos.length })}
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
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

                    {onAlternarCargo && cargosGeriveis.has(cargo.id) && (
                      <button
                        type="button"
                        onClick={() => onAlternarCargo(cargo.id)}
                        disabled={salvandoCargos}
                        aria-label={t("perfil.cartao.tirarCargo", { cargo: cargo.name })}
                        title={t("perfil.cartao.tirarCargo", { cargo: cargo.name })}
                        className="-mr-1 rounded-full p-0.5 text-ink-faint transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}

                {onAlternarCargo && (
                  <SeletorDeCargos
                    disponiveis={cargosDisponiveis}
                    atuais={cargos.map((cargo) => cargo.id)}
                    onAlternar={onAlternarCargo}
                    desabilitado={salvandoCargos}
                  />
                )}
              </div>
            </>
          )}

          {createdAt && (
            <>
              <p className="mb-1 mt-5 text-sm font-bold text-ink">{t("perfil.membroDesde")}</p>
              <p className="text-sm text-ink-muted">
                {new Intl.DateTimeFormat(idiomaAtual(), { dateStyle: "long" }).format(
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
