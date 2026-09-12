import React, { useState, type ReactNode } from "react";
import { Camera, NotebookPen, Pencil, PlusCircle, X } from "lucide-react";
import { LIMITS } from "@gravae/shared";
import type {
  Badge,
  ProfileStyle,
  PresenceStatus,
  Role,
  CustomStatus,
} from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { RankAnimated } from "~/features/perfil/components/PatenteAnimada";
import { RolesPicker } from "~/features/perfil/components/cartao/SeletorDeCargos";
import { TagPicker } from "~/features/perfil/components/cartao/SeletorDeEtiqueta";
import { ServerTag } from "~/features/perfil/components/ServerTag";
import { UserName } from "~/features/perfil/components/UserName";
import {
  charmClass,
  charmVariables,
  type StyleCss,
} from "~/features/perfil/lib/estilos";
import { avatarColor } from "~/lib/format";
import { cn } from "~/lib/utils";
import { Tooltip } from "~/components/ui/tooltip";
import { currentLanguage, useTranslation } from "~/traducao";
import { flx, flxCls, type Places } from "~/lib/compat-de-tema";

interface ProfileCardVisualProps {
  id: string;
  displayName: string;
  username: string;
  isBot?: boolean;
  isSystem?: boolean;
  avatarUrl: string | null;
  status?: PresenceStatus;
  profile?: ProfileStyle | null;
  serverTag?: {
    guildId: string;
    tag: string;
    tagIcon: string | null;
  } | null;
  customStatus?: CustomStatus | null;
  roleColor?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  onPronouns?: (value: string) => void;
  createdAt?: string | null;
  joinedAt?: string | null;
  serverName?: string | null;
  mutualFriends?: number;
  mutualGuilds?: number;
  roleList?: Role[];
  availableRoles?: Role[];
  onToggleRole?: (roleId: string) => void;
  savingRoles?: boolean;
  badges?: Badge[];
  topActions?: ReactNode;
  actions?: ReactNode;
  downActions?: ReactNode;
  children?: ReactNode;
  className?: string;
  detailed?: boolean;
  editable?: boolean;
  onOpenProfile?: () => void;
  onIrForNote?: () => void;
  onTag?: (value: string) => void;
  onServerTag?: (guildId: string | null) => void;
  onStatus?: () => void;
  onEditTrack?: () => void;
  trackMenu?: ReactNode;
  onEditPhoto?: () => void;
  onBio?: (value: string) => void;
}

const TrackMask: React.FC<{ id: string; place: Places; cx: number; radius: number }> = ({
  id,
  place,
  cx,
  radius,
}) => (
  <svg data-gc="perfil.cartao.profile-card-visual.svg" aria-hidden className={cn(flxCls(place), "absolute size-0")}>
    <mask data-gc="perfil.cartao.profile-card-visual.mask" id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
      <rect data-gc="perfil.cartao.profile-card-visual.rect" width="100%" height="100%" fill="white" />
      <circle data-gc="perfil.cartao.profile-card-visual.circle" cx={cx} cy="100%" r={radius} fill="black" />
    </mask>
  </svg>
);

export const ProfileCardVisual: React.FC<ProfileCardVisualProps> = ({
  id,
  displayName,
  username,
  isBot = false,
  isSystem = false,
  avatarUrl,
  status,
  profile,
  serverTag,
  customStatus,
  roleColor,
  bio,
  pronouns,
  onPronouns,
  createdAt,
  joinedAt,
  serverName,
  mutualFriends = 0,
  mutualGuilds = 0,
  roleList = [],
  availableRoles = [],
  onToggleRole,
  savingRoles = false,
  badges = [],
  topActions,
  actions,
  downActions,
  children,
  className,
  detailed = false,
  editable = false,
  onOpenProfile,
  onIrForNote,
  onTag,
  onServerTag,
  onStatus,
  onEditTrack,
  trackMenu,
  onEditPhoto,
  onBio,
}) => {
  const { t } = useTranslation();
  const maskId = React.useId();
  const [editingTag, setEditingTag] = useState(false);
  const [editingBio, setEditingBio] = useState(false);

  const managesRoles = Boolean(onToggleRole);
  const rolesManageable = new Set(availableRoles.map((role) => role.id));

  const hasDecoration = Boolean(profile?.decoration && profile.decoration !== "nenhuma");
  const cardFrame = charmClass("moldura", profile?.frame);
  const effect = charmClass("perfil", profile?.effect);
  const plate = charmClass("placa", profile?.plate);

  const theme: StyleCss | undefined = profile?.themePrimary
    ? {
        background: profile.secondaryTheme
          ? `linear-gradient(160deg, ${profile.themePrimary}, ${profile.secondaryTheme})`
          : profile.themePrimary,
        "--gc-recorte": profile.secondaryTheme ?? profile.themePrimary,
      }
    : undefined;

  return (
    <div data-gc="perfil.cartao.profile-card-visual.div"
      className={cn(
        "group/cartao relative overflow-hidden rounded-lg bg-surface-0",
        flxCls("profileCard"),
        className,
      )}
      style={theme}
    >
      {cardFrame && (
        <span data-gc="perfil.cartao.profile-card-visual.span"
          aria-hidden
          className={cn("gc-camada--cartao", cardFrame)}
          style={charmVariables({ animate: true, speed: "10s" })}
        />
      )}
      <TrackMask data-gc="perfil.cartao.profile-card-visual.track-mask" id={maskId} place="trackMask" cx={56} radius={47} />
      <div data-gc="perfil.cartao.profile-card-visual.div--2"
        className="relative aspect-[20/7] bg-cover bg-center"
        style={{
          mask: `url(#${maskId})`,
          WebkitMask: `url(#${maskId})`,
          backgroundColor: profile?.bannerColor?.trim() || avatarColor(id),
          ...(profile?.bannerUrl
            ? { backgroundImage: `url(${profile.bannerUrl})` }
            : null),
        }}
      >

        {trackMenu && (
          <div data-gc="perfil.cartao.profile-card-visual.div--3" className="absolute right-3 top-3">{trackMenu}</div>
        )}

        {!trackMenu && onEditTrack && (
          <button data-gc="perfil.cartao.profile-card-visual.button.on-edit-track"
            type="button"
            onClick={onEditTrack}
            aria-label={t("perfil.cartao.trocarFaixa")}
            title={t("perfil.cartao.trocarFaixaCurto")}
            className="absolute right-3 top-3 rounded-full bg-sobre-midia p-1.5 text-palco-ink/80 backdrop-blur-sm transition hover:bg-sobre-midia hover:text-palco-ink"
          >
            <Pencil data-gc="perfil.cartao.profile-card-visual.pencil" size={15} />
          </button>
        )}
      </div>

      {topActions && (
        <div data-gc="perfil.cartao.profile-card-visual.div--4" className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/cartao:opacity-100">
          {topActions}
        </div>
      )}

      <div data-gc="perfil.cartao.profile-card-visual.div--5" className={cn("relative px-4 pb-4 [--gc-recorte:var(--color-surface-0)]", flxCls("cardProfileSection"))}>
        {effect && (
          <span data-gc="perfil.cartao.profile-card-visual.span--2"
            aria-hidden
            className={cn("gc-perfil", effect)}
            style={charmVariables({ animate: true, speed: "12s" })}
          />
        )}

        <div data-gc="perfil.cartao.profile-card-visual.div--6" className="relative -mt-10 mb-3 flex items-start gap-3">
          <span data-gc="perfil.cartao.profile-card-visual.span--3" {...flx("photoProfileFrame", "relative shrink-0")}>
          <Avatar data-gc="perfil.cartao.profile-card-visual.avatar"
            id={id}
            name={displayName}
            url={avatarUrl}
            size={80}
            status={status}
            charms={profile}
            animate
            className={cn(
              "rounded-full",
              !hasDecoration && "ring-[6px] ring-surface-0",
            )}
          />

          {onEditPhoto && (
            <button data-gc="perfil.cartao.profile-card-visual.button.on-edit-photo"
              type="button"
              onClick={onEditPhoto}
              aria-label={t("perfil.cartao.trocarFoto")}
              title={t("perfil.cartao.trocarFotoCurto")}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-sobre-midia text-palco-ink opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
            >
              <Camera data-gc="perfil.cartao.profile-card-visual.camera" size={22} />
            </button>
          )}
          </span>

          {(customStatus || onStatus) && (
            <span data-gc="perfil.cartao.profile-card-visual.span--4" {...flx("profileNote", "relative ml-2 mt-8 min-w-0")}>
              <span data-gc="perfil.cartao.profile-card-visual.span--5"
                aria-hidden
                className="absolute -left-3 top-0 size-2.5 rounded-full bg-surface-3 shadow-md shadow-sombra"
              />
              <span data-gc="perfil.cartao.profile-card-visual.span--6"
                aria-hidden
                className="absolute -left-5 -top-2.5 size-1.5 rounded-full bg-surface-3 shadow-md shadow-sombra"
              />

              {onStatus ? (
                <button data-gc="perfil.cartao.profile-card-visual.button.on-status"
                  onClick={onStatus}
                  className="flex max-w-52 items-center gap-2 rounded-full bg-surface-3 px-4 py-2.5 text-left text-sm text-ink-muted shadow-lg shadow-sombra transition hover:bg-surface-4 hover:text-ink"
                >
                  {customStatus ? (
                    <>
                      {customStatus.emoji && (
                        <span data-gc="perfil.cartao.profile-card-visual.span--7">{customStatus.emoji}</span>
                      )}
                      <span data-gc="perfil.cartao.profile-card-visual.span--8" {...flx("noteText", "min-w-0 truncate italic")}>
                        {customStatus.text}
                      </span>
                    </>
                  ) : (
                    <>
                      <PlusCircle data-gc="perfil.cartao.profile-card-visual.plus-circle" size={14} className="shrink-0" />
                      <span data-gc="perfil.cartao.profile-card-visual.span--9" {...flx("emptyNote", "truncate italic")}>{t("perfil.cartao.adicionarStatus")}</span>
                    </>
                  )}
                </button>
              ) : (
                customStatus && (
                  <span data-gc="perfil.cartao.profile-card-visual.span--10" className="flex max-w-52 items-center gap-1.5 rounded-2xl bg-surface-3 px-3 py-2 text-sm text-ink-muted shadow-lg shadow-sombra">
                    {customStatus.emoji && (
                      <span data-gc="perfil.cartao.profile-card-visual.span--11">{customStatus.emoji}</span>
                    )}
                    <span data-gc="perfil.cartao.profile-card-visual.span--12" {...flx("noteText", "min-w-0 truncate italic")}>
                      {customStatus.text}
                    </span>
                  </span>
                )
              )}
            </span>
          )}
        </div>

        <div data-gc="perfil.cartao.profile-card-visual.div--7" {...flx("profileData", "relative")}>
          <div data-gc="perfil.cartao.profile-card-visual.div--8" {...flx("nameProfileLine", "flex items-center gap-2")}>
            <p data-gc="perfil.cartao.profile-card-visual.p"
              className={cn(
                "min-w-0 truncate text-xl font-bold leading-tight",
                plate && "gc-placa",
                plate,
              )}
            >
              {onOpenProfile ? (
                <button data-gc="perfil.cartao.profile-card-visual.button.on-open-profile"
                  type="button"
                  onClick={onOpenProfile}
                  className="min-w-0 max-w-full truncate text-left hover:underline"
                >
                  <UserName data-gc="perfil.cartao.profile-card-visual.user-name"
                    name={displayName}
                    profile={profile}
                    roleColor={roleColor}
                    size="md"
                    animate
                    isBot={isBot}
                    isSystem={isSystem}
                  />
                </button>
              ) : (
                <UserName data-gc="perfil.cartao.profile-card-visual.user-name--2"
                  name={displayName}
                  profile={profile}
                  roleColor={roleColor}
                  size="md"
                  animate
                  isBot={isBot}
                  isSystem={isSystem}
                />
              )}
            </p>

            {onIrForNote && (
              <Tooltip data-gc="perfil.cartao.profile-card-visual.tooltip" label={t("perfil.nota.adicionar")}>
                <button data-gc="perfil.cartao.profile-card-visual.button.on-ir-for-note"
                  type="button"
                  onClick={onIrForNote}
                  aria-label={t("perfil.nota.adicionar")}
                  className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition hover:bg-surface-3 hover:text-ink focus-visible:opacity-100 group-hover/cartao:opacity-100"
                >
                  <NotebookPen data-gc="perfil.cartao.profile-card-visual.notebook-pen" size={16} />
                </button>
              </Tooltip>
            )}
          </div>

          <p data-gc="perfil.cartao.profile-card-visual.p--2" {...flx("userProfileLine", "flex flex-wrap items-center gap-1.5 text-sm text-ink-muted")}>
            {onOpenProfile ? (
              <button data-gc="perfil.cartao.profile-card-visual.button.on-open-profile--2" type="button" onClick={onOpenProfile} {...flx("userProfileButton", "hover:underline")}>
                @{username}
              </button>
            ) : (
              <span data-gc="perfil.cartao.profile-card-visual.span--13" className={flxCls("userProfileButton")}>@{username}</span>
            )}

            {(pronouns || onPronouns) && (
              <>
                <span data-gc="perfil.cartao.profile-card-visual.span--14" className="text-ink-faint">•</span>
                {onPronouns ? (
                  <input data-gc="perfil.cartao.profile-card-visual.input"
                    value={pronouns ?? ""}
                    onChange={(e) => onPronouns(e.target.value)}
                    maxLength={LIMITS.pronouns}
                    placeholder={t("perfil.cartao.pronomes")}
                    aria-label={t("perfil.cartao.pronomes")}
                    size={12}
                    className={cn(
                      flxCls("pronounsCard"),
                      flxCls("editPlaceField"),
                      "w-24 rounded bg-surface-3 px-1.5 py-0 text-sm text-ink outline-none ring-ink-faint/70 transition focus:ring-2",
                    )}
                  />
                ) : (
                  <span data-gc="perfil.cartao.profile-card-visual.span--15" className={cn(flxCls("pronounsCard"), "truncate")}>{pronouns}</span>
                )}
              </>
            )}

            {editable ? (
              <span data-gc="perfil.cartao.profile-card-visual.span--16"
                className={cn(
                  flxCls("editPlaceFrame"),
                  flxCls("editPlaceBox"),
                  "flex items-center gap-1.5",
                )}
              >
                <span data-gc="perfil.cartao.profile-card-visual.span--17" className="text-ink-faint">•</span>
                {editingTag ? (
                  <input data-gc="perfil.cartao.profile-card-visual.input--2"
                    autoFocus
                    value={profile?.tag ?? ""}
                    onChange={(e) => onTag?.(e.target.value)}
                    onBlur={() => setEditingTag(false)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setEditingTag(false)
                    }
                    maxLength={LIMITS.tag}
                    placeholder="etiqueta"
                    aria-label={t("perfil.cartao.suaEtiqueta")}
                    size={LIMITS.tag}
                    className={cn(
                      flxCls("editPlaceField"),
                      "w-16 rounded bg-surface-3 px-1.5 py-0 text-sm font-semibold text-ink outline-none ring-ink-faint/70 transition focus:ring-2",
                    )}
                  />
                ) : (
                  <button data-gc="perfil.cartao.profile-card-visual.button"
                    onClick={() => setEditingTag(true)}
                    title={t("perfil.cartao.editarEtiqueta")}
                    className={cn(
                      flxCls("editPlaceButton"),
                      "rounded px-1 font-semibold text-ink transition hover:bg-surface-3",
                    )}
                  >
                    {profile?.tag || (
                      <span data-gc="perfil.cartao.profile-card-visual.span--18" className="text-ink-faint">etiqueta</span>
                    )}
                  </button>
                )}
              </span>
            ) : (
              profile?.tag && (
                <>
                  <span data-gc="perfil.cartao.profile-card-visual.span--19" className="text-ink-faint">•</span>
                  <span data-gc="perfil.cartao.profile-card-visual.span--20" className="font-semibold text-ink">
                    {profile.tag}
                  </span>
                </>
              )
            )}

            {editable ? (
              <TagPicker data-gc="perfil.cartao.profile-card-visual.tag-picker"
                current={profile?.tagGuildId}
                onPick={(guildId) => onServerTag?.(guildId)}
              />
            ) : (
              <ServerTag data-gc="perfil.cartao.profile-card-visual.server-tag" tag={serverTag} />
            )}

            {profile?.rank && (
              <RankAnimated data-gc="perfil.cartao.profile-card-visual.rank-animated" rank={profile.rank} animate />
            )}

            {badges.map((badge) => (
              <span data-gc="perfil.cartao.profile-card-visual.span--21"
                key={badge.id}
                title={badge.name}
                className="inline-flex items-center"
              >
                {badge.emoji ? (
                  <span data-gc="perfil.cartao.profile-card-visual.span--22" className="text-base leading-none">
                    {badge.emoji}
                  </span>
                ) : badge.iconUrl ? (
                  <img data-gc="perfil.cartao.profile-card-visual.img"
                    src={badge.iconUrl}
                    alt={badge.name}
                    className="size-4 object-contain"
                  />
                ) : null}
              </span>
            ))}
          </p>

          {actions && <div data-gc="perfil.cartao.profile-card-visual.div--9" className="mt-3 flex items-center gap-2">{actions}</div>}

          {(mutualGuilds > 0 || mutualFriends > 0) && (
            <p data-gc="perfil.cartao.profile-card-visual.p--3" className="mt-2 text-xs text-ink-faint">
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
            editingBio ? (
              <div data-gc="perfil.cartao.profile-card-visual.div--10" className="mt-4">
                <textarea data-gc="perfil.cartao.profile-card-visual.textarea"
                  autoFocus
                  rows={3}
                  value={bio ?? ""}
                  onChange={(e) => onBio(e.target.value)}
                  onBlur={() => setEditingBio(false)}
                  maxLength={LIMITS.bio}
                  placeholder={t("perfil.cartao.conteAlgo")}
                  className="w-full resize-none rounded-lg border border-brand/70 bg-surface-1 px-3 py-2 text-sm text-ink outline-none ring-2 ring-brand/25 placeholder:text-ink-faint"
                />
                <p data-gc="perfil.cartao.profile-card-visual.p--4" className="mt-1 text-right text-xs text-ink-faint">
                  {(bio ?? "").length} / {LIMITS.bio}
                </p>
              </div>
            ) : (
              <button data-gc="perfil.cartao.profile-card-visual.button--2"
                type="button"
                onClick={() => setEditingBio(true)}
                className="mt-4 block w-full rounded-lg px-1 py-0.5 text-left text-sm transition hover:bg-surface-3/60"
              >
                {bio ? (
                  <span data-gc="perfil.cartao.profile-card-visual.span--23" className="whitespace-pre-wrap text-ink">{bio}</span>
                ) : (
                  <span data-gc="perfil.cartao.profile-card-visual.span--24" className="italic text-ink-faint">
                    {t("perfil.cartao.adicionarDescricao")}
                  </span>
                )}
              </button>
            )
          ) : (
            bio && <p data-gc="perfil.cartao.profile-card-visual.p--5" className="mt-4 whitespace-pre-wrap text-sm text-ink">{bio}</p>
          )}

          {(roleList.length > 0 || managesRoles) && (
            <>
              {detailed && (
                <p data-gc="perfil.cartao.profile-card-visual.p--6" className="mb-2 mt-5 text-sm font-bold text-ink">
                  {roleList.length === 0
                    ? t("perfil.cartao.cargos")
                    : roleList.length === 1
                      ? t("perfil.cartao.cargo")
                      : t("perfil.cartao.cargosCom", { quantidade: roleList.length })}
                </p>
              )}

              <div data-gc="perfil.cartao.profile-card-visual.div--11" className={cn("flex flex-wrap items-center gap-1.5", !detailed && "mt-4")}>
                {roleList.map((role) => (
                  <span data-gc="perfil.cartao.profile-card-visual.span--25"
                    key={role.id}
                    className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-0.5 text-xs font-medium"
                  >
                    {role.iconEmoji ? (
                      <span data-gc="perfil.cartao.profile-card-visual.span--26">{role.iconEmoji}</span>
                    ) : role.iconUrl ? (
                      <img data-gc="perfil.cartao.profile-card-visual.img--2"
                        src={role.iconUrl}
                        alt=""
                        className="size-3.5 rounded-sm object-cover"
                      />
                    ) : (
                      <span data-gc="perfil.cartao.profile-card-visual.span--27"
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            role.color ?? "var(--color-ink-faint)",
                        }}
                      />
                    )}
                    {role.name}

                    {onToggleRole && rolesManageable.has(role.id) && (
                      <button data-gc="perfil.cartao.profile-card-visual.button--3"
                        type="button"
                        onClick={() => onToggleRole(role.id)}
                        disabled={savingRoles}
                        aria-label={t("perfil.cartao.tirarCargo", { cargo: role.name })}
                        title={t("perfil.cartao.tirarCargo", { cargo: role.name })}
                        className="-mr-1 rounded-full p-0.5 text-ink-faint transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
                      >
                        <X data-gc="perfil.cartao.profile-card-visual.x" size={11} />
                      </button>
                    )}
                  </span>
                ))}

                {onToggleRole && (
                  <RolesPicker data-gc="perfil.cartao.profile-card-visual.roles-picker.on-toggle-role"
                    available={availableRoles}
                    current={roleList.map((role) => role.id)}
                    onToggle={onToggleRole}
                    disabled={savingRoles}
                  />
                )}
              </div>
            </>
          )}

          {detailed && createdAt && (
            <>
              <p data-gc="perfil.cartao.profile-card-visual.p--7" className="mb-1 mt-5 text-sm font-bold text-ink">{t("perfil.membroDesde")}</p>
              <div data-gc="perfil.cartao.profile-card-visual.div--12" className="grid grid-cols-2 items-start gap-x-3 text-sm text-ink-muted">
                <span data-gc="perfil.cartao.profile-card-visual.span--28" className="flex items-start gap-1.5" title="Gravaê">
                  <img data-gc="perfil.cartao.profile-card-visual.img--3" src="/brand/logo%20g%20branco.svg" alt="" className="size-3.5 opacity-80" draggable={false} />
                  {new Intl.DateTimeFormat(currentLanguage(), { dateStyle: "medium" }).format(new Date(createdAt))}
                </span>
                {joinedAt && (
                  <span data-gc="perfil.cartao.profile-card-visual.span--29" className="flex items-center gap-1.5" title={serverName ?? undefined}>
                    <span data-gc="perfil.cartao.profile-card-visual.span--30" className="flex size-3.5 items-center justify-center rounded-full bg-surface-4 text-[8px] font-bold uppercase text-ink">
                      {(serverName ?? "").slice(0, 1)}
                    </span>
                    {new Intl.DateTimeFormat(currentLanguage(), { dateStyle: "medium" }).format(new Date(joinedAt))}
                  </span>
                )}
              </div>
            </>
          )}

          {children}

          {downActions && <div data-gc="perfil.cartao.profile-card-visual.div--13" className="mt-4 flex flex-col gap-2">{downActions}</div>}
        </div>
      </div>
    </div>
  );
};
