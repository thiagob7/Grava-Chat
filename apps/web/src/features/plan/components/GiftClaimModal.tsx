import React from "react";
import { toast } from "react-toastify";
import { cleanGiftCode, PLAN_NAME, prettyGiftCode } from "@gravae/shared";

import { useClaimGift, useGiftPreview } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar } from "~/features/perfil/components/Avatar";
import { InfinityArt } from "~/features/plan/components/InfinityArt";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { currentLanguage, useTranslation } from "~/traducao";

export const GiftClaimModal: React.FC = () => {
  const code = usePlanStore((s) => s.claimingGift);
  const close = usePlanStore((s) => s.claimGift);

  return (
    <Dialog data-gc="plan.gift-claim-modal.dialog" open={Boolean(code)} onOpenChange={(open) => !open && close(null)}>
      <DialogContent data-gc="plan.gift-claim-modal.dialog-content" className="max-w-md overflow-hidden">
        {code && <GiftClaimBody data-gc="plan.gift-claim-modal.gift-claim-body" code={code} onClose={() => close(null)} />}
      </DialogContent>
    </Dialog>
  );
};

const GiftClaimBody: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  const { t } = useTranslation();
  const preview = useGiftPreview(cleanGiftCode(code));
  const claim = useClaimGift();

  const gift = preview.data;
  const day = (iso: string) => new Date(iso).toLocaleDateString(currentLanguage(), { dateStyle: "long" });

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/gift/${cleanGiftCode(code)}`).catch(() => undefined);
    toast.success(t("configuracoes.subscription.giftLinkCopied"));
  };

  return (
    <div data-gc="plan.gift-claim-modal.div" className="pb-6 text-center">
      <div data-gc="plan.gift-claim-modal.div--2" className="relative h-36 overflow-hidden bg-gradient-to-br from-brand/50 via-brand/25 to-mencao/40">
        <span data-gc="plan.gift-claim-modal.span" aria-hidden className="infinity-blob absolute -left-10 -top-10 size-40 rounded-full bg-brand/45 blur-2xl" />
        <span data-gc="plan.gift-claim-modal.span--2" aria-hidden className="infinity-blob infinity-blob--slow absolute -right-8 bottom-0 size-36 rounded-full bg-mencao/40 blur-2xl" />
        <InfinityArt data-gc="plan.gift-claim-modal.infinity-art" className="absolute inset-0 m-auto size-32" />
      </div>

      <div data-gc="plan.gift-claim-modal.div--3" className="px-6 pt-5">

      {preview.isPending ? (
        <Skeleton data-gc="plan.gift-claim-modal.skeleton" className="mx-auto mt-5 h-24 w-full rounded-lg" />
      ) : !gift ? (
        <>
          <DialogTitle data-gc="plan.gift-claim-modal.dialog-title" className="mt-4 text-lg font-bold">
            {t("configuracoes.subscription.giftNotFoundTitle")}
          </DialogTitle>
          <DialogDescription data-gc="plan.gift-claim-modal.dialog-description">{t("configuracoes.subscription.giftNotFoundDetail")}</DialogDescription>
          <Button data-gc="plan.gift-claim-modal.button.on-close" className="mt-6 w-full" variant="surface" onClick={onClose}>
            {t("comum.fechar")}
          </Button>
        </>
      ) : gift.claimed ? (
        <>
          <DialogTitle data-gc="plan.gift-claim-modal.dialog-title--2" className="mt-4 text-lg font-bold">
            {t("configuracoes.subscription.giftUsedTitle")}
          </DialogTitle>
          <DialogDescription data-gc="plan.gift-claim-modal.dialog-description--2">{t("configuracoes.subscription.giftUsedDetail")}</DialogDescription>
          <Button data-gc="plan.gift-claim-modal.button.on-close--2" className="mt-6 w-full" variant="surface" onClick={onClose}>
            {t("comum.fechar")}
          </Button>
        </>
      ) : gift.alreadyPremium ? (
        <>
          <DialogTitle data-gc="plan.gift-claim-modal.dialog-title--3" className="mt-4 text-lg font-bold">
            {t("configuracoes.subscription.giftHasPlanTitle")}
          </DialogTitle>
          <DialogDescription data-gc="plan.gift-claim-modal.dialog-description--3">
            {gift.premiumUntil
              ? t("configuracoes.subscription.giftHasPlanDetail", { plan: PLAN_NAME, date: day(gift.premiumUntil) })
              : t("configuracoes.subscription.giftUsedDetail")}
          </DialogDescription>

          <div data-gc="plan.gift-claim-modal.div--4" className="mt-6 flex flex-col gap-2">
            <Button data-gc="plan.gift-claim-modal.button" onClick={() => void copyLink()}>
              {t("configuracoes.subscription.giftCopyLink")}
            </Button>
            <Button data-gc="plan.gift-claim-modal.button.on-close--3" variant="ghost" onClick={onClose}>
              {t("comum.fechar")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <DialogTitle data-gc="plan.gift-claim-modal.dialog-title--4" className="mt-4 text-lg font-bold">
            {t("configuracoes.subscription.giftClaimTitle", { plan: PLAN_NAME })}
          </DialogTitle>
          <DialogDescription data-gc="plan.gift-claim-modal.dialog-description--4">
            {t("configuracoes.subscription.giftClaimDetail", { days: gift.days })}
          </DialogDescription>

          {gift.from && (
            <p data-gc="plan.gift-claim-modal.p" className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted">
              <Avatar data-gc="plan.gift-claim-modal.avatar" id={gift.from.id} name={gift.from.displayName} url={gift.from.avatarUrl} size={22} />
              {t("configuracoes.subscription.giftFrom", { name: gift.from.displayName })}
            </p>
          )}

          <p data-gc="plan.gift-claim-modal.p--2" className="mt-3 font-mono text-xs tracking-wider text-ink-faint">{prettyGiftCode(cleanGiftCode(code))}</p>

          <div data-gc="plan.gift-claim-modal.div--5" className="mt-6 flex flex-col gap-2">
            <Button data-gc="plan.gift-claim-modal.button--2"
              loading={claim.isPending}
              onClick={() => claim.mutate(cleanGiftCode(code), { onSuccess: onClose })}
            >
              {t("configuracoes.subscription.giftActivate")}
            </Button>
            <Button data-gc="plan.gift-claim-modal.button.on-close--4" variant="ghost" onClick={onClose}>
              {t("comum.cancelar")}
            </Button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};
