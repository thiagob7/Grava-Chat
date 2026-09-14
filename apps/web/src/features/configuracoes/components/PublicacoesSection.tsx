import React, { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleDashed,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  Globe,
  Hourglass,
  KeyRound,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  Inbox,
  X,
} from "lucide-react";
import type { PublicationsView, WorkflowRun, WorkflowState } from "@gravae/shared";

import { usePublications, useReviewPublication } from "~/@core/application/queries/admin/use-painel";
import { usePosts } from "~/@core/application/queries/admin/use-publicacoes";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Skeleton } from "~/components/ui/skeleton";
import { delay, writeSince } from "~/features/configuracoes/lib/publicacoes";
import { Callout, EmptyState, Heading, Panel } from "~/features/configuracoes/components/painel/PainelUi";
import { cn } from "~/lib/utils";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const ago = (iso: string) => writeSince(Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000)));

const took = (start: string | null, end: string | null) => {
  if (!start) return null;

  const seconds = Math.round(((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;

  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
};

const STATE_NAME: Record<WorkflowState, string> = {
  esperando: "esperando aprovação",
  rodando: "rodando",
  boa: "concluída",
  falhou: "falhou",
  cancelada: "cancelada",
};

export const PostsSection: React.FC = () => {
  const { data, isPending, isError, refetch, isFetching } = usePublications(true);

  if (isPending) {
    return (
      <div data-gc="configuracoes.publicacoes-section.div" className="w-full space-y-4">
        <Skeleton data-gc="configuracoes.publicacoes-section.skeleton" className="h-28 rounded-xl" />
        <div data-gc="configuracoes.publicacoes-section.div--2" className="grid gap-4 lg:grid-cols-2">
          <Skeleton data-gc="configuracoes.publicacoes-section.skeleton--2" className="h-44 rounded-xl" />
          <Skeleton data-gc="configuracoes.publicacoes-section.skeleton--3" className="h-44 rounded-xl" />
        </div>
        <Skeleton data-gc="configuracoes.publicacoes-section.skeleton--4" className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return <p data-gc="configuracoes.publicacoes-section.p" className="text-sm text-danger">Não consegui carregar as publicações.</p>;
  }

  const waiting = data.runs.filter((run) => run.state === "esperando");

  return (
    <div data-gc="configuracoes.publicacoes-section.div--3" className="w-full space-y-6 pb-10">
      <div data-gc="configuracoes.publicacoes-section.div--4" className="flex flex-wrap items-center gap-3">
        <p data-gc="configuracoes.publicacoes-section.p--2" className="text-sm text-ink-muted">
          O que roda em cada máquina, o que está subindo e o que falta subir, lido do GitHub de{" "}
          <a data-gc="configuracoes.publicacoes-section.a"
            href={`https://github.com/${data.repository}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-link hover:underline"
          >
            {data.repository}
          </a>
          .
        </p>

        <Button data-gc="configuracoes.publicacoes-section.button" variant="surface" size="sm" className="ml-auto" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw data-gc="configuracoes.publicacoes-section.refresh-cw" size={14} className={cn(isFetching && "animate-spin")} /> Atualizar
        </Button>
      </div>

      {data.error && (
        <Callout data-gc="configuracoes.publicacoes-section.callout" tone="danger" icon={<AlertTriangle data-gc="configuracoes.publicacoes-section.alert-triangle" size={16} />}>
          {data.error}
        </Callout>
      )}

      {!data.tokenConfigured && (
        <Callout data-gc="configuracoes.publicacoes-section.callout--2" tone="warn" icon={<KeyRound data-gc="configuracoes.publicacoes-section.key-round" size={16} />}>
          O servidor está sem <code data-gc="configuracoes.publicacoes-section.code" className="font-mono">GITHUB_TOKEN</code>. Dá para acompanhar, mas aprovar só pelo
          GitHub, e a leitura fica limitada a poucas consultas por hora.
        </Callout>
      )}

      {waiting.map((run) => (
        <WaitingCard data-gc="configuracoes.publicacoes-section.waiting-card" key={run.id} run={run} canApprove={data.canApprove} />
      ))}

      <section data-gc="configuracoes.publicacoes-section.section">
        <Heading data-gc="configuracoes.publicacoes-section.heading" icon={<Server data-gc="configuracoes.publicacoes-section.server" size={15} />}>Ambientes</Heading>
        <Environments data-gc="configuracoes.publicacoes-section.environments" data={data} />
      </section>

      <div data-gc="configuracoes.publicacoes-section.div--5" className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section data-gc="configuracoes.publicacoes-section.section--2">
          <Heading data-gc="configuracoes.publicacoes-section.heading--2" icon={<RefreshCw data-gc="configuracoes.publicacoes-section.refresh-cw--2" size={15} />}>Execuções recentes</Heading>

          {data.runs.length ? (
            <div data-gc="configuracoes.publicacoes-section.div--6" className="divide-y divide-line overflow-hidden rounded-xl border border-line-sutil bg-surface-1">
              {data.runs.map((run) => (
                <RunRow data-gc="configuracoes.publicacoes-section.run-row" key={run.id} run={run} />
              ))}
            </div>
          ) : (
            <Panel data-gc="configuracoes.publicacoes-section.panel"><EmptyState data-gc="configuracoes.publicacoes-section.empty-state" icon={<Inbox data-gc="configuracoes.publicacoes-section.inbox" size={22} />} title="Nenhuma execução ainda." className="py-8" /></Panel>
          )}
        </section>

        <section data-gc="configuracoes.publicacoes-section.section--3">
          <Heading data-gc="configuracoes.publicacoes-section.heading--3" icon={<GitCommitHorizontal data-gc="configuracoes.publicacoes-section.git-commit-horizontal" size={15} />}>
            Falta subir{" "}
            <span data-gc="configuracoes.publicacoes-section.span" className="ml-1 rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-ink-muted">
              {data.toShip.count}
            </span>
          </Heading>

          {data.toShip.commits.length ? (
            <ul data-gc="configuracoes.publicacoes-section.ul" className="space-y-1 rounded-xl border border-line-sutil bg-surface-1 p-3">
              {data.toShip.commits.map((commit) => (
                <li data-gc="configuracoes.publicacoes-section.li" key={commit.sha} className="flex items-baseline gap-2 rounded px-1.5 py-1 text-sm">
                  <code data-gc="configuracoes.publicacoes-section.code--2" className="shrink-0 text-xs text-ink-faint">{commit.sha}</code>
                  <span data-gc="configuracoes.publicacoes-section.span--2" className="min-w-0 flex-1 truncate" title={commit.message}>
                    {commit.message}
                  </span>
                  <span data-gc="configuracoes.publicacoes-section.span--3" className="shrink-0 text-xs text-ink-faint">{ago(commit.when)}</span>
                </li>
              ))}
              {data.toShip.count > data.toShip.commits.length && (
                <li data-gc="configuracoes.publicacoes-section.li--2" className="px-1.5 pt-1 text-xs text-ink-faint">
                  e mais {data.toShip.count - data.toShip.commits.length}
                </li>
              )}
            </ul>
          ) : (
            <Panel data-gc="configuracoes.publicacoes-section.panel--2"><EmptyState data-gc="configuracoes.publicacoes-section.empty-state--2" icon={<Inbox data-gc="configuracoes.publicacoes-section.inbox--2" size={22} />} title="A master já tem tudo o que está na dev." className="py-8" /></Panel>
          )}

          <a data-gc="configuracoes.publicacoes-section.a--2"
            href={`https://github.com/${data.repository}/compare/master...dev`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-link hover:underline"
          >
            comparar dev com master no GitHub <ExternalLink data-gc="configuracoes.publicacoes-section.external-link" size={11} />
          </a>
        </section>
      </div>
    </div>
  );
};

const WaitingCard: React.FC<{ run: WorkflowRun; canApprove: boolean }> = ({ run, canApprove }) => {
  const confirm = useConfirm();
  const review = useReviewPublication();

  const decide = async (approve: boolean) => {
    const { confirmed } = await confirm({
      title: approve ? "Aprovar esta publicação?" : "Recusar esta publicação?",
      description: approve
        ? `O commit ${run.commit} vai para produção agora. No GitHub a aprovação sai no nome do dono do token, e o painel registra que foi você.`
        : `O commit ${run.commit} não sobe. Para publicar depois, é preciso um novo merge ou rodar o fluxo de novo no GitHub.`,
      action: approve ? "Aprovar e publicar" : "Recusar",
      destructive: !approve,
    });

    if (confirmed) review.mutate({ runId: run.id, approve });
  };

  return (
    <article data-gc="configuracoes.publicacoes-section.article" className="rounded-xl border border-idle/40 bg-idle/10 p-5">
      <div data-gc="configuracoes.publicacoes-section.div--7" className="flex flex-wrap items-start gap-4">
        <span data-gc="configuracoes.publicacoes-section.span--4" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-idle/20 text-idle">
          <Hourglass data-gc="configuracoes.publicacoes-section.hourglass" size={20} />
        </span>

        <div data-gc="configuracoes.publicacoes-section.div--8" className="min-w-0 flex-1">
          <p data-gc="configuracoes.publicacoes-section.p--3" className="text-xs font-semibold uppercase tracking-wide text-idle">Esperando aprovação</p>
          <h3 data-gc="configuracoes.publicacoes-section.h3" className="mt-0.5 truncate text-base font-semibold">{run.title}</h3>
          <p data-gc="configuracoes.publicacoes-section.p--4" className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span data-gc="configuracoes.publicacoes-section.span--5">{run.workflow}</span>
            <span data-gc="configuracoes.publicacoes-section.span--6" className="flex items-center gap-1">
              <GitBranch data-gc="configuracoes.publicacoes-section.git-branch" size={12} /> {run.branch}
            </span>
            <code data-gc="configuracoes.publicacoes-section.code--3">{run.commit}</code>
            {run.actor && <span data-gc="configuracoes.publicacoes-section.span--7">por {run.actor}</span>}
            <span data-gc="configuracoes.publicacoes-section.span--8">há {ago(run.createdAt)}</span>
            {run.pending.length > 0 && <span data-gc="configuracoes.publicacoes-section.span--9">ambiente {run.pending.map((p) => p.environment).join(", ")}</span>}
          </p>

          <JobsProgress data-gc="configuracoes.publicacoes-section.jobs-progress" run={run} />
        </div>

        <div data-gc="configuracoes.publicacoes-section.div--9" className="flex shrink-0 gap-2">
          {canApprove ? (
            <>
              <Button data-gc="configuracoes.publicacoes-section.button--2" variant="surface" onClick={() => void decide(false)} disabled={review.isPending}>
                <X data-gc="configuracoes.publicacoes-section.x" size={16} /> Recusar
              </Button>
              <Button data-gc="configuracoes.publicacoes-section.button--3" onClick={() => void decide(true)} loading={review.isPending}>
                <ShieldCheck data-gc="configuracoes.publicacoes-section.shield-check" size={16} /> Aprovar
              </Button>
            </>
          ) : (
            <Button data-gc="configuracoes.publicacoes-section.button--4" asChild variant="surface">
              <a data-gc="configuracoes.publicacoes-section.a--3" href={run.link} target="_blank" rel="noreferrer">
                Aprovar no GitHub <ExternalLink data-gc="configuracoes.publicacoes-section.external-link--2" size={14} />
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

const JobsProgress: React.FC<{ run: WorkflowRun }> = ({ run }) => (
  <ol data-gc="configuracoes.publicacoes-section.ol" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
    {run.jobs.map((job, i) => (
      <li data-gc="configuracoes.publicacoes-section.li--3" key={job.name} className="flex items-center gap-2">
        {i > 0 && <span data-gc="configuracoes.publicacoes-section.span--10" className="h-px w-4 bg-line" aria-hidden />}
        <span data-gc="configuracoes.publicacoes-section.span--11" className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1">
          <StateIcon data-gc="configuracoes.publicacoes-section.state-icon" state={job.state} size={12} /> {job.name}
        </span>
      </li>
    ))}
  </ol>
);

const Environments: React.FC<{ data: PublicationsView }> = ({ data }) => {
  const lines = usePosts(true);
  const web = data.web.find((deploy) => deploy.environment === "Production");

  return (
    <div data-gc="configuracoes.publicacoes-section.div--10" className="grid gap-4 lg:grid-cols-2">
      {lines.map(({ environment, api }) => {
        const branch = data.branches[environment.branch as "master" | "staging"];
        const situation = delay(api.data?.commit ?? null, branch?.sha ?? null);
        const production = environment.id === "producao";

        return (
          <article data-gc="configuracoes.publicacoes-section.article--2" key={environment.id} className="rounded-xl border border-line-sutil bg-surface-1 p-4">
            <header data-gc="configuracoes.publicacoes-section.header" className="flex items-center gap-2">
              <span data-gc="configuracoes.publicacoes-section.span--12"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  api.isError ? "bg-danger" : api.isPending ? "bg-idle" : "bg-online",
                )}
              />
              <h3 data-gc="configuracoes.publicacoes-section.h3--2" className="text-sm font-semibold">{environment.name}</h3>
              <span data-gc="configuracoes.publicacoes-section.span--13" className="flex items-center gap-1 text-xs text-ink-faint">
                <GitBranch data-gc="configuracoes.publicacoes-section.git-branch--2" size={12} /> {environment.branch}
              </span>
              <a data-gc="configuracoes.publicacoes-section.a--4"
                href={environment.front}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-link hover:underline"
              >
                abrir <ExternalLink data-gc="configuracoes.publicacoes-section.external-link--3" size={11} />
              </a>
            </header>

            <dl data-gc="configuracoes.publicacoes-section.dl" className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt data-gc="configuracoes.publicacoes-section.dt" className="flex items-center gap-1.5 text-ink-faint">
                <Server data-gc="configuracoes.publicacoes-section.server--2" size={13} /> API
              </dt>
              <dd data-gc="configuracoes.publicacoes-section.dd" className="min-w-0">
                {api.isPending ? (
                  <span data-gc="configuracoes.publicacoes-section.span--14" className="text-ink-faint">consultando…</span>
                ) : api.isError ? (
                  <span data-gc="configuracoes.publicacoes-section.span--15" className="text-danger">não respondeu</span>
                ) : (
                  <>
                    <code data-gc="configuracoes.publicacoes-section.code--4" className="text-ink">{api.data?.commit ?? "sem versão"}</code>
                    <span data-gc="configuracoes.publicacoes-section.span--16" className="ml-2 text-xs text-ink-faint">
                      {api.data?.builtAt ? when.format(new Date(api.data.builtAt)) : ""} · de pé há{" "}
                      {writeSince(api.data?.sinceSeconds ?? null)}
                    </span>
                  </>
                )}
              </dd>

              {production && (
                <>
                  <dt data-gc="configuracoes.publicacoes-section.dt--2" className="flex items-center gap-1.5 text-ink-faint">
                    <Globe data-gc="configuracoes.publicacoes-section.globe" size={13} /> Web
                  </dt>
                  <dd data-gc="configuracoes.publicacoes-section.dd--2" className="flex min-w-0 items-center gap-2">
                    {web ? (
                      <>
                        <StateIcon data-gc="configuracoes.publicacoes-section.state-icon--2" state={web.state} size={13} />
                        <code data-gc="configuracoes.publicacoes-section.code--5" className="text-ink">{web.commit}</code>
                        <span data-gc="configuracoes.publicacoes-section.span--17" className="text-xs text-ink-faint">Vercel · há {ago(web.createdAt)}</span>
                      </>
                    ) : (
                      <span data-gc="configuracoes.publicacoes-section.span--18" className="text-ink-faint">sem deploy lido</span>
                    )}
                  </dd>
                </>
              )}

              <dt data-gc="configuracoes.publicacoes-section.dt--3" className="flex items-center gap-1.5 text-ink-faint">
                <GitCommitHorizontal data-gc="configuracoes.publicacoes-section.git-commit-horizontal--2" size={13} /> Branch
              </dt>
              <dd data-gc="configuracoes.publicacoes-section.dd--3" className="min-w-0 truncate">
                {branch ? (
                  <>
                    <code data-gc="configuracoes.publicacoes-section.code--6" className="text-ink">{branch.sha.slice(0, 7)}</code>
                    <span data-gc="configuracoes.publicacoes-section.span--19" className="ml-2 text-xs text-ink-muted">{branch.message}</span>
                  </>
                ) : (
                  <span data-gc="configuracoes.publicacoes-section.span--20" className="text-ink-faint">GitHub não respondeu</span>
                )}
              </dd>
            </dl>

            {situation !== "desconhecido" && (
              <p data-gc="configuracoes.publicacoes-section.p--5"
                className={cn(
                  "mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                  situation === "igual" ? "bg-online/10 text-online" : "bg-idle/10 text-idle",
                )}
              >
                {situation === "igual" ? (
                  <>
                    <Check data-gc="configuracoes.publicacoes-section.check" size={13} /> A API está com o mesmo commit da branch.
                  </>
                ) : (
                  <>
                    <AlertTriangle data-gc="configuracoes.publicacoes-section.alert-triangle--2" size={13} /> A branch avançou e a API não foi republicada.
                  </>
                )}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
};

const RunRow: React.FC<{ run: WorkflowRun }> = ({ run }) => {
  const [open, setOpen] = useState(run.state === "rodando");

  return (
    <div data-gc="configuracoes.publicacoes-section.div--11">
      <button data-gc="configuracoes.publicacoes-section.button--5"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-hover"
      >
        <StateIcon data-gc="configuracoes.publicacoes-section.state-icon--3" state={run.state} />

        <span data-gc="configuracoes.publicacoes-section.span--21" className="min-w-0 flex-1">
          <span data-gc="configuracoes.publicacoes-section.span--22" className="block truncate text-sm font-medium">{run.title}</span>
          <span data-gc="configuracoes.publicacoes-section.span--23" className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
            <span data-gc="configuracoes.publicacoes-section.span--24">{run.workflow}</span>
            <code data-gc="configuracoes.publicacoes-section.code--7">{run.commit}</code>
            <span data-gc="configuracoes.publicacoes-section.span--25">{STATE_NAME[run.state]}</span>
            {run.reviews[0] && <span data-gc="configuracoes.publicacoes-section.span--26">· aprovada por {run.reviews[0].user}</span>}
          </span>
        </span>

        <span data-gc="configuracoes.publicacoes-section.span--27" className="shrink-0 text-xs text-ink-faint">há {ago(run.createdAt)}</span>
        <ChevronDown data-gc="configuracoes.publicacoes-section.chevron-down" size={15} className={cn("shrink-0 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div data-gc="configuracoes.publicacoes-section.div--12" className="space-y-3 border-t border-line-sutil bg-surface-2/50 px-4 pb-4 pt-3">
          {run.jobs.map((job) => (
            <div data-gc="configuracoes.publicacoes-section.div--13" key={job.name}>
              <p data-gc="configuracoes.publicacoes-section.p--6" className="flex items-center gap-2 text-sm font-medium">
                <StateIcon data-gc="configuracoes.publicacoes-section.state-icon--4" state={job.state} size={13} /> {job.name}
                <span data-gc="configuracoes.publicacoes-section.span--28" className="text-xs font-normal text-ink-faint">{took(job.startedAt, job.completedAt)}</span>
              </p>

              {job.steps.length > 0 && (
                <ol data-gc="configuracoes.publicacoes-section.ol--2" className="ml-[7px] mt-1.5 space-y-1 border-l border-line pl-4">
                  {job.steps.map((step) => (
                    <li data-gc="configuracoes.publicacoes-section.li--4" key={step.name} className="flex items-center gap-2 text-xs text-ink-muted">
                      <StateIcon data-gc="configuracoes.publicacoes-section.state-icon--5" state={step.state} size={11} />
                      <span data-gc="configuracoes.publicacoes-section.span--29" className="min-w-0 flex-1 truncate">{step.name}</span>
                      <span data-gc="configuracoes.publicacoes-section.span--30" className="shrink-0 text-ink-faint">{took(step.startedAt, step.completedAt)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}

          <a data-gc="configuracoes.publicacoes-section.a--5"
            href={run.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-link hover:underline"
          >
            ver no GitHub <ExternalLink data-gc="configuracoes.publicacoes-section.external-link--4" size={11} />
          </a>
        </div>
      )}
    </div>
  );
};

const StateIcon: React.FC<{ state: WorkflowState; size?: number }> = ({ state, size = 16 }) => {
  if (state === "boa") return <Check data-gc="configuracoes.publicacoes-section.check--2" size={size} className="shrink-0 text-online" />;
  if (state === "falhou") return <X data-gc="configuracoes.publicacoes-section.x--2" size={size} className="shrink-0 text-danger" />;
  if (state === "esperando") return <Hourglass data-gc="configuracoes.publicacoes-section.hourglass--2" size={size} className="shrink-0 text-idle" />;
  if (state === "cancelada") return <CircleDashed data-gc="configuracoes.publicacoes-section.circle-dashed" size={size} className="shrink-0 text-ink-faint" />;

  return <Loader2 data-gc="configuracoes.publicacoes-section.loader2" size={size} className="shrink-0 animate-spin text-brand" />;
};
