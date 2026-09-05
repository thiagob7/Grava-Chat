import React, { useRef, useState, type ReactNode } from "react";
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

import { useModeracao } from "~/features/servidor/stores/moderacao";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import { ProfileEditorModal } from "~/features/perfil/components/cartao/ProfileEditorModal";
import { StatusModal } from "~/features/perfil/components/cartao/StatusModal";
import { CampoDeNota } from "~/features/perfil/components/cartao/CampoDeNota";
import { EscolherEmblemas } from "~/features/perfil/components/cartao/EscolherEmblemas";
import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
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
import { FullProfileModal } from "~/features/perfil/components/FullProfileModal";
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
import { useEnfeites } from "~/features/perfil/hooks/use-enfeites";
import { usePermissions } from "~/hooks/use-permissions";
import { copiarTexto } from "~/lib/copiar";
import { corDoCargoMaisAlto } from "~/features/perfil/lib/cargo";
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
    <Popover data-gc="perfil.user-profile-popover.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="perfil.user-profile-popover.popover-trigger" asChild>{children}</PopoverTrigger>

      <PopoverContent data-gc="perfil.user-profile-popover.popover-content"
        side={side}
        className="max-h-[80vh] w-80 overflow-y-auto p-0"
      >
        {isLoading || !perfil ? (
          <div data-gc="perfil.user-profile-popover.div" className="p-6 text-sm text-ink-faint">{t("perfil.carregando")}</div>
        ) : (
          <ProfileCard data-gc="perfil.user-profile-popover.profile-card"
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
  const campoDaNota = useRef<HTMLTextAreaElement>(null);
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
        <Button data-gc="perfil.user-profile-popover.button" size="sm" onClick={() => setEditandoPerfil(true)}>
          <Pencil data-gc="perfil.user-profile-popover.pencil" size={14} /> {t("perfil.editar")}
        </Button>
      ) : (
        <>
          {perfil.friendship === "ACCEPTED" && (
            <Button data-gc="perfil.user-profile-popover.button--2"
              size="sm"
              onClick={() => void conversar()}
              disabled={ocupado}
            >
              <MessageSquare data-gc="perfil.user-profile-popover.message-square" size={14} /> {t("perfil.mensagem")}
            </Button>
          )}

          {podeModerar && guildId && (
            <BotaoRedondo data-gc="perfil.user-profile-popover.botao-redondo"
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
              <ShieldAlert data-gc="perfil.user-profile-popover.shield-alert" size={16} />
            </BotaoRedondo>
          )}

          <BotaoDeAmizade data-gc="perfil.user-profile-popover.botao-de-amizade"
            perfil={perfil}
            onAdicionar={() => requestFriend.mutate(perfil.username)}
          />

          <DropdownMenu data-gc="perfil.user-profile-popover.dropdown-menu">
            <DropdownMenuTrigger data-gc="perfil.user-profile-popover.dropdown-menu-trigger" asChild>
              <button data-gc="perfil.user-profile-popover.button--3"
                aria-label={t("perfil.mais")}
                className="rounded-full bg-surface-3 p-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <MoreHorizontal data-gc="perfil.user-profile-popover.more-horizontal" size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="perfil.user-profile-popover.dropdown-menu-content" align="end">
              {perfil.friendship === "ACCEPTED" && (
                <>
                  <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item" onSelect={() => void conversar()}>
                    {t("perfil.abrirConversa")} <MessageSquare data-gc="perfil.user-profile-popover.message-square--2" size={14} />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator" />
                </>
              )}

              <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--2" onSelect={() => setPerfilCompleto(true)}>
                {t("perfil.verCompleto")} <User data-gc="perfil.user-profile-popover.user" size={14} />
              </DropdownMenuItem>

              <DropdownMenuSub data-gc="perfil.user-profile-popover.dropdown-menu-sub">
                <DropdownMenuSubTrigger data-gc="perfil.user-profile-popover.dropdown-menu-sub-trigger">
                  {t("perfil.convidarParaServidor")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent data-gc="perfil.user-profile-popover.dropdown-menu-sub-content">
                  {guilds.data?.length ? (
                    guilds.data.map((servidor) => (
                      <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--3"
                        key={servidor.id}
                        onSelect={() => void convidarPara(servidor.id)}
                      >
                        {servidor.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--4" disabled>
                      {t("perfil.semServidores")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator--2" />

              <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--5" onSelect={() => alternarIgnorado(perfil.id)}>
                {t(ignorado ? "perfil.deixarDeIgnorar" : "perfil.ignorar")}
                {ignorado ? <Eye data-gc="perfil.user-profile-popover.eye" size={14} /> : <EyeOff data-gc="perfil.user-profile-popover.eye-off" size={14} />}
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--6" danger onSelect={() => void bloquearUsuario()}>
                {t("perfil.amizade.bloquear")} <Ban data-gc="perfil.user-profile-popover.ban" size={14} />
              </DropdownMenuItem>

              {perfil.friendship === "ACCEPTED" && (
                <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--7"
                  danger
                  onSelect={() => void desfazerAmizade()}
                >
                  {t("perfil.amizade.desfazer")} <UserX data-gc="perfil.user-profile-popover.user-x" size={14} />
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator data-gc="perfil.user-profile-popover.dropdown-menu-separator--3" />

              <DropdownMenuItem data-gc="perfil.user-profile-popover.dropdown-menu-item--8"
                onSelect={() => {
                  void copiarTexto(perfil.id);
                  aviso.success(t("perfil.idCopiado"));
                }}
              >
                {t("perfil.copiarId")} <Copy data-gc="perfil.user-profile-popover.copy" size={14} />
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
        <ProfileEditorModal data-gc="perfil.user-profile-popover.profile-editor-modal"
          open
          user={eu}
          onClose={() => setEditandoPerfil(false)}
        />
      )}

      {definindoStatus && eu && (
        <StatusModal data-gc="perfil.user-profile-popover.status-modal"
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
        <FullProfileModal data-gc="perfil.user-profile-popover.full-profile-modal"
          open
          perfil={perfil}
          cargos={cargosDoMembro}
          onClose={() => setPerfilCompleto(false)}
        />
      )}

      <ProfileCardVisual data-gc="perfil.user-profile-popover.profile-card-visual"
        onAbrirPerfil={() => setPerfilCompleto(true)}
        onIrParaNota={
          perfil.friendship === "SELF"
            ? undefined
            : () => {
                campoDaNota.current?.scrollIntoView({ block: "nearest" });
                campoDaNota.current?.focus();
              }
        }
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
        <ConexoesDoPerfil data-gc="perfil.user-profile-popover.conexoes-do-perfil" conexoes={perfil.perfil?.conexoes} />

        {perfil.friendship !== "SELF" && (
          <CampoDeNota data-gc="perfil.user-profile-popover.campo-de-nota" userId={perfil.id} nota={perfil.nota} campo={campoDaNota} />
        )}

        {perfil.friendship === "SELF" && guildId && (
          <EscolherEmblemas data-gc="perfil.user-profile-popover.escolher-emblemas"
            guildId={guildId}
            disponiveis={detalheDoServidor?.emblemas ?? []}
            vestidos={emblemas}
          />
        )}

        <div data-gc="perfil.user-profile-popover.div--2" className="mt-4 space-y-2">
          {perfil.friendship !== "SELF" && (
            <>
              {perfil.friendship === "PENDING_IN" && (
                <>
                  <p data-gc="perfil.user-profile-popover.p" className="mb-1 text-center text-xs text-ink-faint">
                    {t("perfil.amizade.teMandouPedido")}
                  </p>
                  <Button data-gc="perfil.user-profile-popover.button--4"
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
                    <Check data-gc="perfil.user-profile-popover.check" size={16} /> {t("perfil.amizade.aceitar")}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </ProfileCardVisual>

      {perfil.friendship === "ACCEPTED" && (
        <ComposerDoPerfil data-gc="perfil.user-profile-popover.composer-do-perfil" userId={perfil.id} username={perfil.username} />
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
    <div data-gc="perfil.user-profile-popover.div--3" className="border-t border-line p-3">
      <div data-gc="perfil.user-profile-popover.div--4" className="flex items-center gap-1.5 rounded bg-surface-0 pr-1.5">
        <Input data-gc="perfil.user-profile-popover.input"
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
        <button data-gc="perfil.user-profile-popover.button--5"
          onClick={() => void enviar()}
          disabled={!texto.trim() || enviando}
          aria-label={t("perfil.recado.enviar")}
          className="shrink-0 rounded p-1.5 text-ink-muted transition hover:text-ink disabled:opacity-40"
        >
          <SendHorizontal data-gc="perfil.user-profile-popover.send-horizontal" size={16} />
        </button>
      </div>

      {enviada && (
        <p data-gc="perfil.user-profile-popover.p--2" className="mt-1.5 flex items-center gap-1 text-xs text-online">
          <Check data-gc="perfil.user-profile-popover.check--2" size={12} /> {t("perfil.recado.enviada")}
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
  <Tooltip data-gc="perfil.user-profile-popover.tooltip" label={label}>
    <button data-gc="perfil.user-profile-popover.button.on-click"
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
      <BotaoRedondo data-gc="perfil.user-profile-popover.botao-redondo--2" label={t("perfil.amizade.amigo")} desabilitado>
        <UserCheck data-gc="perfil.user-profile-popover.user-check" size={16} className="text-online" />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_OUT") {
    return (
      <BotaoRedondo data-gc="perfil.user-profile-popover.botao-redondo--3" label={t("perfil.amizade.pedidoEnviado")} desabilitado>
        <Clock data-gc="perfil.user-profile-popover.clock" size={16} />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_IN") {
    return (
      <BotaoRedondo data-gc="perfil.user-profile-popover.botao-redondo--4" label={t("perfil.amizade.respondaAbaixo")} desabilitado>
        <UserPlus data-gc="perfil.user-profile-popover.user-plus" size={16} className="text-idle" />
      </BotaoRedondo>
    );
  }

  return (
    <BotaoRedondo data-gc="perfil.user-profile-popover.botao-redondo.on-adicionar" label={t("perfil.amizade.adicionar")} onClick={onAdicionar}>
      <UserPlus data-gc="perfil.user-profile-popover.user-plus--2" size={16} />
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
    <div data-gc="perfil.user-profile-popover.div--5" className="mt-3">
      <p data-gc="perfil.user-profile-popover.p--3" className="mb-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        {t("perfil.conexoes")}
      </p>

      <div data-gc="perfil.user-profile-popover.div--6" className="flex flex-wrap gap-1.5">
        {validas.map(({ conexao, endereco }, indice) => (
          <a data-gc="perfil.user-profile-popover.a"
            key={`${conexao.servico}-${indice}`}
            href={endereco}
            target="_blank"
            rel="noreferrer noopener"
            title={`${NOMES_DOS_SERVICOS[conexao.servico]} — ${comoSeLe(conexao)}`}
            className="flex max-w-full items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-11 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
          >
            <Link2 data-gc="perfil.user-profile-popover.link2" size={12} className="shrink-0" />
            <span data-gc="perfil.user-profile-popover.span" className="truncate">{comoSeLe(conexao)}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
