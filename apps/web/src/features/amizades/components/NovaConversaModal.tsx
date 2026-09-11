import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Avatar } from "~/features/perfil/components/Avatar";
import { bareField, fieldGroup } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (channelId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const { t } = useTranslation();
  const { data: relations = [] } = useFindFriends(isOpen);
  const open = useOpenDm();
  const [search, setSearch] = useState("");

  const friends = useMemo(() => {
    const term = search.trim().toLowerCase();

    return relations
      .filter((r) => r.status === "ACCEPTED")
      .map((r) => r.user)
      .filter(
        (u) =>
          !term ||
          u.displayName.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [relations, search]);

  const pick = async (userId: string) => {
    const channel = await open.mutateAsync(userId).catch(() => null);
    if (!channel) return;

    onOpenChat(channel.id);
    setSearch("");
    onClose();
  };

  return (
    <Dialog data-gc="amizades.nova-conversa-modal.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="amizades.nova-conversa-modal.dialog-content" className="max-w-md">
        <DialogHeader data-gc="amizades.nova-conversa-modal.dialog-header">
          <DialogTitle data-gc="amizades.nova-conversa-modal.dialog-title">{t("amizades.nova.titulo")}</DialogTitle>
          <DialogDescription data-gc="amizades.nova-conversa-modal.dialog-description">
            {t("amizades.nova.detalhe")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="amizades.nova-conversa-modal.dialog-body">
          <div data-gc="amizades.nova-conversa-modal.div" className={cn(fieldGroup, "h-9")}>
            <Search data-gc="amizades.nova-conversa-modal.search" size={14} className="shrink-0 text-ink-faint" />
            <input data-gc="amizades.nova-conversa-modal.input"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("amizades.nova.procurar")}
              aria-label={t("amizades.nova.procurar")}
              className={bareField}
            />
          </div>

          <div data-gc="amizades.nova-conversa-modal.div--2" className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
            {friends.length === 0 && (
              <p data-gc="amizades.nova-conversa-modal.p" className="px-2 py-6 text-center text-sm text-ink-faint">
                {search ? t("amizades.nova.semResultado") : t("amizades.nova.semAmigos")}
              </p>
            )}

            {friends.map((friend) => (
              <button data-gc="amizades.nova-conversa-modal.button"
                key={friend.id}
                type="button"
                disabled={open.isPending}
                onClick={() => void pick(friend.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-hover"
              >
                <Avatar data-gc="amizades.nova-conversa-modal.avatar"
                  id={friend.id}
                  name={friend.displayName}
                  url={friend.avatarUrl}
                  size={32}
                />

                <span data-gc="amizades.nova-conversa-modal.span" className="min-w-0 flex-1">
                  <span data-gc="amizades.nova-conversa-modal.span--2" className="block truncate text-sm font-medium">
                    {friend.displayName}
                  </span>
                  <span data-gc="amizades.nova-conversa-modal.span--3" className="block truncate text-xs text-ink-faint">
                    @{friend.username}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
