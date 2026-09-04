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
import { Avatar } from "~/components/Avatar";
import { useModeracao } from "~/stores/moderacao";
import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import { copiarTexto } from "~/lib/copiar";
import { extrairLinks } from "~/features/conversa/lib/links";
import { Tooltip } from "~/components/ui/tooltip";
import { useConfirmar } from "~/components/ui/confirm";
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

type Detalhe = "todas" | "links" | "midia" | null;

export const ModeratorView: React.FC<{ roles: Role[] }> = ({ roles }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const alvo = useModeracao((s) => s.alvo);
  const fechar = useModeracao((s) => s.fechar);
  const [detalhe, setDetalhe] = useState<Detalhe>(null);

  const guildId = alvo?.guildId ?? null;
  const userId = alvo?.userId ?? null;
  const { data, isLoading, error } = useModerationView(guildId, userId);

  useEffect(() => setDetalhe(null), [userId]);

  useEffect(() => {
    if (!alvo) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") fechar();
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [alvo, fechar]);

  if (!alvo || !guildId || !userId) return null;

  return (
    <aside className="hidden w-[22rem] shrink-0 flex-col border-l border-divisor bg-surface-2 xl:flex">
        <header className="shrink-0 border-b border-divisor bg-surface-1">
          <div className="flex items-center gap-3 p-4">
            <Avatar id={userId} name={alvo.displayName} url={alvo.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">{alvo.displayName}</h2>
              <p className="truncate text-xs text-ink-muted">@{alvo.username}</p>
            </div>
            <button
              onClick={fechar}
              aria-label={t("comum.fechar")}
              title={t("servidor.moderacao.fecharEsc")}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <X size={20} />
            </button>
          </div>

          <BarraDeAcoes
            guildId={guildId}
            userId={userId}
            displayName={alvo.displayName}
            onFechar={fechar}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {detalhe ? (
            <ListaDeMensagens
              guildId={guildId}
              userId={userId}
              filtro={detalhe}
              onVoltar={() => setDetalhe(null)}
              onIrParaMensagem={(channelId, messageId) =>
                navigate(`/channels/${guildId}/${channelId}?m=${messageId}`)
              }
            />
          ) : (
            <div className="p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldAlert size={16} className="text-brand" /> {t("servidor.moderacao.titulo")}
              </p>

              {error && (
                <p className="rounded bg-danger/10 p-3 text-sm text-danger">
                  {t("servidor.moderacao.semPermissao")}
                </p>
              )}

              {isLoading && <p className="py-8 text-center text-sm text-ink-muted">{t("comum.carregando")}</p>}

              {data && (
                <>
                  <Secao titulo={t("servidor.moderacao.atividade")}>
                    <Linha
                      icone={<MessageSquare size={15} />}
                      rotulo={t("servidor.moderacao.mensagens")}
                      valor={data.atividade.mensagens}
                      onClick={data.atividade.mensagens ? () => setDetalhe("todas") : undefined}
                    />
                    <Linha
                      icone={<Link2 size={15} />}
                      rotulo={t("servidor.moderacao.links")}
                      valor={data.atividade.links}
                      onClick={data.atividade.links ? () => setDetalhe("links") : undefined}
                    />
                    <Linha
                      icone={<ImageIcon size={15} />}
                      rotulo={t("servidor.moderacao.midia")}
                      valor={data.atividade.midia}
                      onClick={data.atividade.midia ? () => setDetalhe("midia") : undefined}
                    />
                    <Linha
                      icone={<FileText size={15} />}
                      rotulo={t("servidor.moderacao.acoesNaAuditoria")}
                      valor={data.auditoria.feitas}
                    />
                    <Linha
                      icone={<ShieldAlert size={15} />}
                      rotulo={t("servidor.moderacao.moderacoesSofridas")}
                      valor={data.auditoria.sofridas}
                      alerta={data.auditoria.sofridas > 0}
                    />
                  </Secao>

                  <Secao titulo={t("servidor.moderacao.permissoes", { quantas: data.permissoes.length })}>
                    <div className="flex flex-wrap gap-1.5 p-3">
                      {data.permissoes.length ? (
                        data.permissoes.map((p) => (
                          <span
                            key={p}
                            className="rounded bg-surface-3 px-2 py-1 text-xs text-ink-muted"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-ink-faint">{t("servidor.moderacao.semPermissaoEspecial")}</span>
                      )}
                    </div>
                  </Secao>

                  <Secao titulo={t("servidor.cargos.titulo")}>
                    <EditorDeCargos
                      guildId={guildId}
                      userId={userId}
                      roles={roles}
                      atuais={data.roleIds}
                    />
                  </Secao>

                  <Secao titulo={t("servidor.moderacao.conta")}>
                    <Linha rotulo={t("servidor.moderacao.entrouNoServidor")} valor={data.entrouNoServidor} data />
                    <Linha rotulo={t("servidor.moderacao.contaCriadaEm")} valor={data.entrouNoGravae} data />
                    {data.timeoutUntil && (
                      <Linha rotulo={t("servidor.moderacao.deCastigoAte")} valor={data.timeoutUntil} data alerta />
                    )}
                    <Linha
                      icone={<Ticket size={15} />}
                      rotulo={t("servidor.moderacao.formaDeAdesao")}
                      valor={
                        data.adesao.inviteCode
                          ? `${data.adesao.inviteCode}${
                              data.adesao.convidadoPor ? ` · por ${data.adesao.convidadoPor}` : ""
                            }`
                          : "Sem registro"
                      }
                    />
                  </Secao>
                </>
              )}
            </div>
          )}
        </div>
    </aside>
  );
};

const BarraDeAcoes: React.FC<{
  guildId: string;
  userId: string;
  displayName: string;
  onFechar: () => void;
}> = ({ guildId, userId, displayName, onFechar }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const openDm = useOpenDm();
  const removeMember = useRemoveMember();
  const banir = useBanMember(guildId);
  const castigar = useTimeoutMember(guildId);

  const conversar = async () => {
    const canal = await openDm.mutateAsync(userId).catch(() => null);
    if (!canal) return toast.error(t("servidor.moderacao.precisaSerAmigo"));

    onFechar();
    navigate(`/dm/${canal.id}`);
  };

  const expulsar = async () => {
    const { confirmado } = await confirmar({
      titulo: t("servidor.membros.expulsarTitulo", { nome: displayName }),
      descricao: t("servidor.moderacao.expulsarDescricao"),
      acao: t("servidor.membros.expulsar"),
    });

    if (confirmado) {
      removeMember.mutate({ guildId, userId });
      onFechar();
    }
  };

  const banirMembro = async () => {
    const { confirmado, texto } = await confirmar({
      titulo: t("servidor.membros.banirTitulo", { nome: displayName }),
      descricao: t("servidor.moderacao.banirDescricao"),
      acao: t("servidor.membros.banir"),
      campo: { rotulo: t("servidor.membros.motivo"), placeholder: t("servidor.membros.motivoDica") },
    });

    if (confirmado) {
      banir.mutate({ guildId, userId, reason: texto || null });
      onFechar();
    }
  };

  const castigarMembro = async () => {
    const { confirmado, texto } = await confirmar({
      titulo: t("servidor.moderacao.castigarTitulo", { nome: displayName }),
      descricao: t("servidor.moderacao.castigoDescricao"),
      acao: t("servidor.moderacao.aplicarCastigo"),
      campo: { rotulo: t("servidor.moderacao.duracao"), placeholder: "60", obrigatorio: true },
    });

    if (!confirmado) return;

    const minutos = Number(texto);
    if (!Number.isFinite(minutos) || minutos <= 0) {
      return toast.error(t("servidor.moderacao.informeDuracao"));
    }

    castigar.mutate({ guildId, userId, minutos });
    onFechar();
  };

  const copiarId = async () => {
    await copiarTexto(userId);
    toast.success(t("servidor.moderacao.idCopiado"));
  };

  return (
    <div className="grid grid-cols-5 gap-1 border-t border-divisor p-2">
      <AcaoDoTopo label={t("servidor.moderacao.mensagem")} onClick={() => void conversar()}>
        <MessageSquare size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label={t("servidor.membros.expulsar")} onClick={() => void expulsar()} perigo>
        <UserMinus size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label={t("servidor.membros.banir")} onClick={() => void banirMembro()} perigo>
        <Gavel size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label={t("servidor.moderacao.castigo")} onClick={() => void castigarMembro()} perigo>
        <Clock size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label={t("servidor.moderacao.copiarId")} onClick={() => void copiarId()}>
        <IdCard size={18} />
      </AcaoDoTopo>
    </div>
  );
};

const AcaoDoTopo: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  perigo?: boolean;
}> = ({ children, label, onClick, perigo }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded bg-surface-3 py-2.5 text-ink-muted transition hover:bg-surface-4",
        perigo ? "hover:text-danger" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const TITULOS: Record<"todas" | "links" | "midia", string> = {
  todas: "servidor.moderacao.mensagens",
  links: "servidor.moderacao.links",
  midia: "servidor.moderacao.midia",
};

const ListaDeMensagens: React.FC<{
  guildId: string;
  userId: string;
  filtro: "todas" | "links" | "midia";
  onVoltar: () => void;
  onIrParaMensagem: (channelId: string, messageId: string) => void;
}> = ({ guildId, userId, filtro, onVoltar, onIrParaMensagem }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useModerationMessages(guildId, userId, filtro);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-divisor bg-surface-2 px-4 py-2.5">
        <button
          onClick={onVoltar}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} /> {t("servidor.moderacao.voltar")}
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {t(TITULOS[filtro])}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {isLoading && <p className="py-8 text-center text-sm text-ink-muted">{t("comum.carregando")}</p>}

        {data && !data.length && (
          <p className="py-8 text-center text-sm text-ink-muted">{t("servidor.moderacao.vazio")}</p>
        )}

        {data?.map((mensagem) => (
          <MensagemDaLista
            key={mensagem.id}
            mensagem={mensagem}
            filtro={filtro}
            onIr={() => onIrParaMensagem(mensagem.channelId, mensagem.id)}
          />
        ))}

        {data && data.length >= 50 && (
          <p className="pt-2 text-center text-xs text-ink-faint">
            {t("servidor.moderacao.cinquenta")}
          </p>
        )}
      </div>
    </div>
  );
};

const MensagemDaLista: React.FC<{
  mensagem: ModerationMessageModel;
  filtro: "todas" | "links" | "midia";
  onIr: () => void;
}> = ({ mensagem, filtro, onIr }) => {
  const { t } = useTranslation();

  return (
  <article className="group/msg rounded-lg bg-surface-1 p-3">
    <header className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-faint">
      {mensagem.channelType === "VOICE" ? <Volume2 size={12} /> : <Hash size={12} />}
      <span className="min-w-0 flex-1 truncate font-medium text-ink-muted">
        {mensagem.channelName}
      </span>

      <button
        onClick={onIr}
        className="rounded bg-surface-3 px-1.5 py-0.5 text-11 opacity-0 transition group-hover/msg:opacity-100 hover:text-ink"
      >
        {t("servidor.moderacao.irParaMensagem")}
      </button>

      <time dateTime={mensagem.createdAt}>
        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
          new Date(mensagem.createdAt),
        )}
      </time>
    </header>

    {filtro === "links" && <LinksDaMensagem conteudo={mensagem.content} />}

    {mensagem.content && (
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-sm",
          filtro === "links" && "mt-2 line-clamp-2 text-xs text-ink-faint",
        )}
      >
        {mensagem.content}
      </p>
    )}

    {mensagem.attachments.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-2">
        {mensagem.attachments.map((anexo) =>
          anexo.contentType.startsWith("image/") ? (
            <img
              key={anexo.url}
              src={anexo.url}
              alt={anexo.filename}
              className="max-h-32 rounded object-cover"
            />
          ) : (
            <span
              key={anexo.url}
              className="rounded bg-surface-3 px-2 py-1 text-xs text-ink-muted"
            >
              {anexo.filename}
            </span>
          ),
        )}
      </div>
    )}
  </article>
  );
};

const LinksDaMensagem: React.FC<{ conteudo: string }> = ({ conteudo }) => {
  const { t } = useTranslation();
  const links = extrairLinks(conteudo, 5);
  if (!links.length) return null;

  return (
    <div className="flex flex-col gap-1">
      {links.map((url) => (
        <LinhaDeLink key={url} url={url} />
      ))}
    </div>
  );
};

const LinhaDeLink: React.FC<{ url: string }> = ({ url }) => {
  const { data: embed } = useEmbed(url);
  const dominio = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
      className="flex items-center gap-2 rounded bg-surface-3 px-2 py-1.5 transition hover:bg-surface-4"
    >
      {embed?.favicon ? (
        <img
          src={embed.favicon}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="size-4 shrink-0 rounded-sm object-contain"
        />
      ) : (
        <Link2 size={14} className="shrink-0 text-ink-faint" />
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-brand">
          {embed?.titulo ?? url}
        </span>
        <span className="block truncate text-11 text-ink-faint">
          {embed?.site ?? dominio}
        </span>
      </span>
    </a>
  );
};

const Secao: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="mb-4">
    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{titulo}</h4>
    <div className="overflow-hidden rounded-lg bg-surface-1">{children}</div>
  </section>
);

interface LinhaProps {
  icone?: React.ReactNode;
  rotulo: string;
  valor: number | string;
  data?: boolean;
  alerta?: boolean;
  onClick?: () => void;
}

const Linha: React.FC<LinhaProps> = ({ icone, rotulo, valor, data, alerta, onClick }) => {
  const { t } = useTranslation();
  const conteudo = (
    <>
      {icone && <span className="shrink-0 text-ink-faint">{icone}</span>}
      <span className="min-w-0 flex-1 truncate text-left text-sm">{rotulo}</span>
      <span className={alerta ? "text-sm font-semibold text-danger" : "text-sm text-ink-muted"}>
        {data
          ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(valor))
          : valor}
      </span>
      {onClick && <ChevronRight size={14} className="shrink-0 text-ink-faint" />}
    </>
  );

  const classe = "flex w-full items-center gap-2 border-b border-divisor px-3 py-2.5 last:border-0";

  if (!onClick) return <div className={classe}>{conteudo}</div>;

  return (
    <button onClick={onClick} className={cn(classe, "transition hover:bg-surface-3")}>
      {conteudo}
    </button>
  );
};

const EditorDeCargos: React.FC<{
  guildId: string;
  userId: string;
  roles: Role[];
  atuais: string[];
}> = ({ guildId, userId, roles, atuais }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setRoles = useSetMemberRoles(guildId);

  const atribuiveis = roles.filter((r) => !r.isEveryone);
  const marcados = atribuiveis.filter((r) => atuais.includes(r.id));

  const alternar = (roleId: string) => {
    const proximos = atuais.includes(roleId)
      ? atuais.filter((id) => id !== roleId)
      : [...atuais, roleId];

    setRoles.mutate(
      { guildId, userId, roleIds: proximos },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.moderation] }),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-3">
      {marcados.map((cargo) => (
        <span
          key={cargo.id}
          className="flex items-center gap-1.5 rounded bg-surface-3 px-2 py-1 text-xs"
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: cargo.color || "#99aab5" }}
          />
          {cargo.name}
        </span>
      ))}

      {!marcados.length && <span className="text-xs text-ink-faint">{t("servidor.moderacao.soEveryone")}</span>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={t("servidor.moderacao.adicionarCargo")}
            disabled={setRoles.isPending}
            className="rounded-full bg-surface-3 p-1 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          {atribuiveis.length ? (
            atribuiveis.map((cargo) => {
              const tem = atuais.includes(cargo.id);

              return (
                <DropdownMenuItem
                  key={cargo.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    alternar(cargo.id);
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: cargo.color || "#99aab5" }}
                    />
                    <span className="truncate">{cargo.name}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      tem ? "border-brand bg-brand text-white" : "border-line",
                    )}
                  >
                    {tem && <Check size={11} />}
                  </span>
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>{t("servidor.moderacao.semCargos")}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
