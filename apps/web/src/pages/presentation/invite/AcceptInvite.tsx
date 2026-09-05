import React from "react";
import { Monitor } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { useAcceptInvite } from "~/@core/application/queries/invite/use-accept-invite";
import { FundoDaMarca } from "~/features/app/components/FundoDaMarca";
import { Button } from "~/components/ui/button";
import { apiErrorMessage } from "~/@core/lib/api";
import { ehDesktop } from "~/lib/desktop";
import { avatarColor, initials } from "~/lib/format";

export const AcceptInvite: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const { data: invite, error } = useFindInvite(code);
  const acceptInvite = useAcceptInvite();

  const join = async () => {
    if (!code) return;

    const result = await acceptInvite.mutateAsync(code).catch(() => null);
    if (result) navigate(`/channels/${result.guildId}`, { replace: true });
  };

  const abrirNoApp = () => {
    if (code) window.location.href = `gravae://invite/${code}`;
  };

  return (
    <div data-gc="invite.accept-invite.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <FundoDaMarca data-gc="invite.accept-invite.fundo-da-marca" className="pointer-events-none absolute inset-0" />

      <div data-gc="invite.accept-invite.div--2" className="relative w-full max-w-sm rounded-xl bg-surface-1 p-8 text-center shadow-2xl ring-1 ring-white/10">
        {error ? (
          <>
            <h1 data-gc="invite.accept-invite.h1" className="text-lg font-semibold">Convite inválido</h1>
            <p data-gc="invite.accept-invite.p" className="mt-1 text-sm text-ink-muted">{apiErrorMessage(error)}</p>
            <Button data-gc="invite.accept-invite.button" onClick={() => navigate("/channels")} className="mt-6">
              Voltar
            </Button>
          </>
        ) : !invite ? (
          <p data-gc="invite.accept-invite.p--2" className="text-ink-muted">Carregando convite…</p>
        ) : (
          <>
            <div data-gc="invite.accept-invite.div--3"
              className="mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl text-2xl font-bold"
              style={{ backgroundColor: avatarColor(invite.guild.id) }}
            >
              {invite.guild.iconUrl ? (
                <img data-gc="invite.accept-invite.img" src={invite.guild.iconUrl} alt="" className="size-full rounded-3xl object-cover" />
              ) : (
                initials(invite.guild.name)
              )}
            </div>

            <p data-gc="invite.accept-invite.p--3" className="text-sm text-ink-muted">{invite.inviter} te convidou para</p>
            <h1 data-gc="invite.accept-invite.h1--2" className="mt-1 text-2xl font-bold">{invite.guild.name}</h1>
            <p data-gc="invite.accept-invite.p--4" className="mt-1 text-sm text-ink-faint">
              <span data-gc="invite.accept-invite.span" className="inline-flex items-center gap-1.5">
                <span data-gc="invite.accept-invite.span--2" className="size-2 rounded-full bg-online" />
                {invite.guild.onlineCount} online
              </span>
              <span data-gc="invite.accept-invite.span--3" className="px-2 text-ink-faint">·</span>
              {invite.guild.memberCount} {invite.guild.memberCount === 1 ? "membro" : "membros"}
            </p>

            <Button data-gc="invite.accept-invite.button--2"
              onClick={() => void join()}
              disabled={acceptInvite.isPending}
              className="mt-6 w-full"
            >
              {acceptInvite.isPending
                ? "Entrando…"
                : invite.alreadyMember
                  ? "Você já está dentro — abrir"
                  : "Aceitar convite"}
            </Button>

            {!ehDesktop() && (
              <Button data-gc="invite.accept-invite.button.abrir-no-app" variant="ghost" size="sm" onClick={abrirNoApp} className="mt-2 w-full">
                <Monitor data-gc="invite.accept-invite.monitor" size={14} /> Abrir no aplicativo
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
