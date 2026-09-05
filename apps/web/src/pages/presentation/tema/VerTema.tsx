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
      <div className="flex h-full items-center justify-center bg-surface-0 p-6">
        <Skeleton className="h-72 w-full max-w-md rounded-xl" />
      </div>
    );

  if (isError || !tema)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-surface-0 p-6 text-center">
        <Palette size={40} className="text-ink-faint" />
        <div>
          <p className="text-lg font-semibold">Tema indisponível</p>
          <p className="mt-1 text-sm text-ink-muted">
            Quem publicou apagou, ou o link está errado.
          </p>
        </div>

        <Button variant="surface" onClick={voltar}>
          Voltar para o Gravaê
        </Button>
      </div>
    );

  const temCss = tema.css.trim().length > 0;
  const quantosTokens = Object.keys(tema.substituicoes).length;

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-surface-0 p-6">
      <article className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Palette size={24} />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{tema.nome}</h1>
            <p className="truncate text-xs text-ink-faint">
              Compartilhado por {tema.publicadoPor.displayName}
              {tema.autor && tema.autor !== tema.publicadoPor.displayName
                ? ` · escrito por ${tema.autor}`
                : ""}
              {tema.versao ? ` · v${tema.versao}` : ""}
            </p>
          </div>
        </div>

        {tema.descricao && <p className="mt-4 text-sm text-ink-muted">{tema.descricao}</p>}

        {tema.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tema.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <dl className="mt-5 flex gap-6 border-t border-line pt-4 text-xs">
          <div>
            <dt className="text-ink-faint">Cores trocadas</dt>
            <dd className="mt-0.5 text-sm font-medium">{quantosTokens}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">CSS</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {temCss ? `${Math.ceil(tema.css.length / 1024)} KB` : "nenhum"}
            </dd>
          </div>
        </dl>

        {temCss && (
          <p className="mt-4 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-xs text-ink-muted">
            Este tema traz CSS de quem escreveu, e CSS mexe em qualquer canto da
            tela. Só importe de gente em quem você confia.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={voltar}>
            Agora não
          </Button>

          <Button
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
