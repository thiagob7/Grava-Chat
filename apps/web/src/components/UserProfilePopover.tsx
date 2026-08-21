import React, { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Check, MessageSquare, UserPlus, UserX } from "lucide-react";

import { useFindProfile } from "~/@core/application/queries/user/use-find-profile";
import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { avatarColor } from "~/lib/format";

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
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
}) => {
  const [aberto, setAberto] = useState(false);
  // só busca o perfil depois do clique — ver use-find-profile
  const { data: perfil, isLoading } = useFindProfile(aberto ? userId : null);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent side={side} className="w-80 p-0">
        {isLoading || !perfil ? (
          <div className="p-6 text-sm text-ink-faint">Carregando…</div>
        ) : (
          <ProfileCard perfil={perfil} onFechar={() => setAberto(false)} />
        )}
      </PopoverContent>
    </Popover>
  );
};

const ProfileCard: React.FC<{ perfil: ProfileModel; onFechar: () => void }> = ({
  perfil,
  onFechar,
}) => {
  const navigate = useNavigate();
  const requestFriend = useRequestFriend();
  const respondFriend = useRespondFriend();
  const removeFriend = useRemoveFriend();
  const openDm = useOpenDm();

  const conversar = async () => {
    const canal = await openDm.mutateAsync(perfil.id).catch(() => null);
    if (!canal) return;

    onFechar();
    navigate(`/dm/${canal.id}`);
  };

  const ocupado =
    requestFriend.isPending || respondFriend.isPending || removeFriend.isPending || openDm.isPending;

  return (
    <>
      <div className="h-16 rounded-t-lg" style={{ backgroundColor: avatarColor(perfil.id) }} />

      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3">
          <Avatar
            id={perfil.id}
            name={perfil.displayName}
            url={perfil.avatarUrl}
            size={72}
            status={perfil.status}
            className="rounded-full ring-[6px] ring-surface-0"
          />
        </div>

        <p className="text-lg font-bold leading-tight">{perfil.displayName}</p>
        <p className="text-sm text-ink-muted">@{perfil.username}</p>

        {(perfil.mutualGuilds > 0 || perfil.mutualFriends > 0) && (
          <p className="mt-2 text-xs text-ink-faint">
            {[
              perfil.mutualFriends > 0 &&
                `${perfil.mutualFriends} amigo${perfil.mutualFriends > 1 ? "s" : ""} em comum`,
              perfil.mutualGuilds > 0 &&
                `${perfil.mutualGuilds} servidor${perfil.mutualGuilds > 1 ? "es" : ""} em comum`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {perfil.bio && (
          <>
            <div className="my-3 h-px bg-line" />
            <p className="whitespace-pre-wrap text-sm text-ink-muted">{perfil.bio}</p>
          </>
        )}

        <div className="my-3 h-px bg-line" />
        <p className="text-xs font-semibold uppercase text-ink-faint">Membro desde</p>
        <p className="text-sm text-ink-muted">
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(perfil.createdAt))}
        </p>

        <div className="mt-4 space-y-2">
          {perfil.friendship === "SELF" ? (
            <p className="text-center text-sm text-ink-faint">Esse é você</p>
          ) : (
            <>
              {perfil.friendship === "ACCEPTED" && (
                <>
                  <Button onClick={() => void conversar()} disabled={ocupado} className="w-full">
                    <MessageSquare size={16} /> Enviar mensagem
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => perfil.friendshipId && removeFriend.mutate(perfil.friendshipId)}
                    disabled={ocupado}
                    className="w-full text-danger"
                  >
                    <UserX size={16} /> Desfazer amizade
                  </Button>
                </>
              )}

              {perfil.friendship === "NONE" && (
                <Button
                  onClick={() => requestFriend.mutate(perfil.username)}
                  disabled={ocupado}
                  className="w-full"
                >
                  <UserPlus size={16} /> Adicionar amigo
                </Button>
              )}

              {perfil.friendship === "PENDING_OUT" && (
                <Button variant="surface" disabled className="w-full">
                  Pedido enviado
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
      </div>
    </>
  );
};
