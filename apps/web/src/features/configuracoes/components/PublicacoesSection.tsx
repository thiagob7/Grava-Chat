import React from "react";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  ExternalLink,
  GitBranch,
  Hourglass,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import {
  useBranchDoGit,
  usePostsHistory,
  usePosts,
} from "~/@core/application/queries/admin/use-publicacoes";
import {
  delay,
  writeSince,
  WAITING_APPROVAL,
  API_FLOW,
  REPOSITORY,
  type Post,
} from "~/features/configuracoes/lib/publicacoes";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const PostsSection: React.FC = () => {
  const lines = usePosts(true);
  const dev = useBranchDoGit("dev", true);
  const past = usePostsHistory(true);

  const waiting = (past.data ?? []).filter(WAITING_APPROVAL);

  return (
    <div data-gc="configuracoes.publicacoes-section.div" className="max-w-2xl pb-10">
      <Section data-gc="configuracoes.publicacoes-section.section" id="publicacoes" title="Publicações">
        <p data-gc="configuracoes.publicacoes-section.p" className="mb-4 text-sm text-ink-muted">
          O que está rodando em cada máquina agora, e se bate com o que está no repositório.
        </p>

        <div data-gc="configuracoes.publicacoes-section.div--2" className="space-y-3">
          {lines.map(({ environment, api, branch }) => {
            const situation = delay(api.data?.commit ?? null, branch.data?.sha ?? null);

            return (
              <article data-gc="configuracoes.publicacoes-section.article" key={environment.id} className="rounded-lg bg-surface-2 p-4">
                <header data-gc="configuracoes.publicacoes-section.header" className="flex items-center gap-2">
                  <span data-gc="configuracoes.publicacoes-section.span"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      api.isError ? "bg-danger" : api.isPending ? "bg-idle" : "bg-online",
                    )}
                  />
                  <h3 data-gc="configuracoes.publicacoes-section.h3" className="text-sm font-semibold">{environment.name}</h3>

                  <a data-gc="configuracoes.publicacoes-section.a"
                    href={environment.front}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-link hover:underline"
                  >
                    abrir <ExternalLink data-gc="configuracoes.publicacoes-section.external-link" size={11} />
                  </a>

                  <span data-gc="configuracoes.publicacoes-section.span--2" className="ml-auto flex items-center gap-1 text-xs text-ink-faint">
                    <GitBranch data-gc="configuracoes.publicacoes-section.git-branch" size={12} /> {environment.branch}
                  </span>
                </header>

                {api.isPending ? (
                  <Skeleton data-gc="configuracoes.publicacoes-section.skeleton" className="mt-3 h-12 rounded" />
                ) : api.isError ? (
                  <p data-gc="configuracoes.publicacoes-section.p--2" className="mt-2 text-sm text-danger">
                    A API não respondeu. {String(api.error).replace("Error: ", "")}
                  </p>
                ) : (
                  <dl data-gc="configuracoes.publicacoes-section.dl" className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    <dt data-gc="configuracoes.publicacoes-section.dt" className="text-ink-faint">Rodando</dt>
                    <dd data-gc="configuracoes.publicacoes-section.dd" className="font-mono text-ink">
                      {api.data?.commit ?? "sem versão"}
                      {api.data?.branch && (
                        <span data-gc="configuracoes.publicacoes-section.span--3" className="ml-2 font-sans text-xs text-ink-faint">
                          de {api.data.branch}
                        </span>
                      )}
                    </dd>

                    <dt data-gc="configuracoes.publicacoes-section.dt--2" className="text-ink-faint">Publicado</dt>
                    <dd data-gc="configuracoes.publicacoes-section.dd--2" className="text-ink-muted">
                      {api.data?.builtAt ? when.format(new Date(api.data.builtAt)) : "—"}
                      <span data-gc="configuracoes.publicacoes-section.span--4" className="ml-2 text-xs text-ink-faint">
                        de pé há {writeSince(api.data?.sinceSeconds ?? null)}
                      </span>
                    </dd>

                    <dt data-gc="configuracoes.publicacoes-section.dt--3" className="text-ink-faint">No git</dt>
                    <dd data-gc="configuracoes.publicacoes-section.dd--3" className="min-w-0">
                      {branch.isPending ? (
                        <span data-gc="configuracoes.publicacoes-section.span--5" className="text-ink-faint">consultando…</span>
                      ) : branch.isError ? (
                        <span data-gc="configuracoes.publicacoes-section.span--6" className="text-ink-faint">GitHub não respondeu</span>
                      ) : (
                        <>
                          <span data-gc="configuracoes.publicacoes-section.span--7" className="font-mono">{branch.data?.sha.slice(0, 7)}</span>
                          <span data-gc="configuracoes.publicacoes-section.span--8" className="ml-2 text-xs text-ink-muted">{branch.data?.message}</span>
                        </>
                      )}
                    </dd>
                  </dl>
                )}

                {situation !== "desconhecido" && (
                  <p data-gc="configuracoes.publicacoes-section.p--3"
                    className={cn(
                      "mt-3 flex items-center gap-1.5 text-xs",
                      situation === "igual" ? "text-online" : "text-idle",
                    )}
                  >
                    {situation === "igual" ? (
                      <>
                        <Check data-gc="configuracoes.publicacoes-section.check" size={13} /> A máquina está com o mesmo commit da branch.
                      </>
                    ) : (
                      <>
                        <AlertTriangle data-gc="configuracoes.publicacoes-section.alert-triangle" size={13} /> A branch avançou e a máquina não foi
                        republicada.
                      </>
                    )}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <div data-gc="configuracoes.publicacoes-section.div--3" className="mt-4 rounded-lg bg-surface-2 p-4">
          <h3 data-gc="configuracoes.publicacoes-section.h3--2" className="flex items-center gap-1.5 text-sm font-semibold">
            <GitBranch data-gc="configuracoes.publicacoes-section.git-branch--2" size={13} /> dev
          </h3>

          <p data-gc="configuracoes.publicacoes-section.p--4" className="mt-1 text-sm text-ink-muted">
            {dev.isPending ? (
              "consultando…"
            ) : dev.isError ? (
              "GitHub não respondeu"
            ) : (
              <>
                <span data-gc="configuracoes.publicacoes-section.span--9" className="font-mono text-ink">{dev.data?.sha.slice(0, 7)}</span>{" "}
                {dev.data?.message}
              </>
            )}
          </p>

          <a data-gc="configuracoes.publicacoes-section.a--2"
            href={`https://github.com/${REPOSITORY}/compare/master...dev`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-link hover:underline"
          >
            ver o que a dev tem a mais que o master <ExternalLink data-gc="configuracoes.publicacoes-section.external-link--2" size={11} />
          </a>
        </div>

        <p data-gc="configuracoes.publicacoes-section.p--5" className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
          <RefreshCw data-gc="configuracoes.publicacoes-section.refresh-cw" size={11} /> As máquinas são consultadas a cada 30 segundos.
        </p>
      </Section>
    </div>
  );
};

const Brand: React.FC<{ situation: Post["situation"] }> = ({ situation }) => {
  if (situation === "boa") return <Check data-gc="configuracoes.publicacoes-section.check--2" size={14} className="shrink-0 text-online" />;
  if (situation === "falhou") return <X data-gc="configuracoes.publicacoes-section.x" size={14} className="shrink-0 text-danger" />;
  if (situation === "esperando") return <Hourglass data-gc="configuracoes.publicacoes-section.hourglass" size={14} className="shrink-0 text-idle" />;
  if (situation === "cancelada")
    return <CircleDashed data-gc="configuracoes.publicacoes-section.circle-dashed" size={14} className="shrink-0 text-ink-faint" />;

  return <Loader2 data-gc="configuracoes.publicacoes-section.loader2" size={14} className="shrink-0 animate-spin text-ink-muted" />;
};
