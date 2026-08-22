import React, { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
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
import type { Role } from "@gravae/shared";

import { ModeratorView } from "~/components/ModeratorView";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useMe } from "~/@core/application/queries/auth/use-me";
import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
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
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useConfirmar } from "~/components/ui/confirm";
import { useEnfeites } from "~/hooks/use-enfeites";
import { corDoCargoMaisAlto } from "~/lib/cosmeticos/cargo";

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Contexto do servidor. Sem ele o cartão continua funcionando — só não
   * oferece a visualização de moderador, que não faz sentido numa DM.
   */
  guildId?: string;
  roles?: Role[];
  /** cargos DESTA pessoa no servidor; o perfil completo lista os nomes */
  roleIds?: string[];
  /** true mostra o escudo; quem não modera não vê o botão */
  podeModerar?: boolean;
}

/**
 * O cartão de perfil que abre ao clicar numa pessoa — na lista de membros, no
 * canal de voz ou no autor de uma mensagem. É daqui que se manda pedido de
 * amizade e se abre a conversa privada.
 */
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
  // só busca o perfil depois do clique — ver use-find-profile
  const { data: perfil, isLoading } = useFindProfile(aberto ? userId : null);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      {/*
        O cartão cresceu — banner, cargos, nota e emblemas — e passou a caber
        mal em tela baixa. Teto com rolagem PRÓPRIA: sem isto o rodapé com
        "Enviar mensagem" cai fora da janela e não tem como alcançá-lo.
      */}
      <PopoverContent side={side} className="max-h-[80vh] w-80 overflow-y-auto p-0">
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
  const [moderando, setModerando] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [definindoStatus, setDefinindoStatus] = useState(false);
  // já está no cache (a sessão inteira depende dele); aqui é só leitura
  const { data: eu } = useMe(true);
  const updateProfile = useUpdateProfile();

  const bloquear = useBlockUser();
  // já está no cache (a barra lateral usa a mesma chave); aqui é só leitura
  const guilds = useFindManyGuilds(true);
  const criarConvite = useCreateInvite();
  const ignorados = useIgnoreStore((s) => s.ignorados);
  const alternarIgnorado = useIgnoreStore((s) => s.alternar);

  const ignorado = ignorados.includes(perfil.id);

  /**
   * Aqui o enfeite vem no próprio perfil, não do mapa do servidor: o cartão
   * abre um de cada vez e já faz a requisição da pessoa. É o que faz ele
   * funcionar igual numa DM, onde não há servidor nenhum de onde tirar mapa.
   */
  const corDoCargo = corDoCargoMaisAlto(roleIds, roles);
  /**
   * Emblema é do SERVIDOR, então não vem no perfil global — vem do mapa do
   * servidor aberto. Numa DM não há emblema, e é o correto: o emblema diz "eu
   * sou daqui", e ali não existe daqui.
   */
  const enfeitesDe = useEnfeites(guildId);
  const emblemas = enfeitesDe.emblemasDe(perfil.id);
  const { data: detalheDoServidor } = useFindGuild(guildId);

  /**
   * Convidar pro servidor = gerar um convite e mandar por DM.
   *
   * Sem amizade não há DM, então aí o link vai pra área de transferência. É
   * menos automático, mas continua resolvendo — e é honesto sobre o que
   * aconteceu, em vez de dizer "convite enviado" para uma mensagem que o
   * servidor recusou.
   */
  const convidarPara = async (targetGuildId: string) => {
    const convite = await criarConvite.mutateAsync({ guildId: targetGuildId }).catch(() => null);
    if (!convite) return;

    const link = `${window.location.origin}/invite/${convite.code}`;

    if (perfil.friendship === "ACCEPTED") {
      const canal = await openDm.mutateAsync(perfil.id).catch(() => null);

      if (canal) {
        await sendMessage({ channelId: canal.id, content: link, nonce: crypto.randomUUID() });
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

  /** Usada pelo botão de baixo e pelo menu "Mais" — a regra é a mesma. */
  const desfazerAmizade = async () => {
    const { confirmado } = await confirmar({
      titulo: `Desfazer amizade com ${perfil.displayName}?`,
      descricao:
        "Vocês deixam de ser amigos. A conversa privada continua no histórico, e dá pra adicionar de novo depois.",
      acao: "Desfazer amizade",
    });

    if (confirmado && perfil.friendshipId) removeFriend.mutate(perfil.friendshipId);
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
    requestFriend.isPending || respondFriend.isPending || removeFriend.isPending || openDm.isPending;

  /*
    Os botões circulares do topo, como no Discord. Ficam sobre a faixa do
    banner porque ali é espaço morto — e assim a coluna de baixo continua
    inteira pro que é conteúdo.
  */
  const acoesDoTopo = perfil.friendship !== "SELF" && (
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            {podeModerar && guildId && (
              <BotaoRedondo
                label="Abrir na visualização de moderador"
                onClick={() => setModerando(true)}
              >
                <ShieldAlert size={16} />
              </BotaoRedondo>
            )}

            <BotaoDeAmizade perfil={perfil} onAdicionar={() => requestFriend.mutate(perfil.username)} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Mais"
                  className="rounded-full bg-black/40 p-2 text-white/80 transition hover:bg-black/60 hover:text-white"
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
                  <DropdownMenuSubTrigger>Convidar para o servidor</DropdownMenuSubTrigger>
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
                      <DropdownMenuItem disabled>Você não tem servidores</DropdownMenuItem>
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
                  <DropdownMenuItem danger onSelect={() => void desfazerAmizade()}>
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
    </div>
  );

  return (
    <>
      {editandoPerfil && eu && (
        <ProfileEditorModal open user={eu} onClose={() => setEditandoPerfil(false)} />
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
          cargos={roles.filter((r) => roleIds.includes(r.id))}
          onClose={() => setPerfilCompleto(false)}
        />
      )}

      {moderando && guildId && (
        <ModeratorView
          open
          guildId={guildId}
          userId={perfil.id}
          displayName={perfil.displayName}
          username={perfil.username}
          avatarUrl={perfil.avatarUrl}
          roles={roles}
          onClose={() => setModerando(false)}
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
        cargos={roles.filter((r) => !r.isEveryone && roleIds.includes(r.id))}
        /* no meu próprio cartão o balão é clicável, em qualquer lugar que ele abra */
        onStatus={perfil.friendship === "SELF" ? () => setDefinindoStatus(true) : undefined}
        emblemas={emblemas}
        acoesDoTopo={acoesDoTopo}
        className="rounded-none"
      >
        {/* a nota é sobre OUTRA pessoa; no próprio cartão não faz sentido */}
        {perfil.friendship !== "SELF" && <CampoDeNota userId={perfil.id} nota={perfil.nota} />}

        {/* no próprio cartão, dentro de um servidor: escolher o que vestir aqui */}
        {perfil.friendship === "SELF" && guildId && (
          <EscolherEmblemas
            guildId={guildId}
            disponiveis={detalheDoServidor?.emblemas ?? []}
            vestidos={emblemas}
          />
        )}

        <div className="mt-4 space-y-2">
          {perfil.friendship === "SELF" ? (
            /*
              No próprio cartão o botão leva pro editor — é a segunda porta da
              mesma sala, e a mais óbvia: você está justamente olhando o que
              quer mudar.
            */
            <Button onClick={() => setEditandoPerfil(true)} className="w-full">
              <Pencil size={15} /> Editar perfil
            </Button>
          ) : (
            <>
              {/*
                Adicionar amigo e desfazer amizade vivem nos botões redondos do
                topo e no menu "Mais". Aqui embaixo fica só o que NÃO tem
                atalho lá em cima: abrir a conversa, e aceitar um pedido —
                aceitar num ícone de 16px seria fácil demais de clicar sem
                querer.
              */}
              {perfil.friendship === "ACCEPTED" && (
                <Button onClick={() => void conversar()} disabled={ocupado} className="w-full">
                  <MessageSquare size={16} /> Enviar mensagem
                </Button>
              )}

              {perfil.friendship === "PENDING_IN" && (
                <>
                  <p className="mb-1 text-center text-xs text-ink-faint">
                    Te mandou um pedido de amizade
                  </p>
                  <Button
                    variant="success"
                    onClick={() =>
                      perfil.friendshipId &&
                      respondFriend.mutate({ friendshipId: perfil.friendshipId, accept: true })
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

      {/* Conversar sem sair de onde você está — só faz sentido com amigos,
          porque o servidor recusa DM entre quem não é. */}
      {perfil.friendship === "ACCEPTED" && (
        <ComposerDoPerfil userId={perfil.id} username={perfil.username} />
      )}
    </>
  );
};

/**
 * Mandar uma mensagem direto do cartão.
 *
 * De propósito NÃO navega pra conversa: o valor disto é justamente responder
 * alguém sem largar o canal que você está lendo. Navegar mataria o motivo de
 * existir do campo — pra isso já existe o botão "Enviar mensagem" acima.
 *
 * Em troca, a confirmação tem que ser visível, senão fica a dúvida de se foi.
 */
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
      // abre (ou reaproveita) a conversa privada e manda por lá
      const canal = await openDm.mutateAsync(userId);
      await sendMessage({ channelId: canal.id, content: conteudo, nonce: crypto.randomUUID() });

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
      className="rounded-full bg-black/40 p-2 text-white/80 transition hover:bg-black/60 hover:text-white disabled:cursor-default disabled:hover:bg-black/40"
    >
      {children}
    </button>
  </Tooltip>
);

/**
 * O botão de amizade conta o estado atual em vez de oferecer sempre "adicionar".
 *
 * São quatro situações e cada uma pede um desenho diferente: dá pra adicionar,
 * o pedido está pendente (e não há o que fazer aqui), vocês já são amigos, ou
 * ele te mandou um pedido — e nesse último o lugar de responder é o botão
 * grande embaixo, não um ícone de 16px.
 */
const BotaoDeAmizade: React.FC<{ perfil: ProfileModel; onAdicionar: () => void }> = ({
  perfil,
  onAdicionar,
}) => {
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
