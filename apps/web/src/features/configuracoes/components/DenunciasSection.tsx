import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Archive, Check, ExternalLink, Flag, Inbox, RotateCcw, ShieldAlert } from "lucide-react";

import { useGiveOutcome, useReports } from "~/@core/application/queries/admin/use-denuncias";
import type { ReportQueue } from "~/@core/application/requests/admin/denuncias";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { EmptyState, Panel, Segmented, StatusPill } from "~/features/configuracoes/components/painel/PainelUi";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const ReportsSection: React.FC = () => {
  const [pending, setPending] = useState(true);
  const queue = useReports(pending, true);

  const items = queue.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div data-gc="configuracoes.denuncias-section.div" className="w-full space-y-5 pb-10">
      <div data-gc="configuracoes.denuncias-section.div--2" className="flex flex-wrap items-center gap-3">
        <Segmented data-gc="configuracoes.denuncias-section.segmented"
          value={pending ? "fila" : "todas"}
          onChange={(value) => setPending(value === "fila")}
          options={[
            { value: "fila", label: "Na fila" },
            { value: "todas", label: "Todas" },
          ]}
        />
        {!queue.isLoading && (
          <span data-gc="configuracoes.denuncias-section.span" className="text-sm text-ink-faint">
            {items.length}
            {queue.hasNextPage ? "+" : ""} {items.length === 1 ? "denúncia" : "denúncias"}
          </span>
        )}
      </div>

      {queue.isLoading ? (
        <div data-gc="configuracoes.denuncias-section.div--3" className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton data-gc="configuracoes.denuncias-section.skeleton" key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Panel data-gc="configuracoes.denuncias-section.panel">
          <EmptyState data-gc="configuracoes.denuncias-section.empty-state"
            icon={<Inbox data-gc="configuracoes.denuncias-section.inbox" size={22} />}
            title={pending ? "Nada na fila" : "Nenhuma denúncia até agora"}
            detail={
              pending
                ? "Tudo o que chegou já teve desfecho."
                : "Quando alguém denunciar uma comunidade ou uma mensagem, aparece aqui."
            }
          />
        </Panel>
      ) : (
        <>
          <div data-gc="configuracoes.denuncias-section.div--4" className="grid items-start gap-4 xl:grid-cols-2">
            {items.map((report) => (
              <Card data-gc="configuracoes.denuncias-section.card" key={report.id} report={report} />
            ))}
          </div>

          {queue.hasNextPage && (
            <div data-gc="configuracoes.denuncias-section.div--5" className="flex justify-center">
              <Button data-gc="configuracoes.denuncias-section.button" variant="surface" loading={queue.isFetchingNextPage} onClick={() => void queue.fetchNextPage()}>
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Card: React.FC<{ report: ReportQueue }> = ({ report }) => {
  const navigate = useNavigate();
  const closeSettings = useSettings((s) => s.close);
  const outcome = useGiveOutcome();

  const isMessage = report.kind === "mensagem";
  const resolved = Boolean(report.resolvedAt);

  const irForMessage = () => {
    const m = report.message;
    if (!m) return;

    closeSettings();
    navigate(`/channels/${m.guildId ?? "@me"}/${m.channelId}/${m.id}`);
  };

  const decide = (decision: "procede" | "arquivada" | "reabrir") =>
    outcome.mutate({ id: report.id, decision });

  return (
    <article data-gc="configuracoes.denuncias-section.article" className={cn("overflow-hidden rounded-xl border border-line-sutil bg-surface-1", resolved && "opacity-70")}>
      <header data-gc="configuracoes.denuncias-section.header" className="flex items-center gap-3 border-b border-line-sutil px-4 py-3">
        <span data-gc="configuracoes.denuncias-section.span--2" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger/12 text-danger">
          {isMessage ? <Flag data-gc="configuracoes.denuncias-section.flag" size={15} /> : <ShieldAlert data-gc="configuracoes.denuncias-section.shield-alert" size={15} />}
        </span>

        <div data-gc="configuracoes.denuncias-section.div--6" className="min-w-0 flex-1">
          <p data-gc="configuracoes.denuncias-section.p" className="truncate text-sm font-semibold">{report.reasonWritten}</p>
          <p data-gc="configuracoes.denuncias-section.p--2" className="truncate text-xs text-ink-faint">
            {isMessage ? "Mensagem" : "Comunidade"} · por {report.author ? `@${report.author.username}` : "conta apagada"}
            {report.community && ` · em ${report.community.name}`}
          </p>
        </div>

        {resolved ? (
          <StatusPill data-gc="configuracoes.denuncias-section.status-pill" tone={report.decision === "procede" ? "danger" : "neutral"}>
            {report.decision === "procede" ? "Procede" : "Arquivada"}
          </StatusPill>
        ) : (
          <StatusPill data-gc="configuracoes.denuncias-section.status-pill--2" tone="warn">Na fila</StatusPill>
        )}
      </header>

      <div data-gc="configuracoes.denuncias-section.div--7" className="space-y-3 px-4 py-3">
        {report.message && (
          <blockquote data-gc="configuracoes.denuncias-section.blockquote" className="rounded-lg border-l-2 border-danger/50 bg-surface-2 px-3 py-2">
            <p data-gc="configuracoes.denuncias-section.p--3" className="text-xs font-semibold text-ink-muted">
              {report.message.author ? `@${report.message.author.username}` : "conta apagada"}
            </p>
            <p data-gc="configuracoes.denuncias-section.p--4" className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">{report.message.snippet || "(sem texto)"}</p>
          </blockquote>
        )}

        {report.details && <p data-gc="configuracoes.denuncias-section.p--5" className="whitespace-pre-wrap break-words text-sm text-ink-muted">{report.details}</p>}

        <p data-gc="configuracoes.denuncias-section.p--6" className="text-xs text-ink-faint">
          {resolved
            ? `Decidida em ${when.format(new Date(report.resolvedAt!))} · chegou em ${when.format(new Date(report.createdAt))}`
            : `Chegou em ${when.format(new Date(report.createdAt))}`}
        </p>
      </div>

      <footer data-gc="configuracoes.denuncias-section.footer" className="flex flex-wrap items-center gap-2 border-t border-line-sutil bg-surface-2/40 px-4 py-2.5">
        {report.message && (
          <Button data-gc="configuracoes.denuncias-section.button.ir-for-message" variant="ghost" size="sm" onClick={irForMessage}>
            <ExternalLink data-gc="configuracoes.denuncias-section.external-link" size={14} /> Ir até a mensagem
          </Button>
        )}

        {resolved ? (
          <Button data-gc="configuracoes.denuncias-section.button--2" variant="surface" size="sm" className="ml-auto" disabled={outcome.isPending} onClick={() => decide("reabrir")}>
            <RotateCcw data-gc="configuracoes.denuncias-section.rotate-ccw" size={14} /> Reabrir
          </Button>
        ) : (
          <div data-gc="configuracoes.denuncias-section.div--8" className="ml-auto flex gap-2">
            <Button data-gc="configuracoes.denuncias-section.button--3" variant="surface" size="sm" disabled={outcome.isPending} onClick={() => decide("arquivada")}>
              <Archive data-gc="configuracoes.denuncias-section.archive" size={14} /> Arquivar
            </Button>
            <Button data-gc="configuracoes.denuncias-section.button--4" size="sm" disabled={outcome.isPending} onClick={() => decide("procede")}>
              <Check data-gc="configuracoes.denuncias-section.check" size={14} /> Procede
            </Button>
          </div>
        )}
      </footer>
    </article>
  );
};
