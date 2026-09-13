import React, { useState } from "react";
import { useNavigate } from "react-router";
import { InviteModal } from "~/features/servidor/components/ConviteModal";
import { HoverGif } from "~/components/GifNoHover";
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
  const [hovering, setHovering] = useState(false);

  if (isLoading)
    return (
      <div data-gc="servidor.cartao-de-convite.div" className="mt-1 h-36 w-full max-w-[26rem] animate-pulse rounded-xl border border-line-sutil bg-surface-1" />
    );

  if (isError || !invite)
    return (
      <div data-gc="servidor.cartao-de-convite.div--2" className="mt-1 w-full max-w-[26rem] rounded-xl border border-line-sutil bg-surface-1 p-4">
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
    <article data-gc="servidor.cartao-de-convite.article" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} className="mt-1 w-full max-w-[26rem] overflow-hidden rounded-xl border border-line-sutil bg-surface-1 shadow-sm">
      {guild.bannerUrl ? (
        <HoverGif data-gc="servidor.cartao-de-convite.hover-gif"
          src={guild.bannerUrl}
          alt=""
          playing={hovering}
          className="block h-28 w-full border-b border-line-sutil object-cover"
        />
      ) : null}

      <div data-gc="servidor.cartao-de-convite.div--3" className="flex items-center gap-4 px-4 py-4">
        {guild.iconUrl ? (
          <HoverGif data-gc="servidor.cartao-de-convite.hover-gif--2"
            src={guild.iconUrl}
            alt=""
            playing={hovering}
            className="size-14 shrink-0 rounded-full object-cover ring-1 ring-line-sutil"
          />
        ) : (
          <span data-gc="servidor.cartao-de-convite.span"
            className="flex size-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-sobre-marca ring-1 ring-line-sutil"
            style={{ backgroundColor: avatarColor(guild.id) }}
          >
            {initials(guild.name)}
          </span>
        )}

        <div data-gc="servidor.cartao-de-convite.div--4" className="min-w-0 flex-1">
          <p data-gc="servidor.cartao-de-convite.p--3" className="flex items-center gap-1.5 text-base font-semibold text-ink">
            <span data-gc="servidor.cartao-de-convite.span--2" className="truncate">{guild.name}</span>
            <CommunitySeal data-gc="servidor.cartao-de-convite.community-seal" verified={guild.verified} detectable={guild.detectable} size={15} />
          </p>

          <p data-gc="servidor.cartao-de-convite.p--4" className="mt-1 flex items-center gap-3 text-sm text-ink-muted">
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
        <p data-gc="servidor.cartao-de-convite.p--5" className="-mt-1 line-clamp-2 px-4 pb-3 text-xs text-ink-muted">{guild.description}</p>
      )}

      <div data-gc="servidor.cartao-de-convite.div--5" className="border-t border-line-sutil px-4 py-3">
        <Button data-gc="servidor.cartao-de-convite.button.ir"
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
