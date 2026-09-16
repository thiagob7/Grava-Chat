import React from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { cleanGiftCode, PLAN_NAME } from "@gravae/shared";

import { useClaimGift } from "~/@core/application/queries/billing/use-billing";
import { findPublicGift } from "~/@core/application/requests/billing/billing";
import { useSession } from "~/contexts/session-context";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar } from "~/features/perfil/components/Avatar";
import { InfinityArt } from "~/features/plan/components/InfinityArt";
import { useTranslation } from "~/traducao";

export const Gift: React.FC = () => {
  const { t } = useTranslation();
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const claim = useClaimGift();

  const clean = cleanGiftCode(code);
  const gift = useQuery({ queryKey: ["public-gift", clean], queryFn: () => findPublicGift(clean), retry: false });

  const done = claim.isSuccess;
  const used = gift.data?.claimed;

  return (
    <div data-gc="gift.gift.div" className="flex min-h-dvh items-center justify-center bg-surface-0 px-4 py-10">
      <div data-gc="gift.gift.div--2" className="w-full max-w-md overflow-hidden rounded-2xl border border-line-sutil bg-surface-1">
        <div data-gc="gift.gift.div--3" className="relative h-44 overflow-hidden bg-gradient-to-br from-brand/50 via-brand/25 to-mencao/40">
          <span data-gc="gift.gift.span" aria-hidden className="infinity-blob absolute -left-10 -top-10 size-48 rounded-full bg-brand/45 blur-2xl" />
          <span data-gc="gift.gift.span--2" aria-hidden className="infinity-blob infinity-blob--slow absolute -right-10 bottom-0 size-44 rounded-full bg-mencao/40 blur-2xl" />
          <InfinityArt data-gc="gift.gift.infinity-art" className="absolute inset-0 m-auto size-36" />
        </div>

        <div data-gc="gift.gift.div--4" className="px-6 py-6 text-center">
          {gift.isPending ? (
            <Skeleton data-gc="gift.gift.skeleton" className="h-28 w-full rounded-lg" />
          ) : done ? (
            <>
              <CheckCircle2 data-gc="gift.gift.check-circle2" size={36} className="mx-auto text-online" />
              <h1 data-gc="gift.gift.h1" className="mt-3 text-xl font-bold uppercase tracking-wide">
                {t("configuracoes.subscription.giftDoneTitle", { plan: PLAN_NAME })}
              </h1>
              <p data-gc="gift.gift.p" className="mt-2 text-sm text-ink-muted">{t("configuracoes.subscription.giftClaimed")}</p>
              <Button data-gc="gift.gift.button" className="mt-6 w-full" onClick={() => navigate("/channels")}>
                {t("configuracoes.subscription.giftOpenApp")}
              </Button>
            </>
          ) : !gift.data ? (
            <>
              <h1 data-gc="gift.gift.h1--2" className="text-xl font-bold">{t("configuracoes.subscription.giftNotFoundTitle")}</h1>
              <p data-gc="gift.gift.p--2" className="mt-2 text-sm text-ink-muted">{t("configuracoes.subscription.giftNotFoundDetail")}</p>
            </>
          ) : used ? (
            <>
              <h1 data-gc="gift.gift.h1--3" className="text-xl font-bold">{t("configuracoes.subscription.giftUsedTitle")}</h1>
              <p data-gc="gift.gift.p--3" className="mt-2 text-sm text-ink-muted">{t("configuracoes.subscription.giftUsedDetail")}</p>
            </>
          ) : (
            <>
              <h1 data-gc="gift.gift.h1--4" className="text-xl font-bold">
                {t("configuracoes.subscription.giftLinkTitle", { plan: PLAN_NAME })}
              </h1>
              <p data-gc="gift.gift.p--4" className="mt-2 text-sm text-ink-muted">
                {t("configuracoes.subscription.giftClaimDetail", { days: gift.data.days })}
              </p>

              {gift.data.from && (
                <p data-gc="gift.gift.p--5" className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
                  <Avatar data-gc="gift.gift.avatar" id={gift.data.code} name={gift.data.from.displayName} url={gift.data.from.avatarUrl} size={22} />
                  {t("configuracoes.subscription.giftFrom", { name: gift.data.from.displayName })}
                </p>
              )}

              <p data-gc="gift.gift.p--6" className="mt-3 font-mono text-xs tracking-wider text-ink-faint">{gift.data.code}</p>

              {user ? (
                <Button data-gc="gift.gift.button--2" className="mt-6 w-full" loading={claim.isPending} onClick={() => claim.mutate(clean)}>
                  {t("configuracoes.subscription.giftActivate")}
                </Button>
              ) : (
                <Button data-gc="gift.gift.button--3"
                  className="mt-6 w-full"
                  onClick={() => navigate("/login", { state: { from: `/gift/${clean}` } })}
                >
                  {t("configuracoes.subscription.giftSignIn")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gift;
