import React, { useEffect, useState } from "react";
import { Copy, Gift } from "lucide-react";
import { toast } from "react-toastify";
import { cleanGiftCode, GIFT_CODE_SIZE } from "@gravae/shared";

import { useGifts } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar } from "~/features/perfil/components/Avatar";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { currentLanguage, useTranslation } from "~/traducao";

const linkOf = (code: string) => `${window.location.origin}/gift/${cleanGiftCode(code)}`;

export const GiftsPanel: React.FC = () => {
  const { t } = useTranslation();
  const gifts = useGifts();
  const askClaim = usePlanStore((s) => s.claimGift);
  const pending = usePlanStore((s) => s.giftCode);
  const setGiftCode = usePlanStore((s) => s.setGiftCode);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!pending) return;
    setCode(pending);
    setGiftCode(null);
  }, [pending, setGiftCode]);

  const day = new Intl.DateTimeFormat(currentLanguage(), { dateStyle: "short" });
  const ready = cleanGiftCode(code).length >= GIFT_CODE_SIZE;

  const copy = async (giftCode: string) => {
    await navigator.clipboard.writeText(linkOf(giftCode)).catch(() => undefined);
    toast.success(t("configuracoes.subscription.giftLinkCopied"));
  };

  return (
    <div data-gc="plan.gifts-panel.div" className="space-y-4">
      <p data-gc="plan.gifts-panel.p" className="text-sm text-ink-muted">{t("configuracoes.subscription.giftHint")}</p>

      <form data-gc="plan.gifts-panel.form"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          askClaim(cleanGiftCode(code));
          setCode("");
        }}
      >
        <Input data-gc="plan.gifts-panel.input"
          aria-label={t("configuracoes.subscription.giftCode")}
          placeholder="ABCD-2345-EFGH"
          value={code}
          maxLength={32}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button data-gc="plan.gifts-panel.button" type="submit" disabled={!ready}>
          {t("configuracoes.subscription.giftRedeem")}
        </Button>
      </form>

      {gifts.data?.length ? (
        <ul data-gc="plan.gifts-panel.ul" className="divide-y divide-line-sutil rounded-xl border border-line-sutil">
          {gifts.data.map((gift) => (
            <li data-gc="plan.gifts-panel.li" key={gift.code} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <Gift data-gc="plan.gifts-panel.gift" size={16} className="shrink-0 text-brand" />

              <div data-gc="plan.gifts-panel.div--2" className="min-w-0 flex-1">
                <p data-gc="plan.gifts-panel.p--2" className="truncate font-mono text-sm font-semibold tracking-wider">{gift.code}</p>
                <p data-gc="plan.gifts-panel.p--3" className="truncate text-xs text-ink-faint">
                  {gift.days} dias · {day.format(new Date(gift.createdAt))}
                </p>
              </div>

              {gift.claimedBy ? (
                <span data-gc="plan.gifts-panel.span" className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Avatar data-gc="plan.gifts-panel.avatar" id={gift.claimedBy.id} name={gift.claimedBy.displayName} url={gift.claimedBy.avatarUrl} size={20} />
                  {t("configuracoes.subscription.giftClaimedBy", { name: gift.claimedBy.displayName })}
                </span>
              ) : (
                <Button data-gc="plan.gifts-panel.button--2" variant="surface" size="sm" onClick={() => void copy(gift.code)}>
                  <Copy data-gc="plan.gifts-panel.copy" size={14} /> {t("configuracoes.subscription.giftCopyLink")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p data-gc="plan.gifts-panel.p--4" className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-faint">
          {t("configuracoes.subscription.giftsEmpty")}
        </p>
      )}
    </div>
  );
};
