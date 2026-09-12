import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  Hash,
  IdCard,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Plus,
  Ticket,
  Check,
  ShieldAlert,
  UserMinus,
  Volume2,
  X,
} from "lucide-react";
import type { Role } from "@gravae/shared";

import { useModerationView } from "~/@core/application/queries/guild/use-moderation-view";
import { useModerationMessages } from "~/@core/application/queries/guild/use-moderation-messages";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { useBanMember, useTimeoutMember } from "~/@core/application/queries/moderation/use-moderation";
import type { ModerationMessageModel } from "~/@core/domain/models/moderation-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { useModeration } from "~/features/servidor/stores/moderacao";
import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import { copyText } from "~/lib/copiar";
import { extractLinks } from "~/features/conversa/lib/links";
import { Tooltip } from "~/components/ui/tooltip";
import { useConfirm } from "~/components/ui/confirm";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";

type Detail = "todas" | "links" | "midia" | null;

export const ModeratorView: React.FC<{ roles: Role[] }> = ({ roles }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const target = useModeration((s) => s.target);
  const close = useModeration((s) => s.close);
  const [detail, setDetail] = useState<Detail>(null);

  const guildId = target?.guildId ?? null;
  const userId = target?.userId ?? null;
  const { data, isLoading, error } = useModerationView(guildId, userId);

  useEffect(() => setDetail(null), [userId]);

  useEffect(() => {
    if (!target) return;

    const onType = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onType);
    return () => window.removeEventListener("keydown", onType);
  }, [target, close]);

  if (!target || !guildId || !userId) return null;

  return (
    <aside data-gc="servidor.moderator-view.aside" {...flx("membersPage", "hidden w-[22rem] shrink-0 flex-col border-l border-divisor bg-surface-2 xl:flex")}>
        <header data-gc="servidor.moderator-view.header" className="shrink-0 border-b border-divisor bg-surface-1">
          <div data-gc="servidor.moderator-view.div" className="flex items-center gap-3 p-4">
            <Avatar data-gc="servidor.moderator-view.avatar" id={userId} name={target.displayName} url={target.avatarUrl} size={40} />
            <div data-gc="servidor.moderator-view.div--2" className="min-w-0 flex-1">
              <h2 data-gc="servidor.moderator-view.h2" className="truncate text-base font-semibold">{target.displayName}</h2>
              <p data-gc="servidor.moderator-view.p" className="truncate text-xs text-ink-muted">@{target.username}</p>
            </div>
            <button data-gc="servidor.moderator-view.button.close"
              onClick={close}
              aria-label={t("comum.fechar")}
              title={t("servidor.moderacao.fecharEsc")}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <X data-gc="servidor.moderator-view.x" size={20} />
            </button>
          </div>

          <ActionsBar data-gc="servidor.moderator-view.actions-bar.close"
            guildId={guildId}
            userId={userId}
            displayName={target.displayName}
            onClose={close}
          />
        </header>

        <div data-gc="servidor.moderator-view.div--3" className="min-h-0 flex-1 overflow-y-auto">
          {detail ? (
            <ListMessages data-gc="servidor.moderator-view.list-messages"
              guildId={guildId}
              userId={userId}
              filter={detail}
              onBack={() => setDetail(null)}
              onIrForMessage={(channelId, messageId) =>
                navigate(`/channels/${guildId}/${channelId}?m=${messageId}`)
              }
            />
          ) : (
            <div data-gc="servidor.moderator-view.div--4" className="p-4">
              <p data-gc="servidor.moderator-view.p--2" className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldAlert data-gc="servidor.moderator-view.shield-alert" size={16} className="text-brand" /> {t("servidor.moderacao.titulo")}
              </p>

              {error && (
                <p data-gc="servidor.moderator-view.p--3" className="rounded bg-danger-fundo p-3 text-sm text-danger">
                  {t("servidor.moderacao.semPermissao")}
                </p>
              )}

              {isLoading && <p data-gc="servidor.moderator-view.p--4" className="py-8 text-center text-sm text-ink-muted">{t("comum.carregando")}</p>}

              {data && (
                <>
                  <Section data-gc="servidor.moderator-view.section" title={t("servidor.moderacao.atividade")}>
                    <Line data-gc="servidor.moderator-view.line"
                      icon={<MessageSquare data-gc="servidor.moderator-view.message-square" size={15} />}
                      label={t("servidor.moderacao.mensagens")}
                      value={data.activity.messages}
                      onClick={data.activity.messages ? () => setDetail("todas") : undefined}
                    />
                    <Line data-gc="servidor.moderator-view.line--2"
                      icon={<Link2 data-gc="servidor.moderator-view.link2" size={15} />}
                      label={t("servidor.moderacao.links")}
                      value={data.activity.links}
                      onClick={data.activity.links ? () => setDetail("links") : undefined}
                    />
                    <Line data-gc="servidor.moderator-view.line--3"
                      icon={<ImageIcon data-gc="servidor.moderator-view.image-icon" size={15} />}
                      label={t("servidor.moderacao.midia")}
                      value={data.activity.media}
                      onClick={data.activity.media ? () => setDetail("midia") : undefined}
                    />
                    <Line data-gc="servidor.moderator-view.line--4"
                      icon={<FileText data-gc="servidor.moderator-view.file-text" size={15} />}
                      label={t("servidor.moderacao.acoesNaAuditoria")}
                      value={data.audit.made}
                    />
                    <Line data-gc="servidor.moderator-view.line--5"
                      icon={<ShieldAlert data-gc="servidor.moderator-view.shield-alert--2" size={15} />}
                      label={t("servidor.moderacao.moderacoesSofridas")}
                      value={data.audit.suffered}
                      alert={data.audit.suffered > 0}
                    />
                  </Section>

                  <Section data-gc="servidor.moderator-view.section--2" title={t("servidor.moderacao.permissoes", { quantas: data.permissions.length })}>
                    <div data-gc="servidor.moderator-view.div--5" className="flex flex-wrap gap-1.5 p-3">
                      {data.permissions.length ? (
                        data.permissions.map((p) => (
                          <span data-gc="servidor.moderator-view.span"
                            key={p}
                            className="rounded bg-surface-3 px-2 py-1 text-xs text-ink-muted"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span data-gc="servidor.moderator-view.span--2" className="text-xs text-ink-faint">{t("servidor.moderacao.semPermissaoEspecial")}</span>
                      )}
                    </div>
                  </Section>

                  <Section data-gc="servidor.moderator-view.section--3" title={t("servidor.cargos.titulo")}>
                    <RolesEditor data-gc="servidor.moderator-view.roles-editor"
                      guildId={guildId}
                      userId={userId}
                      roles={roles}
                      current={data.roleIds}
                    />
                  </Section>

                  <Section data-gc="servidor.moderator-view.section--4" title={t("servidor.moderacao.conta")}>
                    <Line data-gc="servidor.moderator-view.line--6" label={t("servidor.moderacao.entrouNoServidor")} value={data.joinedServer} data />
                    <Line data-gc="servidor.moderator-view.line--7" label={t("servidor.moderacao.contaCriadaEm")} value={data.joinedGravae} data />
                    {data.timeoutUntil && (
                      <Line data-gc="servidor.moderator-view.line--8" label={t("servidor.moderacao.deCastigoAte")} value={data.timeoutUntil} data alert />
                    )}
                    <Line data-gc="servidor.moderator-view.line--9"
                      icon={<Ticket data-gc="servidor.moderator-view.ticket" size={15} />}
                      label={t("servidor.moderacao.formaDeAdesao")}
                      value={
                        data.joining.inviteCode
                          ? `${data.joining.inviteCode}${
                              data.joining.invitedBy ? ` · por ${data.joining.invitedBy}` : ""
                            }`
                          : "Sem registro"
                      }
                    />
                  </Section>
                </>
              )}
            </div>
          )}
        </div>
    </aside>
  );
};

const ActionsBar: React.FC<{
  guildId: string;
  userId: string;
  displayName: string;
  onClose: () => void;
}> = ({ guildId, userId, displayName, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const openDm = useOpenDm();
  const removeMember = useRemoveMember();
  const ban = useBanMember(guildId);
  const timeout = useTimeoutMember(guildId);

  const chat = async () => {
    const channel = await openDm.mutateAsync(userId).catch(() => null);
    if (!channel) return toast.error(t("servidor.moderacao.precisaSerAmigo"));

    onClose();
    navigate(`/dm/${channel.id}`);
  };

  const kick = async () => {
    const { confirmed } = await confirm({
      title: t("servidor.membros.expulsarTitulo", { nome: displayName }),
      description: t("servidor.moderacao.expulsarDescricao"),
      action: t("servidor.membros.expulsar"),
    });

    if (confirmed) {
      removeMember.mutate({ guildId, userId });
      onClose();
    }
  };

  const banMember = async () => {
    const { confirmed, text } = await confirm({
      title: t("servidor.membros.banirTitulo", { nome: displayName }),
      description: t("servidor.moderacao.banirDescricao"),
      action: t("servidor.membros.banir"),
      field: { label: t("servidor.membros.motivo"), placeholder: t("servidor.membros.motivoDica") },
    });

    if (confirmed) {
      ban.mutate({ guildId, userId, reason: text || null });
      onClose();
    }
  };

  const timeoutMember = async () => {
    const { confirmed, text } = await confirm({
      title: t("servidor.moderacao.castigarTitulo", { nome: displayName }),
      description: t("servidor.moderacao.castigoDescricao"),
      action: t("servidor.moderacao.aplicarCastigo"),
      field: { label: t("servidor.moderacao.duracao"), placeholder: "60", required: true },
    });

    if (!confirmed) return;

    const minutes = Number(text);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return toast.error(t("servidor.moderacao.informeDuracao"));
    }

    timeout.mutate({ guildId, userId, minutes });
    onClose();
  };

  const copyId = async () => {
    await copyText(userId);
    toast.success(t("servidor.moderacao.idCopiado"));
  };

  return (
    <div data-gc="servidor.moderator-view.div--6" className="grid grid-cols-3 gap-1 border-t border-divisor p-2 sm:grid-cols-5">
      <TopAction data-gc="servidor.moderator-view.top-action" label={t("servidor.moderacao.mensagem")} onClick={() => void chat()}>
        <MessageSquare data-gc="servidor.moderator-view.message-square--2" size={18} />
      </TopAction>
      <TopAction data-gc="servidor.moderator-view.top-action--2" label={t("servidor.membros.expulsar")} onClick={() => void kick()} danger>
        <UserMinus data-gc="servidor.moderator-view.user-minus" size={18} />
      </TopAction>
      <TopAction data-gc="servidor.moderator-view.top-action--3" label={t("servidor.membros.banir")} onClick={() => void banMember()} danger>
        <Gavel data-gc="servidor.moderator-view.gavel" size={18} />
      </TopAction>
      <TopAction data-gc="servidor.moderator-view.top-action--4" label={t("servidor.moderacao.castigo")} onClick={() => void timeoutMember()} danger>
        <Clock data-gc="servidor.moderator-view.clock" size={18} />
      </TopAction>
      <TopAction data-gc="servidor.moderator-view.top-action--5" label={t("servidor.moderacao.copiarId")} onClick={() => void copyId()}>
        <IdCard data-gc="servidor.moderator-view.id-card" size={18} />
      </TopAction>
    </div>
  );
};

const TopAction: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ children, label, onClick, danger }) => (
  <Tooltip data-gc="servidor.moderator-view.tooltip" label={label}>
    <button data-gc="servidor.moderator-view.button.on-click"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded bg-surface-3 py-2.5 text-ink-muted transition hover:bg-surface-4",
        danger ? "hover:text-danger" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const TITLES: Record<"todas" | "links" | "midia", string> = {
  todas: "servidor.moderacao.mensagens",
  links: "servidor.moderacao.links",
  midia: "servidor.moderacao.midia",
};

const ListMessages: React.FC<{
  guildId: string;
  userId: string;
  filter: "todas" | "links" | "midia";
  onBack: () => void;
  onIrForMessage: (channelId: string, messageId: string) => void;
}> = ({ guildId, userId, filter, onBack, onIrForMessage }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useModerationMessages(guildId, userId, filter);

  return (
    <div data-gc="servidor.moderator-view.div--7">
      <div data-gc="servidor.moderator-view.div--8" className="sticky top-0 z-10 flex items-center justify-between border-b border-divisor bg-surface-2 px-4 py-2.5">
        <button data-gc="servidor.moderator-view.button.on-back"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft data-gc="servidor.moderator-view.arrow-left" size={16} /> {t("servidor.moderacao.voltar")}
        </button>
        <span data-gc="servidor.moderator-view.span--3" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {t(TITLES[filter])}
        </span>
      </div>

      <div data-gc="servidor.moderator-view.div--9" className="space-y-3 p-4">
        {isLoading && <p data-gc="servidor.moderator-view.p--5" className="py-8 text-center text-sm text-ink-muted">{t("comum.carregando")}</p>}

        {data && !data.length && (
          <p data-gc="servidor.moderator-view.p--6" className="py-8 text-center text-sm text-ink-muted">{t("servidor.moderacao.vazio")}</p>
        )}

        {data?.map((message) => (
          <ListMessage data-gc="servidor.moderator-view.list-message"
            key={message.id}
            message={message}
            filter={filter}
            onIr={() => onIrForMessage(message.channelId, message.id)}
          />
        ))}

        {data && data.length >= 50 && (
          <p data-gc="servidor.moderator-view.p--7" className="pt-2 text-center text-xs text-ink-faint">
            {t("servidor.moderacao.cinquenta")}
          </p>
        )}
      </div>
    </div>
  );
};

const ListMessage: React.FC<{
  message: ModerationMessageModel;
  filter: "todas" | "links" | "midia";
  onIr: () => void;
}> = ({ message, filter, onIr }) => {
  const { t } = useTranslation();

  return (
  <article data-gc="servidor.moderator-view.article" className="group/msg rounded-lg bg-surface-1 p-3">
    <header data-gc="servidor.moderator-view.header--2" className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-faint">
      {message.channelType === "VOICE" ? <Volume2 data-gc="servidor.moderator-view.volume2" size={12} /> : <Hash data-gc="servidor.moderator-view.hash" size={12} />}
      <span data-gc="servidor.moderator-view.span--4" className="min-w-0 flex-1 truncate font-medium text-ink-muted">
        {message.channelName}
      </span>

      <button data-gc="servidor.moderator-view.button.on-ir"
        onClick={onIr}
        className="rounded bg-surface-3 px-1.5 py-0.5 text-11 opacity-0 transition group-hover/msg:opacity-100 hover:text-ink"
      >
        {t("servidor.moderacao.irParaMensagem")}
      </button>

      <time data-gc="servidor.moderator-view.time" dateTime={message.createdAt}>
        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
          new Date(message.createdAt),
        )}
      </time>
    </header>

    {filter === "links" && <MessageLinks data-gc="servidor.moderator-view.message-links" content={message.content} />}

    {message.content && (
      <p data-gc="servidor.moderator-view.p--8"
        className={cn(
          "whitespace-pre-wrap break-words text-sm",
          filter === "links" && "mt-2 line-clamp-2 text-xs text-ink-faint",
        )}
      >
        {message.content}
      </p>
    )}

    {message.attachments.length > 0 && (
      <div data-gc="servidor.moderator-view.div--10" className="mt-2 flex flex-wrap gap-2">
        {message.attachments.map((attachment) =>
          attachment.contentType.startsWith("image/") ? (
            <img data-gc="servidor.moderator-view.img"
              key={attachment.url}
              src={attachment.url}
              alt={attachment.filename}
              className="max-h-32 rounded object-cover"
            />
          ) : (
            <span data-gc="servidor.moderator-view.span--5"
              key={attachment.url}
              className="rounded bg-surface-3 px-2 py-1 text-xs text-ink-muted"
            >
              {attachment.filename}
            </span>
          ),
        )}
      </div>
    )}
  </article>
  );
};

const MessageLinks: React.FC<{ content: string }> = ({ content }) => {
  const { t } = useTranslation();
  const links = extractLinks(content, 5);
  if (!links.length) return null;

  return (
    <div data-gc="servidor.moderator-view.div--11" className="flex flex-col gap-1">
      {links.map((url) => (
        <LinkLine data-gc="servidor.moderator-view.link-line" key={url} url={url} />
      ))}
    </div>
  );
};

const LinkLine: React.FC<{ url: string }> = ({ url }) => {
  const { data: embed } = useEmbed(url);
  const domain = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  return (
    <a data-gc="servidor.moderator-view.a"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
      className="flex items-center gap-2 rounded bg-surface-3 px-2 py-1.5 transition hover:bg-surface-4"
    >
      {embed?.favicon ? (
        <img data-gc="servidor.moderator-view.img--2"
          src={embed.favicon}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="size-4 shrink-0 rounded-sm object-contain"
        />
      ) : (
        <Link2 data-gc="servidor.moderator-view.link2--2" size={14} className="shrink-0 text-ink-faint" />
      )}

      <span data-gc="servidor.moderator-view.span--6" className="min-w-0 flex-1">
        <span data-gc="servidor.moderator-view.span--7" className="block truncate text-xs font-medium text-brand">
          {embed?.title ?? url}
        </span>
        <span data-gc="servidor.moderator-view.span--8" className="block truncate text-11 text-ink-faint">
          {embed?.site ?? domain}
        </span>
      </span>
    </a>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section data-gc="servidor.moderator-view.section--5" className="mb-4">
    <h4 data-gc="servidor.moderator-view.h4" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</h4>
    <div data-gc="servidor.moderator-view.div--12" className="overflow-hidden rounded-lg bg-surface-1">{children}</div>
  </section>
);

interface LineProps {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  data?: boolean;
  alert?: boolean;
  onClick?: () => void;
}

const Line: React.FC<LineProps> = ({ icon, label, value, data, alert, onClick }) => {
  const { t } = useTranslation();
  const content = (
    <>
      {icon && <span data-gc="servidor.moderator-view.span--9" className="shrink-0 text-ink-faint">{icon}</span>}
      <span data-gc="servidor.moderator-view.span--10" className="min-w-0 flex-1 truncate text-left text-sm">{label}</span>
      <span data-gc="servidor.moderator-view.span--11" className={alert ? "text-sm font-semibold text-danger" : "text-sm text-ink-muted"}>
        {data
          ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value))
          : value}
      </span>
      {onClick && <ChevronRight data-gc="servidor.moderator-view.chevron-right" size={14} className="shrink-0 text-ink-faint" />}
    </>
  );

  const cssClass = "flex w-full items-center gap-2 border-b border-divisor px-3 py-2.5 last:border-0";

  if (!onClick) return <div data-gc="servidor.moderator-view.div--13" className={cssClass}>{content}</div>;

  return (
    <button data-gc="servidor.moderator-view.button.on-click--2" onClick={onClick} className={cn(cssClass, "transition hover:bg-surface-3")}>
      {content}
    </button>
  );
};

const RolesEditor: React.FC<{
  guildId: string;
  userId: string;
  roles: Role[];
  current: string[];
}> = ({ guildId, userId, roles, current }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setRoles = useSetMemberRoles(guildId);

  const assignable = roles.filter((r) => !r.isEveryone);
  const marked = assignable.filter((r) => current.includes(r.id));

  const toggle = (roleId: string) => {
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];

    setRoles.mutate(
      { guildId, userId, roleIds: next },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.moderation] }),
      },
    );
  };

  return (
    <div data-gc="servidor.moderator-view.div--14" className="flex flex-wrap items-center gap-1.5 p-3">
      {marked.map((role) => (
        <span data-gc="servidor.moderator-view.span--12"
          key={role.id}
          className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-1 text-xs"
        >
          <span data-gc="servidor.moderator-view.span--13"
            className="size-2 rounded-full"
            style={{ backgroundColor: role.color || "#99aab5" }}
          />
          {role.name}
        </span>
      ))}

      {!marked.length && <span data-gc="servidor.moderator-view.span--14" className="text-xs text-ink-faint">{t("servidor.moderacao.soEveryone")}</span>}

      <DropdownMenu data-gc="servidor.moderator-view.dropdown-menu">
        <DropdownMenuTrigger data-gc="servidor.moderator-view.dropdown-menu-trigger" asChild>
          <button data-gc="servidor.moderator-view.button"
            aria-label={t("servidor.moderacao.adicionarCargo")}
            disabled={setRoles.isPending}
            className="rounded-full bg-surface-3 p-1 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
          >
            <Plus data-gc="servidor.moderator-view.plus" size={14} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent data-gc="servidor.moderator-view.dropdown-menu-content" align="start" className="max-h-72 overflow-y-auto">
          {assignable.length ? (
            assignable.map((role) => {
              const has = current.includes(role.id);

              return (
                <DropdownMenuItem data-gc="servidor.moderator-view.dropdown-menu-item"
                  key={role.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggle(role.id);
                  }}
                >
                  <span data-gc="servidor.moderator-view.span--15" className="flex min-w-0 flex-1 items-center gap-2">
                    <span data-gc="servidor.moderator-view.span--16"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: role.color || "#99aab5" }}
                    />
                    <span data-gc="servidor.moderator-view.span--17" className="truncate">{role.name}</span>
                  </span>
                  <span data-gc="servidor.moderator-view.span--18"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      has ? "border-brand bg-brand text-sobre-marca" : "border-line",
                    )}
                  >
                    {has && <Check data-gc="servidor.moderator-view.check" size={11} />}
                  </span>
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem data-gc="servidor.moderator-view.dropdown-menu-item--2" disabled>{t("servidor.moderacao.semCargos")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
