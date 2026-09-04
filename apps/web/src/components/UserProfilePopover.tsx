import React, { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  comoSeLe,
  enderecoDaConexao,
  NOMES_DOS_SERVICOS,
  type Conexao,
} from "@gravae/shared";
import { toast } from "react-toastify";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  SendHorizontal,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast as aviso } from "react-toastify";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { highestPosition, type Role } from "@gravae/shared";

import { useModeracao } from "~/stores/moderacao";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import { ProfileEditorModal } from "~/components/profile/ProfileEditorModal";
import { StatusModal } from "~/components/profile/StatusModal";
import { CampoDeNota } from "~/components/profile/CampoDeNota";
import { EscolherEmblemas } from "~/components/profile/EscolherEmblemas";
import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { Tooltip } from "~/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FullProfileModal } from "~/components/FullProfileModal";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useCreateInvite } from "~/@core/application/queries/guild/use-create-invite";
import { useBlockUser } from "~/@core/application/queries/friend/use-block-user";
import { useIgnoreStore } from "~/stores/ignore-store";
import { sendMessage } from "~/@core/lib/websocket/send-message";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useConfirmar } from "~/components/ui/confirm";
import { useEnfeites } from "~/hooks/use-enfeites";
import { usePermissions } from "~/hooks/use-permissions";
import { copiarTexto } from "~/lib/copiar";
import { corDoCargoMaisAlto } from "~/lib/cosmeticos/cargo";
import { useTranslation } from "~/traducao";

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  guildId?: string;
  roles?: Role[];
  roleIds?: string[];
  podeModerar?: boolean;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  userId,
  children,
  side = "right",
  guildId,
  roles = [],
  roleIds = [],
  podeModerar = false,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const { data: perfil, isLoading } = useFindProfile(aberto ? userId : null);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side={side}
        className="max-h-[80vh] w-80 overflow-y-auto p-0"
      >
        {isLoading || !perfil ? (
          <div className="p-6 text-sm text-ink-faint">{t("perfil.carregando")}</div>
        ) : (
          <ProfileCard
            perfil={perfil}
            onFechar={() => setAberto(false)}
            guildId={guildId}
            roles={roles}
            roleIds={roleIds}
            podeModerar={podeModerar}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

const ProfileCard: React.FC<{
  perfil: ProfileModel;
  onFechar: () => void;
  guildId?: string;
  roles: Role[];
  roleIds: string[];
  podeModerar: boolean;
}> = ({ perfil, onFechar, guildId, roles, roleIds, podeModerar }) => {
  const { t } = useTranslation();
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [definindoStatus, setDefinindoStatus] = useState(false);
  const { data: eu } = useMe(true);
  const updateProfile = useUpdateProfile();

  const bloquear = useBlockUser();
  const guilds = useFindManyGuilds(true);
  const criarConvite = useCreateInvite();
  const ignorados = useIgnoreStore((s) => s.ignorados);
  const alternarIgnorado = useIgnoreStore((s) => s.alternar);

  const ignorado = ignorados.includes(perfil.id);

  const enfeitesDe = useEnfeites(guildId);
  const emblemas = enfeitesDe.emblemasDe(perfil.id);
  const { data: detalheDoServidor } = useFindGuild(guildId);
  const { can } = usePermissions(detalheDoServidor);
  const setRoles = useSetMemberRoles(guildId);

  const cargosDoServidor = detalheDoServidor?.roles ?? roles;
  const membrosDoServidor = detalheDoServidor?.members ?? [];
  const idsDoMembro =
    membrosDoServidor.find((m) => m.user.id === perfil.id)?.roleIds ?? roleIds;

  const cargosDoMembro = cargosDoServidor.filter(
    (r) => !r.isEveryone && idsDoMembro.includes(r.id),
  );

  const corDoCargo = corDoCargoMaisAlto(idsDoMembro, cargosDoServidor);

  const souDono = Boolean(eu && detalheDoServidor?.guild.ownerId === eu.id);
  const meusIds =
    membrosDoServidor.find((m) => m.user.id === eu?.id)?.roleIds ?? [];
  const minhaPosicao = souDono
    ? Number.POSITIVE_INFINITY
    : highestPosition(cargosDoServidor.filter((r) => meusIds.includes(r.id)));

  const podeMexerNaPessoa =
    souDono || highestPosition(cargosDoMembro) < minhaPosicao;

  const cargosQuePossoDar =
    guildId && can("MANAGE_ROLES") && podeMexerNaPessoa
      ? cargosDoServidor.filter(
          (r) => !r.isEveryone && r.position < minhaPosicao,
        )
      : [];

  const alternarCargo = (roleId: string) => {
    if (!guildId) return;

    const proximos = idsDoMembro.includes(roleId)
      ? idsDoMembro.filter((id) => id !== roleId)
      : [...idsDoMembro, roleId];

    setRoles.mutate({ guildId, userId: perfil.id, roleIds: proximos });
  };

  const convidarPara = async (targetGuildId: string) => {
    const convite = await criarConvite
      .mutateAsync({ guildId: targetGuildId })
      .catch(() => null);
    if (!convite) return;

    const link = `${window.location.origin}/invite/${convite.code}`;

    if (perfil.friendship === "ACCEPTED") {
      const canal = await openDm.mutateAsync(perfil.id).catch(() => null);

      if (canal) {
        await sendMessage({
          channelId: canal.id,
          content: link,
          nonce: crypto.randomUUID(),
        });
        return aviso.success(t("perfil.conviteEnviado", { nome: perfil.displayName }));
      }
    }

    await copiarTexto(link);
    aviso.info(t("perfil.amizade.linkCopiado"));
  };
  const navigate = useNavigate();
  const requestFriend = useRequestFriend();
  const respondFriend = useRespondFriend();
  const confirmar = useConfirmar();
  const removeFriend = useRemoveFriend();
  const openDm = useOpenDm();

  const desfazerAmizade = async () => {
    const { confirmado } = await confirmar({
      titulo: t("perfil.amizade.desfazerTitulo", { nome: perfil.displayName }),
      descricao:
        t("perfil.amizade.desfazerDescricao"),
      acao: t("perfil.amizade.desfazer"),
    });

    if (confirmado && perfil.friendshipId)
      removeFriend.mutate(perfil.friendshipId);
  };

  const bloquearUsuario = async () => {
    const { confirmado } = await confirmar({
      titulo: t("perfil.amizade.bloquearTitulo", { nome: perfil.displayName }),
      descricao:
        t("perfil.amizade.bloquearDescricao"),
      acao: t("perfil.amizade.bloquear"),
    });

    if (confirmado) {
      bloquear.mutate(perfil.id);
      onFechar();
    }
  };

  const conversar = async () => {
    const canal = await openDm.mutateAsync(perfil.id).catch(() => null);
    if (!canal) return;

    onFechar();
    navigate(`/dm/${canal.id}`);
  };

  const ocupado =
    requestFriend.isPending ||
    respondFriend.isPending ||
    removeFriend.isPending ||
    openDm.isPending;

  const acoes = (
    <>
      {perfil.friendship === "SELF" ? (
        <Button size="sm" onClick={() => setEditandoPerfil(true)}>
          <Pencil size={14} /> {t("perfil.editar")}
        </Button>
      ) : (
        <>
          {perfil.friendship === "ACCEPTED" && (
            <Button
              size="sm"
              onClick={() => void conversar()}
              disabled={ocupado}
            >
              <MessageSquare size={14} /> {t("perfil.mensagem")}
            </Button>
          )}

          {podeModerar && guildId && (
            <BotaoRedondo
              label={t("perfil.moderador")}
              onClick={() => {
                useModeracao.getState().abrir({
                  guildId,
                  userId: perfil.id,
                  displayName: perfil.displayName,
                  username: perfil.username,
                  avatarUrl: perfil.avatarUrl,
                });
                onFechar();
              }}
            >
              <ShieldAlert size={16} />
            </BotaoRedondo>
          )}

          <BotaoDeAmizade
            perfil={perfil}
            onAdicionar={() => requestFriend.mutate(perfil.username)}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("perfil.mais")}
                className="rounded-full bg-surface-3 p-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {perfil.friendship === "ACCEPTED" && (
                <>
                  <DropdownMenuItem onSelect={() => void conversar()}>
                    {t("perfil.abrirConversa")} <MessageSquare size={14} />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onSelect={() => setPerfilCompleto(true)}>
                {t("perfil.verCompleto")} <User size={14} />
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t("perfil.convidarParaServidor")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {guilds.data?.length ? (
                    guilds.data.map((servidor) => (
                      <DropdownMenuItem
                        key={servidor.id}
                        onSelect={() => void convidarPara(servidor.id)}
                      >
                        {servidor.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      {t("perfil.semServidores")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => alternarIgnorado(perfil.id)}>
                {t(ignorado ? "perfil.deixarDeIgnorar" : "perfil.ignorar")}
                {ignorado ? <Eye size={14} /> : <EyeOff size={14} />}
              </DropdownMenuItem>

              <DropdownMenuItem danger onSelect={() => void bloquearUsuario()}>
                {t("perfil.amizade.bloquear")} <Ban size={14} />
              </DropdownMenuItem>

              {perfil.friendship === "ACCEPTED" && (
                <DropdownMenuItem
                  danger
                  onSelect={() => void desfazerAmizade()}
                >
                  {t("perfil.amizade.desfazer")} <UserX size={14} />
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  void copiarTexto(perfil.id);
                  aviso.success(t("perfil.idCopiado"));
                }}
              >
                {t("perfil.copiarId")} <Copy size={14} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </>
  );

  return (
    <>
      {editandoPerfil && eu && (
        <ProfileEditorModal
          open
          user={eu}
          onClose={() => setEditandoPerfil(false)}
        />
      )}

      {definindoStatus && eu && (
        <StatusModal
          open
          user={eu}
          perfil={eu.perfil}
          onClose={() => setDefinindoStatus(false)}
          onSalvar={(status) =>
            void updateProfile
              .mutateAsync({ statusPersonalizado: status })
              .then(() => setDefinindoStatus(false))
              .catch(() => null)
          }
          salvando={updateProfile.isPending}
        />
      )}

      {perfilCompleto && (
        <FullProfileModal
          open
          perfil={perfil}
          cargos={cargosDoMembro}
          onClose={() => setPerfilCompleto(false)}
        />
      )}

      <ProfileCardVisual
        id={perfil.id}
        displayName={perfil.displayName}
        username={perfil.username}
        avatarUrl={perfil.avatarUrl}
        status={perfil.status}
        perfil={perfil.perfil}
        etiquetaDoServidor={perfil.etiquetaDoServidor}
        statusPersonalizado={perfil.statusPersonalizado}
        corDoCargo={corDoCargo}
        bio={perfil.bio}
        createdAt={perfil.createdAt}
        mutualFriends={perfil.mutualFriends}
        mutualGuilds={perfil.mutualGuilds}
        cargos={cargosDoMembro}
        cargosDisponiveis={cargosQuePossoDar}
        onAlternarCargo={cargosQuePossoDar.length ? alternarCargo : undefined}
        salvandoCargos={setRoles.isPending}
        onStatus={
          perfil.friendship === "SELF"
            ? () => setDefinindoStatus(true)
            : undefined
        }
        emblemas={emblemas}
        acoes={acoes}
        className="rounded-none"
      >
        <ConexoesDoPerfil conexoes={perfil.perfil?.conexoes} />

        {perfil.friendship !== "SELF" && (
          <CampoDeNota userId={perfil.id} nota={perfil.nota} />
        )}

        {perfil.friendship === "SELF" && guildId && (
          <EscolherEmblemas
            guildId={guildId}
            disponiveis={detalheDoServidor?.emblemas ?? []}
            vestidos={emblemas}
          />
        )}

        <div className="mt-4 space-y-2">
          {perfil.friendship !== "SELF" && (
            <>
              {perfil.friendship === "PENDING_IN" && (
                <>
                  <p className="mb-1 text-center text-xs text-ink-faint">
                    {t("perfil.amizade.teMandouPedido")}
                  </p>
                  <Button
                    variant="success"
                    onClick={() =>
                      perfil.friendshipId &&
                      respondFriend.mutate({
                        friendshipId: perfil.friendshipId,
                        accept: true,
                      })
                    }
                    disabled={ocupado}
                    className="w-full"
                  >
                    <Check size={16} /> {t("perfil.amizade.aceitar")}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </ProfileCardVisual>

      {perfil.friendship === "ACCEPTED" && (
        <ComposerDoPerfil userId={perfil.id} username={perfil.username} />
      )}
    </>
  );
};

const ComposerDoPerfil: React.FC<{ userId: string; username: string }> = ({
  userId,
  username,
}) => {
  const { t } = useTranslation();
  const openDm = useOpenDm();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  const enviar = async () => {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setEnviando(true);

    try {
      const canal = await openDm.mutateAsync(userId);
      await sendMessage({
        channelId: canal.id,
        content: conteudo,
        nonce: crypto.randomUUID(),
      });

      setTexto("");
      setEnviada(true);
      setTimeout(() => setEnviada(false), 2500);
    } catch {
      toast.error(t("perfil.recado.falhou"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-1.5 rounded bg-surface-0 pr-1.5">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          placeholder={t("perfil.recado.escrever", { usuario: username })}
          disabled={enviando}
          className="border-0 bg-transparent text-sm"
        />
        <button
          onClick={() => void enviar()}
          disabled={!texto.trim() || enviando}
          aria-label={t("perfil.recado.enviar")}
          className="shrink-0 rounded p-1.5 text-ink-muted transition hover:text-ink disabled:opacity-40"
        >
          <SendHorizontal size={16} />
        </button>
      </div>

      {enviada && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-online">
          <Check size={12} /> {t("perfil.recado.enviada")}
        </p>
      )}
    </div>
  );
};

const BotaoRedondo: React.FC<{
  children: ReactNode;
  label: string;
  onClick?: () => void;
  desabilitado?: boolean;
}> = ({ children, label, onClick, desabilitado }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      disabled={desabilitado}
      aria-label={label}
      className="rounded-full bg-surface-3 p-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:cursor-default disabled:hover:bg-surface-3"
    >
      {children}
    </button>
  </Tooltip>
);

const BotaoDeAmizade: React.FC<{
  perfil: ProfileModel;
  onAdicionar: () => void;
}> = ({ perfil, onAdicionar }) => {
  const { t } = useTranslation();

  if (perfil.friendship === "ACCEPTED") {
    return (
      <BotaoRedondo label={t("perfil.amizade.amigo")} desabilitado>
        <UserCheck size={16} className="text-online" />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_OUT") {
    return (
      <BotaoRedondo label={t("perfil.amizade.pedidoEnviado")} desabilitado>
        <Clock size={16} />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_IN") {
    return (
      <BotaoRedondo label={t("perfil.amizade.respondaAbaixo")} desabilitado>
        <UserPlus size={16} className="text-idle" />
      </BotaoRedondo>
    );
  }

  return (
    <BotaoRedondo label={t("perfil.amizade.adicionar")} onClick={onAdicionar}>
      <UserPlus size={16} />
    </BotaoRedondo>
  );
};

const ConexoesDoPerfil: React.FC<{ conexoes?: Conexao[] }> = ({ conexoes }) => {
  const { t } = useTranslation();
  const validas = (conexoes ?? [])
    .map((conexao) => ({ conexao, endereco: enderecoDaConexao(conexao) }))
    .filter(
      (c): c is { conexao: Conexao; endereco: string } => c.endereco !== null,
    );

  if (!validas.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        {t("perfil.conexoes")}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {validas.map(({ conexao, endereco }, indice) => (
          <a
            key={`${conexao.servico}-${indice}`}
            href={endereco}
            target="_blank"
            rel="noreferrer noopener"
            title={`${NOMES_DOS_SERVICOS[conexao.servico]} — ${comoSeLe(conexao)}`}
            className="flex max-w-full items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-11 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
          >
            <Link2 size={12} className="shrink-0" />
            <span className="truncate">{comoSeLe(conexao)}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
