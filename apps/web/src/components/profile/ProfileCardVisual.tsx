import React, { useState, type ReactNode } from "react";
import { Camera, Pencil, PlusCircle } from "lucide-react";
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
  /// Linha compacta logo abaixo do @username, como no Discord: [Mensagem] [⋯].
  /// Diferente de `children`, que cai no rodape do cartao.
  acoes?: ReactNode;
  children?: ReactNode;
  className?: string;
  editavel?: boolean;
  onEtiqueta?: (valor: string) => void;
  onEtiquetaDoServidor?: (guildId: string | null) => void;
  onStatus?: () => void;
  /// Edicao pelo proprio cartao, como no Discord: lapis na faixa e camera
  /// sobre o avatar. So aparecem quando o pai passa o callback.
  onEditarFaixa?: () => void;
  /// Quando o pai quer um menu no lugar do botao simples da faixa: ele manda
  /// o proprio gatilho (um DropdownMenu), e o cartao so o posiciona.
  menuDaFaixa?: ReactNode;
  onEditarFoto?: () => void;
  /// Edicao da descricao no proprio cartao: clicou, virou campo.
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
  emblemas = [],
  acoesDoTopo,
  acoes,
  children,
  className,
  editavel = false,
  onEtiqueta,
  onEtiquetaDoServidor,
  onStatus,
  onEditarFaixa,
  menuDaFaixa,
  onEditarFoto,
  onBio,
}) => {
  const [editandoEtiqueta, setEditandoEtiqueta] = useState(false);
  const [editandoBio, setEditandoBio] = useState(false);

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
      {/*
        A moldura emoldura o cartao inteiro — o retrato fica com a decoracao.
        Camada por cima de tudo, sem borda: borda empurraria o conteudo pra
        dentro e mudaria o layout a cada troca de enfeite.
      */}
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
            aria-label="Trocar a faixa do cartão"
            title="Trocar a faixa"
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
              aria-label="Trocar a foto de perfil"
              title="Trocar a foto"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
            >
              <Camera size={22} />
            </button>
          )}
          </span>

          {/*
            Balão de pensamento: as duas bolinhas sobem pra cima-esquerda
            saindo dele, como no Discord. O ml-2 é pra não encostar em
            decoração de avatar, que vaza pra fora dos 72px do retrato.
          */}
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
                      <span className="truncate italic">Adicionar status</span>
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

          {/*
            O Discord separa as secoes do cartao por espaco, nao por regua —
            e o que da a ele aquele ar de painel em vez de ficha. As linhas
            divisorias que existiam aqui picotavam o cartao em blocos.
          */}
          {onBio ? (
            /*
              No cartao do dono, a descricao e o proprio campo: clicou, virou
              textarea com contador — o mesmo gesto do Discord. Fora do modo de
              edicao ela continua sendo so texto.
            */
            editandoBio ? (
              <div className="mt-4">
                <textarea
                  autoFocus
                  rows={3}
                  value={bio ?? ""}
                  onChange={(e) => onBio(e.target.value)}
                  onBlur={() => setEditandoBio(false)}
                  maxLength={LIMITS.bio}
                  placeholder="Conte algo sobre você"
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
                    Clique para adicionar uma descrição
                  </span>
                )}
              </button>
            )
          ) : (
            bio && <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{bio}</p>
          )}

          {cargos.length > 0 && (
            <>
              <p className="mb-1.5 mt-4 text-xs text-ink-faint">
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
              <p className="mt-4 text-xs text-ink-faint">Membro desde</p>
              <p className="text-sm text-ink">
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
