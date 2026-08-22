import React, { useState } from "react";
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
} from "lucide-react";
import type { Role } from "@gravae/shared";

import { useModerationView } from "~/@core/application/queries/guild/use-moderation-view";
import { useModerationMessages } from "~/@core/application/queries/guild/use-moderation-messages";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { useBanMember, useTimeoutMember } from "~/@core/application/queries/moderation/use-moderation";
import type { ModerationMessageModel } from "~/@core/domain/models/moderation-model";
import { Avatar } from "~/components/Avatar";
import { Sheet, SheetCloseButton, SheetContent, SheetTitle } from "~/components/ui/sheet";
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

interface ModeratorViewProps {
  open: boolean;
  guildId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  roles: Role[];
  onClose: () => void;
}

/** Qual lista o "ver mais" abriu; `null` = a ficha. */
type Detalhe = "todas" | "links" | "midia" | null;

/**
 * A ficha de um membro para quem modera, numa gaveta lateral.
 *
 * Junta num lugar só o que estava espalhado: quanto a pessoa fala, o que ela
 * pode fazer, desde quando está aqui, se já apareceu na auditoria — e as ações
 * (expulsar, banir, castigo) logo no topo. A decisão costuma depender
 * exatamente disso, e abrir três telas pra juntar é o que faz moderador
 * decidir no chute.
 *
 * Gaveta e não modal centralizado de propósito: moderar é uma tarefa de
 * consulta, e o conteúdo do canal precisa continuar visível ao lado enquanto
 * se lê a ficha.
 */
export const ModeratorView: React.FC<ModeratorViewProps> = ({
  open,
  guildId,
  userId,
  displayName,
  username,
  avatarUrl,
  roles,
  onClose,
}) => {
  const navigate = useNavigate();
  const [detalhe, setDetalhe] = useState<Detalhe>(null);
  const { data, isLoading, error } = useModerationView(open ? guildId : null, open ? userId : null);

  return (
    <Sheet
      open={open}
      onOpenChange={(aberto) => {
        if (aberto) return;
        setDetalhe(null);
        onClose();
      }}
    >
      <SheetContent>
        <header className="shrink-0 border-b border-black/30 bg-surface-1">
          <div className="flex items-center gap-3 p-4">
            <Avatar id={userId} name={displayName} url={avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base font-semibold">{displayName}</SheetTitle>
              <p className="truncate text-xs text-ink-muted">@{username}</p>
            </div>
            <SheetCloseButton />
          </div>

          <BarraDeAcoes
            guildId={guildId}
            userId={userId}
            displayName={displayName}
            onFechar={onClose}
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {detalhe ? (
            <ListaDeMensagens
              guildId={guildId}
              userId={userId}
              filtro={detalhe}
              onVoltar={() => setDetalhe(null)}
              onIrParaMensagem={(channelId, messageId) => {
                // fecha a gaveta: o canal está atrás dela, e ficar aberta
                // esconderia justamente a mensagem que a pessoa foi ver
                onClose();
                navigate(`/channels/${guildId}/${channelId}?m=${messageId}`);
              }}
            />
          ) : (
            <div className="p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldAlert size={16} className="text-brand" /> Visualização de moderador
              </p>

              {error && (
                <p className="rounded bg-danger/10 p-3 text-sm text-danger">
                  Você precisa da permissão “Moderar membros” para ver isto.
                </p>
              )}

              {isLoading && <p className="py-8 text-center text-sm text-ink-muted">Carregando…</p>}

              {data && (
                <>
                  <Secao titulo="Atividade no servidor">
                    <Linha
                      icone={<MessageSquare size={15} />}
                      rotulo="Mensagens"
                      valor={data.atividade.mensagens}
                      onClick={data.atividade.mensagens ? () => setDetalhe("todas") : undefined}
                    />
                    <Linha
                      icone={<Link2 size={15} />}
                      rotulo="Links"
                      valor={data.atividade.links}
                      onClick={data.atividade.links ? () => setDetalhe("links") : undefined}
                    />
                    <Linha
                      icone={<ImageIcon size={15} />}
                      rotulo="Mídia"
                      valor={data.atividade.midia}
                      onClick={data.atividade.midia ? () => setDetalhe("midia") : undefined}
                    />
                    <Linha
                      icone={<FileText size={15} />}
                      rotulo="Ações na auditoria"
                      valor={data.auditoria.feitas}
                    />
                    <Linha
                      icone={<ShieldAlert size={15} />}
                      rotulo="Moderações sofridas"
                      valor={data.auditoria.sofridas}
                      alerta={data.auditoria.sofridas > 0}
                    />
                  </Secao>

                  <Secao titulo={`Permissões (${data.permissoes.length})`}>
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
                        <span className="text-xs text-ink-faint">Nenhuma permissão especial.</span>
                      )}
                    </div>
                  </Secao>

                  <Secao titulo="Cargos">
                    <EditorDeCargos
                      guildId={guildId}
                      userId={userId}
                      roles={roles}
                      atuais={data.roleIds}
                    />
                  </Secao>

                  <Secao titulo="Conta">
                    <Linha rotulo="Entrou no servidor" valor={data.entrouNoServidor} data />
                    <Linha rotulo="Conta criada em" valor={data.entrouNoGravae} data />
                    {data.timeoutUntil && (
                      <Linha rotulo="De castigo até" valor={data.timeoutUntil} data alerta />
                    )}
                    <Linha
                      icone={<Ticket size={15} />}
                      rotulo="Forma de adesão"
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
      </SheetContent>
    </Sheet>
  );
};

// ------------------------------------------------------------------ ações

const BarraDeAcoes: React.FC<{
  guildId: string;
  userId: string;
  displayName: string;
  onFechar: () => void;
}> = ({ guildId, userId, displayName, onFechar }) => {
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const openDm = useOpenDm();
  const removeMember = useRemoveMember();
  const banir = useBanMember(guildId);
  const castigar = useTimeoutMember(guildId);

  const conversar = async () => {
    const canal = await openDm.mutateAsync(userId).catch(() => null);
    if (!canal) return toast.error("Vocês precisam ser amigos para conversar.");

    onFechar();
    navigate(`/dm/${canal.id}`);
  };

  const expulsar = async () => {
    const { confirmado } = await confirmar({
      titulo: `Expulsar ${displayName}?`,
      descricao: "Sai do servidor na hora, mas pode voltar com um convite.",
      acao: "Expulsar",
    });

    if (confirmado) {
      removeMember.mutate({ guildId, userId });
      onFechar();
    }
  };

  const banirMembro = async () => {
    const { confirmado, texto } = await confirmar({
      titulo: `Banir ${displayName}?`,
      descricao: "Sai do servidor e não consegue voltar, nem com convite, até ser desbanido.",
      acao: "Banir",
      campo: { rotulo: "Motivo (opcional)", placeholder: "Fica registrado na auditoria" },
    });

    if (confirmado) {
      banir.mutate({ guildId, userId, reason: texto || null });
      onFechar();
    }
  };

  /**
   * O castigo pede minutos em vez de oferecer botões prontos: o intervalo útil
   * vai de 5 minutos a uma semana, e uma lista que cobrisse isso teria opções
   * demais pra escolher rápido.
   */
  const castigarMembro = async () => {
    const { confirmado, texto } = await confirmar({
      titulo: `Castigar ${displayName}?`,
      descricao: "Enquanto durar, não escreve nem fala em nenhum canal do servidor.",
      acao: "Aplicar castigo",
      campo: { rotulo: "Duração em minutos", placeholder: "60", obrigatorio: true },
    });

    if (!confirmado) return;

    const minutos = Number(texto);
    if (!Number.isFinite(minutos) || minutos <= 0) {
      return toast.error("Informe a duração em minutos.");
    }

    castigar.mutate({ guildId, userId, minutos });
    onFechar();
  };

  const copiarId = async () => {
    await navigator.clipboard.writeText(userId);
    toast.success("ID copiado.");
  };

  return (
    <div className="grid grid-cols-5 gap-1 border-t border-black/20 p-2">
      <AcaoDoTopo label="Mensagem" onClick={() => void conversar()}>
        <MessageSquare size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label="Expulsar" onClick={() => void expulsar()} perigo>
        <UserMinus size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label="Banir" onClick={() => void banirMembro()} perigo>
        <Gavel size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label="Castigo" onClick={() => void castigarMembro()} perigo>
        <Clock size={18} />
      </AcaoDoTopo>
      <AcaoDoTopo label="Copiar ID" onClick={() => void copiarId()}>
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

// ------------------------------------------------------------- "ver mais"

const TITULOS: Record<"todas" | "links" | "midia", string> = {
  todas: "Mensagens",
  links: "Links",
  midia: "Mídia",
};

const ListaDeMensagens: React.FC<{
  guildId: string;
  userId: string;
  filtro: "todas" | "links" | "midia";
  onVoltar: () => void;
  onIrParaMensagem: (channelId: string, messageId: string) => void;
}> = ({ guildId, userId, filtro, onVoltar, onIrParaMensagem }) => {
  const { data, isLoading } = useModerationMessages(guildId, userId, filtro);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/20 bg-surface-2 px-4 py-2.5">
        <button
          onClick={onVoltar}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {TITULOS[filtro]}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {isLoading && <p className="py-8 text-center text-sm text-ink-muted">Carregando…</p>}

        {data && !data.length && (
          <p className="py-8 text-center text-sm text-ink-muted">Nada por aqui.</p>
        )}

        {data?.map((mensagem) => (
          <MensagemDaLista
            key={mensagem.id}
            mensagem={mensagem}
            onIr={() => onIrParaMensagem(mensagem.channelId, mensagem.id)}
          />
        ))}

        {/* O teto de 50 é do servidor. Dizer isso evita a conclusão errada de
            que a pessoa mandou exatamente 50 mensagens. */}
        {data && data.length >= 50 && (
          <p className="pt-2 text-center text-xs text-ink-faint">
            Mostrando as 50 mais recentes.
          </p>
        )}
      </div>
    </div>
  );
};

const MensagemDaLista: React.FC<{ mensagem: ModerationMessageModel; onIr: () => void }> = ({
  mensagem,
  onIr,
}) => (
  <article className="group/msg rounded-lg bg-surface-1 p-3">
    <header className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-faint">
      {mensagem.channelType === "VOICE" ? <Volume2 size={12} /> : <Hash size={12} />}
      <span className="min-w-0 flex-1 truncate font-medium text-ink-muted">
        {mensagem.channelName}
      </span>

      {/* aparece no hover, como no Discord: a data é a informação constante,
          e o botão só interessa quando você decidiu ir olhar de perto */}
      <button
        onClick={onIr}
        className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] opacity-0 transition group-hover/msg:opacity-100 hover:text-ink"
      >
        Ir para mensagem
      </button>

      <time dateTime={mensagem.createdAt}>
        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
          new Date(mensagem.createdAt),
        )}
      </time>
    </header>

    {mensagem.content && (
      <p className="whitespace-pre-wrap break-words text-sm">{mensagem.content}</p>
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

// ---------------------------------------------------------------- pedaços

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
  /** formata como data em vez de número */
  data?: boolean;
  alerta?: boolean;
  /** presente = a linha vira botão e ganha a seta de "ver mais" */
  onClick?: () => void;
}

const Linha: React.FC<LinhaProps> = ({ icone, rotulo, valor, data, alerta, onClick }) => {
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

  const classe = "flex w-full items-center gap-2 border-b border-black/20 px-3 py-2.5 last:border-0";

  if (!onClick) return <div className={classe}>{conteudo}</div>;

  return (
    <button onClick={onClick} className={cn(classe, "transition hover:bg-surface-3")}>
      {conteudo}
    </button>
  );
};

/**
 * Cargos com o `+` que abre a lista marcável, como no Discord.
 *
 * Marcar aplica na hora, sem botão de salvar: é uma escolha por vez e o efeito
 * é imediato no servidor — um "salvar" só criaria a dúvida de se ficou
 * pendente.
 */
const EditorDeCargos: React.FC<{
  guildId: string;
  userId: string;
  roles: Role[];
  atuais: string[];
}> = ({ guildId, userId, roles, atuais }) => {
  const queryClient = useQueryClient();
  const setRoles = useSetMemberRoles(guildId);

  // o @everyone é implícito: todo mundo tem, ninguém escolhe
  const atribuiveis = roles.filter((r) => !r.isEveryone);
  const marcados = atribuiveis.filter((r) => atuais.includes(r.id));

  const alternar = (roleId: string) => {
    const proximos = atuais.includes(roleId)
      ? atuais.filter((id) => id !== roleId)
      : [...atuais, roleId];

    setRoles.mutate(
      { guildId, userId, roleIds: proximos },
      {
        // a ficha tem os cargos junto com as contagens; sem isto o `+` marca e
        // a lista de baixo continua mostrando o estado antigo
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

      {!marcados.length && <span className="text-xs text-ink-faint">Só o @everyone.</span>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Adicionar cargo"
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
                  // sem isto o menu fecha a cada clique, e marcar três cargos
                  // exigiria reabrir três vezes
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
            <DropdownMenuItem disabled>Nenhum cargo criado</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
