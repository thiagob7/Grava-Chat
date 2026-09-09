import React, { useState } from "react";
import { X } from "@phosphor-icons/react";

import { LottieArt } from "~/components/LottieArt";
import { Button } from "~/components/ui/button";
import { InviteModal } from "~/features/servidor/components/InviteModal";

const loadAddFriend = () =>
  import("~/assets/animations/add-friend.json").then((mod) => mod.default);

const storageKey = (guildId: string) => `gravae:convite-de-boas-vindas:${guildId}`;

const wasDismissed = (guildId: string) => {
  try {
    return localStorage.getItem(storageKey(guildId)) === "1";
  } catch {
    return false;
  }
};

export const InviteFriendsCard: React.FC<{ guildId: string; guildName: string }> = ({
  guildId,
  guildName,
}) => {
  const [dismissed, setDismissed] = useState(() => wasDismissed(guildId));
  const [inviting, setInviting] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey(guildId), "1");
    } catch {
      return;
    }
  };

  return (
    <>
      <section data-gc="servidor.invite-friends-card.section" className="relative border-b border-divisor px-4 pb-4 pt-3 text-center">
        <button data-gc="servidor.invite-friends-card.button.dismiss"
          type="button"
          onClick={dismiss}
          aria-label="Dispensar"
          className="absolute right-3 top-2 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
        >
          <X data-gc="servidor.invite-friends-card.x" size={14} weight="bold" />
        </button>

        <LottieArt data-gc="servidor.invite-friends-card.lottie-art"
          name="add-friend"
          load={loadAddFriend}
          label="Um convite de amizade"
          className="mx-auto h-24 w-24"
        />

        <p data-gc="servidor.invite-friends-card.p" className="mt-2 text-sm leading-5 text-ink-muted">
          Uma aventura começa.
          <br data-gc="servidor.invite-friends-card.br" />
          Vamos adicionar alguns amigos!
        </p>

        <Button data-gc="servidor.invite-friends-card.button" className="mt-3 w-full" onClick={() => setInviting(true)}>
          Convidar para o servidor
        </Button>
      </section>

      <InviteModal data-gc="servidor.invite-friends-card.invite-modal"
        open={inviting}
        guildId={guildId}
        guildName={guildName}
        onClose={() => setInviting(false)}
      />
    </>
  );
};
