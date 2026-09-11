import React, { useState } from "react";
import { useNavigate } from "react-router";
import { InviteModal } from "~/features/servidor/components/ConviteModal";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";

import { useFindInvite } from "~/@core/application/queries/invite/use-find-invite";
import { Button } from "~/components/ui/button";
import { avatarColor, initials } from "~/lib/format";
import { useTranslation } from "~/traducao";

export const InviteCard: React.FC<{ code: string }> = ({ code }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: invite, isLoading, isError } = useFindInvite(code);
  const [asking, setAsking] = useState(false);

  if (isLoading)
    return (
      <div data-gc="servidor.cartao-de-convite.div" className="mt-1 h-64 w-80 animate-pulse rounded-lg border border-line bg-surface-1" />
    );

  if (isError || !invite)
    return (
      <div data-gc="servidor.cartao-de-convite.div--2" className="mt-1 w-80 rounded-lg border border-line bg-surface-1 p-3">
        <p data-gc="servidor.cartao-de-convite.p" className="text-sm font-medium text-ink-muted">{t("servidor.convite.indisponivel")}</p>
        <p data-gc="servidor.cartao-de-convite.p--2" className="mt-0.5 text-xs text-ink-faint">
          {t("servidor.convite.indisponivelDetalhe")}
        </p>
      </div>
    );

  const { guild } = invite;

  const ir = () => {
    if (invite.alreadyMember) {
      navigate(`/channels/${guild.id}`);
      return;
    }

    setAsking(true);
  };

  return (
    <>
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
            className="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-sobre-marca"
            style={{ backgroundColor: avatarColor(guild.id) }}
          >
            {initials(guild.name)}
          </span>
        )}

        <div data-gc="servidor.cartao-de-convite.div--5" className="min-w-0 flex-1">
          <p data-gc="servidor.cartao-de-convite.p--3" className="flex items-center gap-1.5 font-semibold">
            <span data-gc="servidor.cartao-de-convite.span--2" className="truncate">{guild.name}</span>
            <CommunitySeal data-gc="servidor.cartao-de-convite.community-seal" verified={guild.verified} detectable={guild.detectable} size={15} />
          </p>

          <p data-gc="servidor.cartao-de-convite.p--4" className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
            <span data-gc="servidor.cartao-de-convite.span--3" className="flex items-center gap-1.5">
              <span data-gc="servidor.cartao-de-convite.span--4" className="size-2 rounded-full bg-online" />
              {t("servidor.descoberta.online", { quantos: guild.onlineCount })}
            </span>
            <span data-gc="servidor.cartao-de-convite.span--5" className="flex items-center gap-1.5">
              <span data-gc="servidor.cartao-de-convite.span--6" className="size-2 rounded-full bg-ink-faint" />
              {guild.memberCount === 1
                ? t("servidor.descoberta.umMembro")
                : t("servidor.descoberta.membros", { quantos: guild.memberCount })}
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
          onClick={ir}
        >
          {invite.alreadyMember
            ? t("servidor.convite.abrir")
            : t("servidor.convite.entrar")}
        </Button>
      </div>
    </article>

      <InviteModal data-gc="servidor.cartao-de-convite.invite-modal" code={asking ? code : null} onClose={() => setAsking(false)} />
    </>
  );
};
