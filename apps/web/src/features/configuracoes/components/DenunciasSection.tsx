import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Archive, Check, Flag, Inbox, RotateCcw, ShieldAlert } from "lucide-react";

import { useGiveOutcome, useReports } from "~/@core/application/queries/admin/use-denuncias";
import type { ReportQueue } from "~/@core/application/requests/admin/denuncias";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const ReportsSection: React.FC = () => {
  const [pending, setPending] = useState(true);
  const queue = useReports(pending, true);

  const items = queue.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div data-gc="configuracoes.denuncias-section.div" className="max-w-2xl pb-10">
      <Section data-gc="configuracoes.denuncias-section.section" id="denuncias" title="Denúncias">
        <div data-gc="configuracoes.denuncias-section.div--2" className="mb-4 flex items-center gap-1">
          <Tab data-gc="configuracoes.denuncias-section.tab" active={pending} onPick={() => setPending(true)}>
            Na fila
          </Tab>
          <Tab data-gc="configuracoes.denuncias-section.tab--2" active={!pending} onPick={() => setPending(false)}>
            Todas
          </Tab>
        </div>

        {queue.isLoading ? (
          <div data-gc="configuracoes.denuncias-section.div--3" className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton data-gc="configuracoes.denuncias-section.skeleton" key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div data-gc="configuracoes.denuncias-section.div--4" className="flex flex-col items-center gap-3 rounded-lg bg-surface-2 py-14 text-center">
            <Inbox data-gc="configuracoes.denuncias-section.inbox" size={32} className="text-ink-faint" />
            <div data-gc="configuracoes.denuncias-section.div--5">
              <p data-gc="configuracoes.denuncias-section.p" className="text-sm font-medium">
                {pending ? "Nada na fila" : "Nenhuma denúncia até agora"}
              </p>
              <p data-gc="configuracoes.denuncias-section.p--2" className="mt-1 text-xs text-ink-faint">
                {pending
                  ? "Tudo o que chegou já teve desfecho."
                  : "Quando alguém denunciar uma comunidade ou uma mensagem, aparece aqui."}
              </p>
            </div>
          </div>
        ) : (
          <div data-gc="configuracoes.denuncias-section.div--6" className="space-y-3">
            {items.map((report) => (
              <Card data-gc="configuracoes.denuncias-section.card" key={report.id} report={report} />
            ))}

            {queue.hasNextPage && (
              <Button data-gc="configuracoes.denuncias-section.button"
                variant="surface"
                className="w-full"
                disabled={queue.isFetchingNextPage}
                onClick={() => void queue.fetchNextPage()}
              >
                {queue.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};

const Tab: React.FC<{ active: boolean; onPick: () => void; children: React.ReactNode }> = ({
  active,
  onPick,
  children,
}) => (
  <button data-gc="configuracoes.denuncias-section.button.on-pick"
    type="button"
    onClick={onPick}
    className={cn(
      "rounded px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {children}
  </button>
);

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
    <article data-gc="configuracoes.denuncias-section.article" className={cn("rounded-lg bg-surface-2 p-4", resolved && "opacity-60")}>
      <header data-gc="configuracoes.denuncias-section.header" className="flex items-center gap-2">
        {isMessage ? (
          <Flag data-gc="configuracoes.denuncias-section.flag" size={14} className="shrink-0 text-danger" />
        ) : (
          <ShieldAlert data-gc="configuracoes.denuncias-section.shield-alert" size={14} className="shrink-0 text-danger" />
        )}

        <span data-gc="configuracoes.denuncias-section.span" className="text-sm font-semibold">
          {isMessage ? "Mensagem" : "Comunidade"} · {report.reasonWritten}
        </span>

        <span data-gc="configuracoes.denuncias-section.span--2" className="ml-auto shrink-0 text-xs text-ink-faint">
          {when.format(new Date(report.createdAt))}
        </span>
      </header>

      <p data-gc="configuracoes.denuncias-section.p--3" className="mt-1 text-xs text-ink-faint">
        Por {report.author ? `@${report.author.username}` : "conta apagada"}
        {report.community && ` · em ${report.community.name}`}
      </p>

      {report.message && (
        <blockquote data-gc="configuracoes.denuncias-section.blockquote" className="mt-3 border-l-2 border-line pl-3">
          <p data-gc="configuracoes.denuncias-section.p--4" className="text-xs font-semibold text-ink-muted">
            {report.message.author ? `@${report.message.author.username}` : "conta apagada"}
          </p>
          <p data-gc="configuracoes.denuncias-section.p--5" className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink">
            {report.message.snippet || "(sem texto)"}
          </p>
        </blockquote>
      )}

      {report.details && (
        <p data-gc="configuracoes.denuncias-section.p--6" className="mt-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
          {report.details}
        </p>
      )}

      <footer data-gc="configuracoes.denuncias-section.footer" className="mt-4 flex flex-wrap items-center gap-2">
        {report.message && (
          <Button data-gc="configuracoes.denuncias-section.button.ir-for-message" variant="surface" size="sm" onClick={irForMessage}>
            Ir até a mensagem
          </Button>
        )}

        {resolved ? (
          <>
            <span data-gc="configuracoes.denuncias-section.span--3" className="text-xs text-ink-faint">
              {report.decision === "procede" ? "Marcada como procedente" : "Arquivada"} em{" "}
              {when.format(new Date(report.resolvedAt!))}
            </span>

            <Button data-gc="configuracoes.denuncias-section.button--2"
              variant="surface"
              size="sm"
              className="ml-auto"
              disabled={outcome.isPending}
              onClick={() => decide("reabrir")}
            >
              <RotateCcw data-gc="configuracoes.denuncias-section.rotate-ccw" size={14} /> Reabrir
            </Button>
          </>
        ) : (
          <div data-gc="configuracoes.denuncias-section.div--7" className="ml-auto flex gap-2">
            <Button data-gc="configuracoes.denuncias-section.button--3"
              variant="surface"
              size="sm"
              disabled={outcome.isPending}
              onClick={() => decide("arquivada")}
            >
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
