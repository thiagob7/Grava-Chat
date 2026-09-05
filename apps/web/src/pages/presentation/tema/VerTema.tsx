import React from "react";
import { useNavigate, useParams } from "react-router";
import { Palette } from "lucide-react";
import { toast } from "react-toastify";

import { useTema } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { useEstudio } from "~/features/configuracoes/stores/estudio";

export const VerTema: React.FC = () => {
  const { temaId } = useParams();
  const navigate = useNavigate();
  const confirmar = useConfirmar();

  const { data: tema, isLoading, isError } = useTema(temaId);
  const importar = useEstudio((s) => s.importar);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

  const voltar = () => navigate("/channels", { replace: true });

  if (isLoading)
    return (
      <div data-gc="tema.ver-tema.div" className="flex h-full items-center justify-center bg-surface-0 p-6">
        <Skeleton data-gc="tema.ver-tema.skeleton" className="h-72 w-full max-w-md rounded-xl" />
      </div>
    );

  if (isError || !tema)
    return (
      <div data-gc="tema.ver-tema.div--2" className="flex h-full flex-col items-center justify-center gap-4 bg-surface-0 p-6 text-center">
        <Palette data-gc="tema.ver-tema.palette" size={40} className="text-ink-faint" />
        <div data-gc="tema.ver-tema.div--3">
          <p data-gc="tema.ver-tema.p" className="text-lg font-semibold">Tema indisponível</p>
          <p data-gc="tema.ver-tema.p--2" className="mt-1 text-sm text-ink-muted">
            Quem publicou apagou, ou o link está errado.
          </p>
        </div>

        <Button data-gc="tema.ver-tema.button.voltar" variant="surface" onClick={voltar}>
          Voltar para o Gravaê
        </Button>
      </div>
    );

  const temCss = tema.css.trim().length > 0;
  const quantosTokens = Object.keys(tema.substituicoes).length;

  return (
    <div data-gc="tema.ver-tema.div--4" className="flex h-full items-center justify-center overflow-y-auto bg-surface-0 p-6">
      <article data-gc="tema.ver-tema.article" className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-6">
        <div data-gc="tema.ver-tema.div--5" className="flex items-center gap-3">
          <span data-gc="tema.ver-tema.span" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Palette data-gc="tema.ver-tema.palette--2" size={24} />
          </span>

          <div data-gc="tema.ver-tema.div--6" className="min-w-0 flex-1">
            <h1 data-gc="tema.ver-tema.h1" className="truncate text-lg font-semibold">{tema.nome}</h1>
            <p data-gc="tema.ver-tema.p--3" className="truncate text-xs text-ink-faint">
              Compartilhado por {tema.publicadoPor.displayName}
              {tema.autor && tema.autor !== tema.publicadoPor.displayName
                ? ` · escrito por ${tema.autor}`
                : ""}
              {tema.versao ? ` · v${tema.versao}` : ""}
            </p>
          </div>
        </div>

        {tema.descricao && <p data-gc="tema.ver-tema.p--4" className="mt-4 text-sm text-ink-muted">{tema.descricao}</p>}

        {tema.tags.length > 0 && (
          <div data-gc="tema.ver-tema.div--7" className="mt-4 flex flex-wrap gap-1.5">
            {tema.tags.map((tag) => (
              <span data-gc="tema.ver-tema.span--2"
                key={tag}
                className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <dl data-gc="tema.ver-tema.dl" className="mt-5 flex gap-6 border-t border-line pt-4 text-xs">
          <div data-gc="tema.ver-tema.div--8">
            <dt data-gc="tema.ver-tema.dt" className="text-ink-faint">Cores trocadas</dt>
            <dd data-gc="tema.ver-tema.dd" className="mt-0.5 text-sm font-medium">{quantosTokens}</dd>
          </div>
          <div data-gc="tema.ver-tema.div--9">
            <dt data-gc="tema.ver-tema.dt--2" className="text-ink-faint">CSS</dt>
            <dd data-gc="tema.ver-tema.dd--2" className="mt-0.5 text-sm font-medium">
              {temCss ? `${Math.ceil(tema.css.length / 1024)} KB` : "nenhum"}
            </dd>
          </div>
        </dl>

        {temCss && (
          <p data-gc="tema.ver-tema.p--5" className="mt-4 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-xs text-ink-muted">
            Este tema traz CSS de quem escreveu, e CSS mexe em qualquer canto da
            tela. Só importe de gente em quem você confia.
          </p>
        )}

        <div data-gc="tema.ver-tema.div--10" className="mt-5 flex gap-2">
          <Button data-gc="tema.ver-tema.button.voltar--2" variant="ghost" className="flex-1" onClick={voltar}>
            Agora não
          </Button>

          <Button data-gc="tema.ver-tema.button"
            className="flex-1"
            onClick={() =>
              void confirmar({
                titulo: `Importar ${tema.nome}?`,
                descricao:
                  "O tema que você tem hoje no estúdio é substituído por este. Dá para voltar atrás pelo próprio estúdio.",
                acao: "Importar",
              }).then(({ confirmado }) => {
                if (!confirmado) return;

                importar({
                  css: tema.css,
                  substituicoes: tema.substituicoes,
                  nome: tema.nome,
                });
                toast.success(`${tema.nome} aplicado.`);
                navigate("/channels", { replace: true });
                abrirConfiguracoes("aparencia", "tema");
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
