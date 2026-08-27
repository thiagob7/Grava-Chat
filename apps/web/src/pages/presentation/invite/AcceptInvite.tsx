import React from "react";
import { Monitor } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { useAcceptInvite } from "~/@core/application/queries/invite/use-accept-invite";
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

  /*
    Página aberta no navegador oferece o desvio para o aplicativo.

    O navegador não tem como saber se o Gravaê está instalado — perguntar ao
    sistema por um `gravae://` sem ninguém do outro lado só rende uma caixa de
    erro. Então é um botão, não um desvio automático: quem tem o app clica,
    quem não tem continua na aba e nem repara.
  */
  const abrirNoApp = () => {
    if (code) window.location.href = `gravae://invite/${code}`;
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-surface-2 p-6">
      <div className="w-full max-w-sm rounded-lg bg-surface-1 p-8 text-center shadow-2xl">
        {error ? (
          <>
            <h1 className="text-lg font-semibold">Convite inválido</h1>
            <p className="mt-1 text-sm text-ink-muted">{apiErrorMessage(error)}</p>
            <Button onClick={() => navigate("/channels")} className="mt-6">
              Voltar
            </Button>
          </>
        ) : !invite ? (
          <p className="text-ink-muted">Carregando convite…</p>
        ) : (
          <>
            <div
              className="mx-auto mb-4 flex size-20 items-center justify-center rounded-3xl text-2xl font-bold"
              style={{ backgroundColor: avatarColor(invite.guild.id) }}
            >
              {invite.guild.iconUrl ? (
                <img src={invite.guild.iconUrl} alt="" className="size-full rounded-3xl object-cover" />
              ) : (
                initials(invite.guild.name)
              )}
            </div>

            <p className="text-sm text-ink-muted">{invite.inviter} te convidou para</p>
            <h1 className="mt-1 text-2xl font-bold">{invite.guild.name}</h1>
            <p className="mt-1 text-sm text-ink-faint">
              {invite.guild.memberCount} {invite.guild.memberCount === 1 ? "membro" : "membros"}
            </p>

            <Button
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
              <Button variant="ghost" size="sm" onClick={abrirNoApp} className="mt-2 w-full">
                <Monitor size={14} /> Abrir no aplicativo
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
