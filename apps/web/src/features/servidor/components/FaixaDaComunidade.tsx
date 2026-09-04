import React, { useState } from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";

const CONVITE = import.meta.env.VITE_CONVITE_OFICIAL as string | undefined;

const CHAVE = "gravae:faixa-da-comunidade";

export const FaixaDaComunidade: React.FC = () => {
  const navigate = useNavigate();
  const [fechada, setFechada] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) === "1";
    } catch {
      return false;
    }
  });

  const { data: convite } = useFindInvite(fechada ? undefined : CONVITE);

  if (!CONVITE || fechada || !convite || convite.alreadyMember) return null;

  const fechar = () => {
    setFechada(true);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* navegador sem armazenamento: a faixa volta na próxima, e tudo bem */
    }
  };

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 bg-brand px-10 py-2 text-sm font-medium text-white">
      <span className="min-w-0 truncate">
        Entre no {convite.guild.name} para conversar com a gente e ficar por dentro.
      </span>

      <button
        onClick={() => navigate(`/invite/${CONVITE}`)}
        className="shrink-0 rounded bg-white px-2.5 py-1 text-xs font-semibold text-brand transition hover:bg-white/90"
      >
        Entrar
      </button>

      <button
        onClick={fechar}
        aria-label="Fechar"
        className="absolute right-3 rounded p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
};
