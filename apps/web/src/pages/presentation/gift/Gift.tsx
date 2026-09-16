import React from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CheckCircle2 } from "lucide-react";
import { cleanGiftCode, PLAN_NAME, prettyGiftCode } from "@gravae/shared";

import { useClaimGift, useGiftPreview } from "~/@core/application/queries/billing/use-billing";
import { findPublicGift } from "~/@core/application/requests/billing/billing";
import { useSession } from "~/contexts/session-context";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar } from "~/features/perfil/components/Avatar";
import { InfinityArt } from "~/features/plan/components/InfinityArt";
import { PlanScene } from "~/features/plan/components/PlanScene";
import { currentLanguage, useTranslation } from "~/traducao";

export const Gift: React.FC = () => {
  const { t } = useTranslation();
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const claim = useClaimGift();

  const clean = cleanGiftCode(code);

  const mine = useGiftPreview(user ? clean : null);
  const open = useQuery({
    queryKey: ["public-gift", clean],
    queryFn: () => findPublicGift(clean),
    enabled: !user,
    retry: false,
  });

  const gift = user ? mine.data : open.data;
  const loading = user ? mine.isLoading : open.isLoading;
  const day = (iso: string) => new Date(iso).toLocaleDateString(currentLanguage(), { dateStyle: "long" });

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/gift/${clean}`).catch(() => undefined);
    toast.success(t("configuracoes.subscription.giftLinkCopied"));
  };

  const hasPlan = Boolean(mine.data?.alreadyPremium);
  const until = mine.data?.premiumUntil ?? null;

  const body = () => {
    if (loading) return <Skeleton data-gc="gift.gift.skeleton" className="h-28 w-full rounded-lg" />;

    if (claim.isSuccess)
      return (
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
      );

    if (!gift)
      return (
        <>
          <h1 data-gc="gift.gift.h1--2" className="text-xl font-bold">{t("configuracoes.subscription.giftNotFoundTitle")}</h1>
          <p data-gc="gift.gift.p--2" className="mt-2 text-sm text-ink-muted">{t("configuracoes.subscription.giftNotFoundDetail")}</p>
        </>
      );

    if (gift.claimed)
      return (
        <>
          <h1 data-gc="gift.gift.h1--3" className="text-xl font-bold">{t("configuracoes.subscription.giftUsedTitle")}</h1>
          <p data-gc="gift.gift.p--3" className="mt-2 text-sm text-ink-muted">{t("configuracoes.subscription.giftUsedDetail")}</p>
        </>
      );

    if (hasPlan)
      return (
        <>
          <h1 data-gc="gift.gift.h1--4" className="text-xl font-bold">{t("configuracoes.subscription.giftHasPlanTitle")}</h1>
          <p data-gc="gift.gift.p--4" className="mt-2 text-sm text-ink-muted">
            {until
              ? t("configuracoes.subscription.giftHasPlanDetail", { plan: PLAN_NAME, date: day(until) })
              : t("configuracoes.subscription.giftUsedDetail")}
          </p>

          <Button data-gc="gift.gift.button--2" className="mt-6 w-full" onClick={() => void copyLink()}>
            {t("configuracoes.subscription.giftCopyLink")}
          </Button>
          <Button data-gc="gift.gift.button--3" className="mt-2 w-full" variant="ghost" onClick={() => navigate("/channels")}>
            {t("configuracoes.subscription.giftOpenApp")}
          </Button>
        </>
      );

    return (
      <>
        <h1 data-gc="gift.gift.h1--5" className="text-xl font-bold">{t("configuracoes.subscription.giftLinkTitle", { plan: PLAN_NAME })}</h1>
        <p data-gc="gift.gift.p--5" className="mt-2 text-sm text-ink-muted">
          {t("configuracoes.subscription.giftClaimDetail", { days: gift.days })}
        </p>

        {gift.from && (
          <p data-gc="gift.gift.p--6" className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
            <Avatar data-gc="gift.gift.avatar" id={gift.code} name={gift.from.displayName} url={gift.from.avatarUrl} size={22} />
            {t("configuracoes.subscription.giftFrom", { name: gift.from.displayName })}
          </p>
        )}

        <p data-gc="gift.gift.p--7" className="mt-3 font-mono text-xs tracking-wider text-ink-faint">{prettyGiftCode(clean)}</p>

        {user ? (
          <Button data-gc="gift.gift.button--4" className="mt-6 w-full" loading={claim.isPending} onClick={() => claim.mutate(clean)}>
            {t("configuracoes.subscription.giftActivate")}
          </Button>
        ) : (
          <Button data-gc="gift.gift.button--5" className="mt-6 w-full" onClick={() => navigate("/login", { state: { from: `/gift/${clean}` } })}>
            {t("configuracoes.subscription.giftSignIn")}
          </Button>
        )}
      </>
    );
  };

  return (
    <div data-gc="gift.gift.div" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <PlanScene data-gc="gift.gift.plan-scene" />

      <img data-gc="gift.gift.img"
        src="/brand/logo g branco.svg"
        alt=""
        draggable={false}
        className="pointer-events-none absolute left-6 top-6 h-8 w-auto select-none opacity-80"
      />

      <div data-gc="gift.gift.div--2" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line-sutil bg-surface-1 shadow-2xl">
        <div data-gc="gift.gift.div--3" className="relative h-44 overflow-hidden bg-gradient-to-br from-brand/45 via-brand/20 to-surface-2">
          <span data-gc="gift.gift.span" aria-hidden className="infinity-glow absolute inset-0" />
          <InfinityArt data-gc="gift.gift.infinity-art" className="absolute inset-0 m-auto size-36" />
        </div>

        <div data-gc="gift.gift.div--4" className="px-6 py-6 text-center">{body()}</div>
      </div>
    </div>
  );
};

export default Gift;
