import React from "react";
import { UserPlus } from "@phosphor-icons/react";

import { LottieArt } from "~/components/LottieArt";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const loadTrophy = () => import("~/assets/animations/trophy.json").then((mod) => mod.default);

export const CallInviteCard: React.FC<{ channelName: string; onInvite: () => void }> = ({
  channelName,
  onInvite,
}) => (
  <div data-gc="voz.call-invite-card.div"
    className={cn(
      "cartao-de-convite size-full rounded-xl",
      "bg-gradient-to-b from-brand/15 to-transparent",
    )}
  >
    <div data-gc="voz.call-invite-card.div--2"
      className="miolo-do-convite flex size-full flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <LottieArt data-gc="voz.call-invite-card.lottie-art"
        name="trophy"
        load={loadTrophy}
        label="Um troféu girando"
        className="arte-do-convite shrink-0"
      />

      <div data-gc="voz.call-invite-card.div--3"
        className="dizeres-do-convite flex min-w-0 flex-col items-center gap-2"
      >
        <p data-gc="voz.call-invite-card.p" className="texto-do-convite max-w-[22rem] text-sm text-ink-muted">
          Você está sozinho em {channelName}. Chame alguém para a conversa.
        </p>

        <Button data-gc="voz.call-invite-card.button.on-invite" size="sm" variant="surface" className="shrink-0" onClick={onInvite}>
          <UserPlus data-gc="voz.call-invite-card.user-plus" size={16} weight="fill" />
          Convidar para voz
        </Button>
      </div>
    </div>
  </div>
);
