import React from "react";
import { useNavigate, useParams } from "react-router";
import { Palette } from "lucide-react";
import { toast } from "react-toastify";

import { themeWeight, weightReadable } from "@gravae/shared";

import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useConfirm } from "~/components/ui/confirm";
import { Skeleton } from "~/components/ui/skeleton";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { useStudio } from "~/features/configuracoes/stores/estudio";
import { ActivePreview } from "~/features/tema/components/PreviaDosAtivos";
import { ThemePreview } from "~/features/tema/components/PreviaDoTema";

export const SeeTheme: React.FC = () => {
  const { themeId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const { data: theme, isLoading, isError } = useTheme(themeId);
  const doImport = useStudio((s) => s.doImport);
  const openSettings = useSettings((s) => s.open);

  const back = () => navigate("/channels", { replace: true });

  if (isLoading)
    return (
      <div data-gc="tema.ver-tema.div" className="flex h-full items-center justify-center bg-surface-0 p-6">
        <Skeleton data-gc="tema.ver-tema.skeleton" className="h-72 w-full max-w-md rounded-xl" />
      </div>
    );

  if (isError || !theme)
    return (
      <div data-gc="tema.ver-tema.div--2" className="flex h-full flex-col items-center justify-center gap-4 bg-surface-0 p-6 text-center">
        <Palette data-gc="tema.ver-tema.palette" size={40} className="text-ink-faint" />
        <div data-gc="tema.ver-tema.div--3">
          <p data-gc="tema.ver-tema.p" className="text-lg font-semibold">Tema indisponível</p>
          <p data-gc="tema.ver-tema.p--2" className="mt-1 text-sm text-ink-muted">
            Quem publicou apagou, ou o link está errado.
          </p>
        </div>

        <Button data-gc="tema.ver-tema.button.back" variant="surface" onClick={back}>
          Voltar para o Gravaê
        </Button>
      </div>
    );

  const hasCss = theme.css.trim().length > 0;
  const countTokens = Object.keys(theme.overrides).length;
  const weight = themeWeight(theme.css, theme.actives);

  return (
    <div data-gc="tema.ver-tema.div--4" className="flex h-full items-center justify-center overflow-y-auto bg-surface-0 p-6">
      <article data-gc="tema.ver-tema.article" className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-6">
        <div data-gc="tema.ver-tema.div--5" className="flex items-center gap-3">
          <span data-gc="tema.ver-tema.span" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca">
            <Palette data-gc="tema.ver-tema.palette--2" size={24} />
          </span>

          <div data-gc="tema.ver-tema.div--6" className="min-w-0 flex-1">
            <h1 data-gc="tema.ver-tema.h1" className="truncate text-lg font-semibold">{theme.name}</h1>
            <p data-gc="tema.ver-tema.p--3" className="truncate text-xs text-ink-faint">
              Compartilhado por {theme.publishedBy.displayName}
              {theme.author && theme.author !== theme.publishedBy.displayName
                ? ` · escrito por ${theme.author}`
                : ""}
              {theme.version ? ` · v${theme.version}` : ""}
            </p>
          </div>
        </div>

        {theme.description && <p data-gc="tema.ver-tema.p--4" className="mt-4 text-sm text-ink-muted">{theme.description}</p>}

        {theme.tags.length > 0 && (
          <div data-gc="tema.ver-tema.div--7" className="mt-4 flex flex-wrap gap-1.5">
            {theme.tags.map((tag) => (
              <span data-gc="tema.ver-tema.span--2"
                key={tag}
                className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <ThemePreview data-gc="tema.ver-tema.theme-preview"
          themeId={theme.id}
          className="mt-5 aspect-video w-full overflow-hidden rounded-lg border border-line"
        />

        <dl data-gc="tema.ver-tema.dl" className="mt-5 flex gap-6 border-t border-line pt-4 text-xs">
          <div data-gc="tema.ver-tema.div--8">
            <dt data-gc="tema.ver-tema.dt" className="text-ink-faint">Cores trocadas</dt>
            <dd data-gc="tema.ver-tema.dd" className="mt-0.5 text-sm font-medium">{countTokens}</dd>
          </div>
          <div data-gc="tema.ver-tema.div--9">
            <dt data-gc="tema.ver-tema.dt--2" className="text-ink-faint">CSS</dt>
            <dd data-gc="tema.ver-tema.dd--2" className="mt-0.5 text-sm font-medium">
              {hasCss ? `${Math.ceil(theme.css.length / 1024)} KB` : "nenhum"}
            </dd>
          </div>
          <div data-gc="tema.ver-tema.div--10">
            <dt data-gc="tema.ver-tema.dt--3" className="text-ink-faint">Tudo junto</dt>
            <dd data-gc="tema.ver-tema.dd--3" className="mt-0.5 text-sm font-medium">{weightReadable(weight)}</dd>
          </div>
        </dl>

        <ActivePreview data-gc="tema.ver-tema.active-preview" actives={theme.actives} weight={weight} />

        {hasCss && (
          <p data-gc="tema.ver-tema.p--5" className="mt-4 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-xs text-ink-muted">
            Este tema traz CSS de quem escreveu, e CSS mexe em qualquer canto da
            tela. Só importe de gente em quem você confia.
          </p>
        )}

        <div data-gc="tema.ver-tema.div--11" className="mt-5 flex gap-2">
          <Button data-gc="tema.ver-tema.button.back--2" variant="ghost" className="flex-1" onClick={back}>
            Agora não
          </Button>

          <Button data-gc="tema.ver-tema.button"
            className="flex-1"
            onClick={() =>
              void confirm({
                title: `Importar ${theme.name}?`,
                description:
                  "O tema que você tem hoje no estúdio é substituído por este. Dá para voltar atrás pelo próprio estúdio.",
                action: "Importar",
              }).then(({ confirmed }) => {
                if (!confirmed) return;

                doImport({
                  css: theme.css,
                  overrides: theme.overrides,
                  actives: theme.actives,
                  name: theme.name,
                  originId: theme.id,
                });
                toast.success(`${theme.name} aplicado.`);
                navigate("/channels", { replace: true });
                openSettings("appearance", "tema");
              })
            }
          >
            Importar tema
          </Button>
        </div>
      </article>
    </div>
  );
};
