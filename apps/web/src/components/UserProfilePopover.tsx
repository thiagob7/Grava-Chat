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
import { corDoCargoMaisAlto } from "~/lib/cosmeticos/cargo";

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
          <div className="p-6 text-sm text-ink-faint">Carregando…</div>
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

  /*
    Cargos vindos do detalhe do servidor, nao das props: e a mesma fonte que a
    mutacao invalida, entao mexer num cargo aqui repinta o cartao na hora em
    vez de esperar o pai repassar as props. As props ficam de reserva pra
    quando o detalhe ainda nao esta em cache.
  */
  const cargosDoServidor = detalheDoServidor?.roles ?? roles;
  const membrosDoServidor = detalheDoServidor?.members ?? [];
  const idsDoMembro =
    membrosDoServidor.find((m) => m.user.id === perfil.id)?.roleIds ?? roleIds;

  const cargosDoMembro = cargosDoServidor.filter(
    (r) => !r.isEveryone && idsDoMembro.includes(r.id),
  );

  const corDoCargo = corDoCargoMaisAlto(idsDoMembro, cargosDoServidor);

  /*
    A mesma hierarquia que a API cobra, so que antes: o dono passa por cima de
    tudo, e os demais so mexem no que esta abaixo do proprio cargo mais alto —
    inclusive na pessoa, que nao pode estar acima de quem esta mexendo.
  */
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
        return aviso.success(`Convite enviado para ${perfil.displayName}.`);
      }
    }

    await navigator.clipboard.writeText(link);
    aviso.info("Vocês não são amigos — o link foi copiado para você mandar.");
  };
  const navigate = useNavigate();
  const requestFriend = useRequestFriend();
  const respondFriend = useRespondFriend();
  const confirmar = useConfirmar();
  const removeFriend = useRemoveFriend();
  const openDm = useOpenDm();

  const desfazerAmizade = async () => {
    const { confirmado } = await confirmar({
      titulo: `Desfazer amizade com ${perfil.displayName}?`,
      descricao:
        "Vocês deixam de ser amigos. A conversa privada continua no histórico, e dá pra adicionar de novo depois.",
      acao: "Desfazer amizade",
    });

    if (confirmado && perfil.friendshipId)
      removeFriend.mutate(perfil.friendshipId);
  };

  const bloquearUsuario = async () => {
    const { confirmado } = await confirmar({
      titulo: `Bloquear ${perfil.displayName}?`,
      descricao:
        "Vocês deixam de ser amigos, a conversa privada para de aceitar mensagens e ele não consegue mais te mandar pedido de amizade.",
      acao: "Bloquear",
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

  /*
    Fila de acoes no corpo do cartao, embaixo do @username — o mesmo lugar do
    Discord. Antes elas flutuavam no canto da faixa, sobre a imagem, o que
    escondia parte do banner e deixava o botao principal la no rodape.
  */
  const acoes = (
    <>
      {perfil.friendship === "SELF" ? (
        <Button size="sm" onClick={() => setEditandoPerfil(true)}>
          <Pencil size={14} /> Editar perfil
        </Button>
      ) : (
        <>
          {perfil.friendship === "ACCEPTED" && (
            <Button
              size="sm"
              onClick={() => void conversar()}
              disabled={ocupado}
            >
              <MessageSquare size={14} /> Mensagem
            </Button>
          )}

          {podeModerar && guildId && (
            <BotaoRedondo
              label="Abrir na visualização de moderador"
              onClick={() => {
                useModeracao.getState().abrir({
                  guildId,
                  userId: perfil.id,
                  displayName: perfil.displayName,
                  username: perfil.username,
                  avatarUrl: perfil.avatarUrl,
                });
                /// O cartão sai da frente: a ficha abre na coluna, e os dois
                /// abertos ao mesmo tempo seriam a mesma pessoa em dobro.
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
                aria-label="Mais"
                className="rounded-full bg-surface-3 p-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {perfil.friendship === "ACCEPTED" && (
                <>
                  <DropdownMenuItem onSelect={() => void conversar()}>
                    Abrir conversa <MessageSquare size={14} />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onSelect={() => setPerfilCompleto(true)}>
                Ver perfil completo <User size={14} />
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Convidar para o servidor
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
                      Você não tem servidores
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => alternarIgnorado(perfil.id)}>
                {ignorado ? "Deixar de ignorar" : "Ignorar"}
                {ignorado ? <Eye size={14} /> : <EyeOff size={14} />}
              </DropdownMenuItem>

              <DropdownMenuItem danger onSelect={() => void bloquearUsuario()}>
                Bloquear <Ban size={14} />
              </DropdownMenuItem>

              {perfil.friendship === "ACCEPTED" && (
                <DropdownMenuItem
                  danger
                  onSelect={() => void desfazerAmizade()}
                >
                  Desfazer amizade <UserX size={14} />
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(perfil.id);
                  aviso.success("ID copiado.");
                }}
              >
                Copiar ID do usuário <Copy size={14} />
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
                    Te mandou um pedido de amizade
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
                    <Check size={16} /> Aceitar
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
      toast.error("Não deu pra enviar. Tente pela conversa.");
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
          placeholder={`Conversar com @${username}`}
          disabled={enviando}
          className="border-0 bg-transparent text-sm"
        />
        <button
          onClick={() => void enviar()}
          disabled={!texto.trim() || enviando}
          aria-label="Enviar"
          className="shrink-0 rounded p-1.5 text-ink-muted transition hover:text-ink disabled:opacity-40"
        >
          <SendHorizontal size={16} />
        </button>
      </div>

      {enviada && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-online">
          <Check size={12} /> Mensagem enviada
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
  if (perfil.friendship === "ACCEPTED") {
    return (
      <BotaoRedondo label="Amigo" desabilitado>
        <UserCheck size={16} className="text-online" />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_OUT") {
    return (
      <BotaoRedondo label="Pedido de amizade enviado" desabilitado>
        <Clock size={16} />
      </BotaoRedondo>
    );
  }

  if (perfil.friendship === "PENDING_IN") {
    return (
      <BotaoRedondo label="Te mandou um pedido — responda abaixo" desabilitado>
        <UserPlus size={16} className="text-idle" />
      </BotaoRedondo>
    );
  }

  return (
    <BotaoRedondo label="Adicionar amigo" onClick={onAdicionar}>
      <UserPlus size={16} />
    </BotaoRedondo>
  );
};

/**
 * As contas de fora que a pessoa declarou, no cartão de perfil.
 *
 * O `rel="noreferrer noopener"` não é enfeite: sem `noopener` a página aberta
 * ganha `window.opener` e pode trocar a aba de origem por uma cópia da tela de
 * login. É um link que a PESSOA DO PERFIL escolheu e alguém clica — a mesma
 * situação em que o ataque funciona.
 *
 * O endereço é montado no `shared` a partir do handle, nunca guardado inteiro,
 * então nada que não seja `https://` de um domínio conhecido chega aqui.
 */
const ConexoesDoPerfil: React.FC<{ conexoes?: Conexao[] }> = ({ conexoes }) => {
  const validas = (conexoes ?? [])
    .map((conexao) => ({ conexao, endereco: enderecoDaConexao(conexao) }))
    .filter(
      (c): c is { conexao: Conexao; endereco: string } => c.endereco !== null,
    );

  if (!validas.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        Conexões
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
