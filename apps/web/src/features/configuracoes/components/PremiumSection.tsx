import React, { useState } from "react";
import { Infinity as InfinityIcon, Search, X } from "lucide-react";
import { PLAN_LIMITS, planOf, type PremiumAccount } from "@gravae/shared";

import { useGrantPremium, usePremiumAccounts, useRevokePremium } from "~/@core/application/queries/admin/use-premium";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { EmptyState, Panel, StatusPill } from "~/features/configuracoes/components/painel/PainelUi";
import { Avatar } from "~/features/perfil/components/Avatar";

const GRANT_OPTIONS = [
  { days: 7, label: "+7 dias" },
  { days: 30, label: "+30 dias" },
  { days: 365, label: "+1 ano" },
];

const SOURCE_NAME: Record<NonNullable<PremiumAccount["premiumSource"]>, string> = {
  grant: "dado no painel",
  stripe_subscription: "assinatura no cartão",
  stripe_pass: "período avulso",
  gift: "presente resgatado",
};

const day = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const megabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

export const PremiumSection: React.FC = () => {
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");
  const accounts = usePremiumAccounts(term);

  return (
    <div data-gc="configuracoes.premium-section.div" className="grid w-full items-start gap-6 pb-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel data-gc="configuracoes.premium-section.panel"
        title={term ? `Contas com “${term}”` : "Quem tem premium agora"}
        icon={<InfinityIcon data-gc="configuracoes.premium-section.infinity-icon" size={16} />}
        description={term ? "Busca por e-mail exato, usuário ou nome" : "Ordenado por quem vence primeiro"}
        flush
      >
        <form data-gc="configuracoes.premium-section.form"
          className="flex gap-2 border-b border-line-sutil p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(draft.trim());
          }}
        >
          <Input data-gc="configuracoes.premium-section.input"
            aria-label="Buscar conta"
            placeholder="E-mail, usuário ou nome"
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button data-gc="configuracoes.premium-section.button" type="submit" variant="surface" disabled={draft.trim().length === 1}>
            <Search data-gc="configuracoes.premium-section.search" size={15} /> Buscar
          </Button>
          {term && (
            <Button data-gc="configuracoes.premium-section.button--2"
              type="button"
              variant="ghost"
              aria-label="Limpar busca"
              onClick={() => {
                setDraft("");
                setTerm("");
              }}
            >
              <X data-gc="configuracoes.premium-section.x" size={15} />
            </Button>
          )}
        </form>

        {accounts.isPending ? (
          <Skeleton data-gc="configuracoes.premium-section.skeleton" className="m-3 h-32 rounded-lg" />
        ) : accounts.data?.length ? (
          <ul data-gc="configuracoes.premium-section.ul" className="divide-y divide-line-sutil">
            {accounts.data.map((account) => (
              <AccountRow data-gc="configuracoes.premium-section.account-row" key={account.id} account={account} />
            ))}
          </ul>
        ) : (
          <EmptyState data-gc="configuracoes.premium-section.empty-state"
            icon={<InfinityIcon data-gc="configuracoes.premium-section.infinity-icon--2" size={20} />}
            title={term ? "Nenhuma conta encontrada" : "Ninguém com premium"}
            detail={term ? undefined : "Busque uma conta para liberar dias de premium."}
          />
        )}
      </Panel>

      <Panel data-gc="configuracoes.premium-section.panel--2" title="O que o Infinity libera" description="Grátis → Infinity">
        <dl data-gc="configuracoes.premium-section.dl" className="space-y-2 text-sm">
          <Limit data-gc="configuracoes.premium-section.limit"
            name="Mensagem"
            free={`${PLAN_LIMITS.free.messageLength} caracteres`}
            premium={`${PLAN_LIMITS.premium.messageLength} caracteres`}
          />
          <Limit data-gc="configuracoes.premium-section.limit--2"
            name="Anexo"
            free={megabytes(PLAN_LIMITS.free.attachmentBytes)}
            premium={megabytes(PLAN_LIMITS.premium.attachmentBytes)}
          />
          <Limit data-gc="configuracoes.premium-section.limit--3"
            name="Envio por hora"
            free={megabytes(PLAN_LIMITS.free.uploadQuotaByHour)}
            premium={megabytes(PLAN_LIMITS.premium.uploadQuotaByHour)}
          />
          <Limit data-gc="configuracoes.premium-section.limit--4"
            name="Comunidades"
            free={String(PLAN_LIMITS.free.communities)}
            premium={String(PLAN_LIMITS.premium.communities)}
          />
          <Limit data-gc="configuracoes.premium-section.limit--5"
            name="Mensagens salvas"
            free={String(PLAN_LIMITS.free.savedMessages)}
            premium={String(PLAN_LIMITS.premium.savedMessages)}
          />
          <Limit data-gc="configuracoes.premium-section.limit--6"
            name="Transmissão de tela"
            free={`até ${PLAN_LIMITS.free.screenResolutions.at(-1)}p · ${PLAN_LIMITS.free.screenFrameRates.at(-1)} fps`}
            premium={`até ${PLAN_LIMITS.premium.screenResolutions.at(-1)}p · ${PLAN_LIMITS.premium.screenFrameRates.at(-1)} fps`}
          />
        </dl>
        <p data-gc="configuracoes.premium-section.p" className="mt-3 text-xs text-ink-faint">
          Anexo acima de {megabytes(PLAN_LIMITS.free.attachmentBytes)} só passa com envio direto ao armazenamento ligado.
        </p>
      </Panel>
    </div>
  );
};

const Limit: React.FC<{ name: string; free: string; premium: string }> = ({ name, free, premium }) => (
  <div data-gc="configuracoes.premium-section.div--2" className="flex items-baseline justify-between gap-3">
    <dt data-gc="configuracoes.premium-section.dt" className="text-ink-muted">{name}</dt>
    <dd data-gc="configuracoes.premium-section.dd" className="text-right tabular-nums">
      <span data-gc="configuracoes.premium-section.span" className="text-ink-faint">{free}</span> → <span data-gc="configuracoes.premium-section.span--2" className="font-medium text-ink">{premium}</span>
    </dd>
  </div>
);

const AccountRow: React.FC<{ account: PremiumAccount }> = ({ account }) => {
  const grant = useGrantPremium();
  const revoke = useRevokePremium();
  const confirm = useConfirm();
  const active = planOf(account.premiumUntil) === "premium";

  const takeAway = async () => {
    const { confirmed } = await confirm({
      title: `Tirar o premium de ${account.displayName}?`,
      description: "Os limites voltam aos do grátis na hora. Dias que sobravam não voltam.",
      action: "Tirar",
      destructive: true,
    });

    if (confirmed) revoke.mutate(account.id);
  };

  return (
    <li data-gc="configuracoes.premium-section.li" className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar data-gc="configuracoes.premium-section.avatar" id={account.id} name={account.displayName} url={account.avatarUrl} size={36} />

      <div data-gc="configuracoes.premium-section.div--3" className="min-w-0 flex-1">
        <p data-gc="configuracoes.premium-section.p--2" className="truncate text-sm font-semibold">{account.displayName}</p>
        <p data-gc="configuracoes.premium-section.p--3" className="truncate text-xs text-ink-faint">
          @{account.username} · {account.email}
        </p>
      </div>

      {active && account.premiumUntil ? (
        <StatusPill data-gc="configuracoes.premium-section.status-pill" tone="brand">
          até {day.format(new Date(account.premiumUntil))}
          {account.premiumSource ? ` · ${SOURCE_NAME[account.premiumSource]}` : ""}
        </StatusPill>
      ) : (
        <StatusPill data-gc="configuracoes.premium-section.status-pill--2" tone="neutral">grátis</StatusPill>
      )}

      <div data-gc="configuracoes.premium-section.div--4" className="flex gap-1.5">
        {GRANT_OPTIONS.map((option) => (
          <Button data-gc="configuracoes.premium-section.button--3"
            key={option.days}
            size="sm"
            variant="surface"
            loading={grant.isPending && grant.variables?.days === option.days}
            disabled={grant.isPending}
            onClick={() => grant.mutate({ userId: account.id, days: option.days })}
          >
            {option.label}
          </Button>
        ))}

        {active && (
          <Button data-gc="configuracoes.premium-section.button--4" size="sm" variant="ghost" loading={revoke.isPending} onClick={() => void takeAway()}>
            Tirar
          </Button>
        )}
      </div>
    </li>
  );
};
