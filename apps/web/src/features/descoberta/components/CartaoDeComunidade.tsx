import React from "react";
import { Check } from "lucide-react";
import type { CommunityDiscovery } from "@gravae/shared";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";

import { Avatar } from "~/features/perfil/components/Avatar";
import { coverGenerated } from "~/lib/capa-gerada";
import { initials } from "~/lib/format";
import { useTranslation } from "~/traducao";

const number = new Intl.NumberFormat("pt-BR");

interface CommunityPropsCard {
  community: CommunityDiscovery;
  onDetails: () => void;
}

export const CommunityCard: React.FC<CommunityPropsCard> = ({
  community,
  onDetails,
}) => {
  const { t } = useTranslation();

  return (
    <article data-gc="descoberta.cartao-de-comunidade.article.on-details"
      role="button"
      tabIndex={0}
      onClick={onDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDetails();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface-2 outline-none transition hover:border-ink-faint/40 focus-visible:ring-2 focus-visible:ring-foco-anel"
    >
      <div data-gc="descoberta.cartao-de-comunidade.div" className="relative shrink-0">
        <div data-gc="descoberta.cartao-de-comunidade.div--2" className="h-24 overflow-hidden bg-surface-3">
          {community.bannerUrl ? (
            <img data-gc="descoberta.cartao-de-comunidade.img"
              src={community.bannerUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span data-gc="descoberta.cartao-de-comunidade.span"
              aria-hidden
              className="flex size-full items-center justify-end overflow-hidden"
              style={coverGenerated(community.id)}
            >
              <span data-gc="descoberta.cartao-de-comunidade.span--2" className="-mr-1 select-none text-5xl font-black leading-none tracking-tighter text-sobre-marca opacity-15">
                {initials(community.name)}
              </span>
            </span>
          )}
        </div>

        {community.alreadyAmMember && (
          <span data-gc="descoberta.cartao-de-comunidade.span--3" className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-surface-0/85 px-2 py-0.5 text-10 font-semibold text-ink">
            <Check data-gc="descoberta.cartao-de-comunidade.check" size={11} /> {t("servidor.descoberta.jaEstaAqui")}
          </span>
        )}

        <span data-gc="descoberta.cartao-de-comunidade.span--4" className="absolute -bottom-5 left-4 rounded-full border-4 border-surface-2 bg-surface-2">
          <Avatar data-gc="descoberta.cartao-de-comunidade.avatar"
            id={community.id}
            name={community.name}
            url={community.iconUrl}
            size={44}
          />
        </span>
      </div>

      <div data-gc="descoberta.cartao-de-comunidade.div--3" className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-8">
        <h3 data-gc="descoberta.cartao-de-comunidade.h3" className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <span data-gc="descoberta.cartao-de-comunidade.span--5" className="truncate">{community.name}</span>
          <CommunitySeal data-gc="descoberta.cartao-de-comunidade.community-seal" verified={community.verified} detectable size={15} />
        </h3>

        {community.description && (
          <p data-gc="descoberta.cartao-de-comunidade.p" className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-muted">
            {community.description}
          </p>
        )}
      </div>

      <div data-gc="descoberta.cartao-de-comunidade.div--4" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-ink-faint">
        <span data-gc="descoberta.cartao-de-comunidade.span--6" className="flex items-center gap-1.5">
          <span data-gc="descoberta.cartao-de-comunidade.span--7" className="size-1.5 rounded-full bg-online" />
          {t("servidor.descoberta.online", { quantos: number.format(community.online) })}
        </span>
        <span data-gc="descoberta.cartao-de-comunidade.span--8" className="flex items-center gap-1.5">
          <span data-gc="descoberta.cartao-de-comunidade.span--9" className="size-1.5 rounded-full bg-ink-faint" />
          {t("servidor.descoberta.membros", { quantos: number.format(community.members) })}
        </span>
      </div>
    </article>
  );
};
