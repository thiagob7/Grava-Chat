import React, { useState } from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";

const INVITE = import.meta.env.OFFICIAL_VITE_INVITE as string | undefined;

const KEY = "gravae:faixa-da-comunidade";

export const CommunityTrack: React.FC = () => {
  const navigate = useNavigate();
  const [closed, setClosed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  const { data: invite } = useFindInvite(closed ? undefined : INVITE);

  if (!INVITE || closed || !invite || invite.alreadyMember) return null;

  const close = () => {
    setClosed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
    }
  };

  return (
    <div data-gc="servidor.faixa-da-comunidade.div" className="flex shrink-0 items-center justify-center gap-3 bg-brand px-10 py-2 text-sm font-medium text-palco-ink">
      <span data-gc="servidor.faixa-da-comunidade.span" className="min-w-0 truncate">
        Entre no {invite.guild.name} para conversar com a gente e ficar por dentro.
      </span>

      <button data-gc="servidor.faixa-da-comunidade.button"
        onClick={() => navigate(`/invite/${INVITE}`)}
        className="shrink-0 rounded bg-palco-ink px-2.5 py-1 text-xs font-semibold text-brand transition hover:bg-palco-ink/90"
      >
        Entrar
      </button>

      <button data-gc="servidor.faixa-da-comunidade.button.close"
        onClick={close}
        aria-label="Fechar"
        className="absolute right-3 rounded p-1 text-palco-ink/80 transition hover:bg-palco-ink/15 hover:text-palco-ink"
      >
        <X data-gc="servidor.faixa-da-comunidade.x" size={16} />
      </button>
    </div>
  );
};
