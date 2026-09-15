import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, QrCode } from "lucide-react";
import { toast } from "react-toastify";
import type { PixChargeView } from "@gravae/shared";

import { BILLING_KEY, usePixCharge } from "~/@core/application/queries/billing/use-billing";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { Button } from "~/components/ui/button";
import { currentLanguage, useTranslation } from "~/traducao";

const remaining = (expiresAt: string, now: number) => {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export const PixPayment: React.FC<{ initial: PixChargeView; onPaid: () => void; onRetry: () => void }> = ({
  initial,
  onPaid,
  onRetry,
}) => {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { data } = usePixCharge(initial.id);
  const charge = data ?? initial;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (charge.status !== "paid") return;

    void client.invalidateQueries({ queryKey: BILLING_KEY });
    void client.invalidateQueries({ queryKey: [queryKeys.auth.me] });
    toast.success(t("configuracoes.subscription.pixPaid"));
    onPaid();
  }, [charge.status, client, onPaid, t]);

  const amount = new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: "BRL" }).format(charge.amount / 100);
  const expired = charge.status === "expired" || (charge.status === "pending" && new Date(charge.expiresAt).getTime() <= now);

  const copy = async () => {
    if (!charge.qrCode) return;
    await navigator.clipboard.writeText(charge.qrCode).catch(() => undefined);
    toast.success(t("configuracoes.subscription.pixCopied"));
  };

  if (charge.status === "paid") {
    return (
      <div data-gc="plan.pix-payment.div" className="mt-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 data-gc="plan.pix-payment.check-circle2" size={40} className="text-online" />
        <p data-gc="plan.pix-payment.p" className="text-sm font-medium">{t("configuracoes.subscription.pixPaid")}</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div data-gc="plan.pix-payment.div--2" className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line px-4 py-6 text-center">
        <p data-gc="plan.pix-payment.p--2" className="text-sm text-ink-muted">{t("configuracoes.subscription.pixExpired")}</p>
        <Button data-gc="plan.pix-payment.button.on-retry" onClick={onRetry}>
          <QrCode data-gc="plan.pix-payment.qr-code" size={16} /> {t("configuracoes.subscription.pixNew")}
        </Button>
      </div>
    );
  }

  return (
    <div data-gc="plan.pix-payment.div--3" className="mt-6 flex flex-col items-center text-center">
      <p data-gc="plan.pix-payment.p--3" className="text-2xl font-bold tabular-nums">{amount}</p>
      <p data-gc="plan.pix-payment.p--4" className="mt-1 max-w-sm text-sm text-ink-muted">{t("configuracoes.subscription.pixHint")}</p>

      {charge.qrCodeBase64 && (
        <img data-gc="plan.pix-payment.img"
          src={`data:image/png;base64,${charge.qrCodeBase64}`}
          alt={t("configuracoes.subscription.pixQrAlt")}
          className="mt-4 size-56 rounded-lg bg-white p-2"
        />
      )}

      <Button data-gc="plan.pix-payment.button" className="mt-4" variant="surface" onClick={() => void copy()} disabled={!charge.qrCode}>
        <Copy data-gc="plan.pix-payment.copy" size={15} /> {t("configuracoes.subscription.pixCopy")}
      </Button>

      <p data-gc="plan.pix-payment.p--5" className="mt-3 text-xs text-ink-faint">
        {t("configuracoes.subscription.pixWaiting")} · {t("configuracoes.subscription.pixExpiresIn", { time: remaining(charge.expiresAt, now) })}
      </p>
    </div>
  );
};
