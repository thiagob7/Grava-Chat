import React from "react";
import { useNavigate } from "react-router";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { useAcceptInvite } from "~/@core/application/queries/invite/use-accept-invite";
import { Button } from "~/components/ui/button";
import { avatarColor, initials } from "~/lib/format";

/*
  O cartão que um link de convite vira no chat.

  Quem manda o link quer que a pessoa entre sem sair da conversa, então o cartão
  responde as três perguntas que decidem isso — que comunidade é, se tem gente
  agora, quantos são — e traz o botão. Sem clicar em nada antes.
*/
export const CartaoDeConvite: React.FC<{ codigo: string }> = ({ codigo }) => {
  const navigate = useNavigate();
  const { data: convite, isLoading, isError } = useFindInvite(codigo);
  const entrar = useAcceptInvite();

  if (isLoading)
    return (
      <div data-gc="servidor.cartao-de-convite.div" className="mt-1 h-64 w-80 animate-pulse rounded-lg border border-line bg-surface-1" />
    );

  if (isError || !convite)
    return (
      <div data-gc="servidor.cartao-de-convite.div--2" className="mt-1 w-80 rounded-lg border border-line bg-surface-1 p-3">
        <p data-gc="servidor.cartao-de-convite.p" className="text-sm font-medium text-ink-muted">Convite indisponível</p>
        <p data-gc="servidor.cartao-de-convite.p--2" className="mt-0.5 text-xs text-ink-faint">
          Ele expirou, esgotou, ou quem criou apagou.
        </p>
      </div>
    );

  const { guild } = convite;

  const ir = () => {
    if (convite.alreadyMember) {
      navigate(`/channels/${guild.id}`);
      return;
    }

    /// O erro já vira aviso dentro da própria mutação; aqui só o caminho feliz.
    void entrar
      .mutateAsync(codigo)
      .then((resultado) => navigate(`/channels/${resultado.guildId}`))
      .catch(() => {});
  };

  return (
    <article data-gc="servidor.cartao-de-convite.article" className="mt-1 w-80 overflow-hidden rounded-lg border border-line bg-surface-1">
      {guild.bannerUrl ? (
        <img data-gc="servidor.cartao-de-convite.img"
          src={guild.bannerUrl}
          alt=""
          loading="lazy"
          className="block h-32 w-full object-cover"
        />
      ) : (
        <div data-gc="servidor.cartao-de-convite.div--3" className="h-16 w-full" style={{ backgroundColor: avatarColor(guild.id) }} />
      )}

      <div data-gc="servidor.cartao-de-convite.div--4" className="flex items-center gap-3 p-3">
        {guild.iconUrl ? (
          <img data-gc="servidor.cartao-de-convite.img--2"
            src={guild.iconUrl}
            alt=""
            loading="lazy"
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span data-gc="servidor.cartao-de-convite.span"
            className="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: avatarColor(guild.id) }}
          >
            {initials(guild.name)}
          </span>
        )}

        <div data-gc="servidor.cartao-de-convite.div--5" className="min-w-0 flex-1">
          <p data-gc="servidor.cartao-de-convite.p--3" className="truncate font-semibold">{guild.name}</p>

          <p data-gc="servidor.cartao-de-convite.p--4" className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
            <span data-gc="servidor.cartao-de-convite.span--2" className="flex items-center gap-1.5">
              <span data-gc="servidor.cartao-de-convite.span--3" className="size-2 rounded-full bg-online" />
              {guild.onlineCount} online
            </span>
            <span data-gc="servidor.cartao-de-convite.span--4" className="flex items-center gap-1.5">
              <span data-gc="servidor.cartao-de-convite.span--5" className="size-2 rounded-full bg-ink-faint" />
              {guild.memberCount} {guild.memberCount === 1 ? "membro" : "membros"}
            </span>
          </p>
        </div>
      </div>

      {guild.description && (
        <p data-gc="servidor.cartao-de-convite.p--5" className="line-clamp-2 px-3 pb-2 text-xs text-ink-muted">{guild.description}</p>
      )}

      <div data-gc="servidor.cartao-de-convite.div--6" className="p-3 pt-1">
        <Button data-gc="servidor.cartao-de-convite.button.ir"
          size="sm"
          className="w-full"
          disabled={entrar.isPending}
          onClick={ir}
        >
          {convite.alreadyMember ? "Ir para a comunidade" : "Entrar na comunidade"}
        </Button>
      </div>
    </article>
  );
};
