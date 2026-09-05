import React from "react";
import { Palette } from "lucide-react";

import { useTema } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useConfirmar } from "~/components/ui/confirm";
import { useEstudio } from "~/features/configuracoes/stores/estudio";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { toast } from "react-toastify";

export const CartaoDeTema: React.FC<{ temaId: string }> = ({ temaId }) => {
  const { data: tema, isLoading, isError } = useTema(temaId);
  const importar = useEstudio((s) => s.importar);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);
  const confirmar = useConfirmar();

  if (isLoading)
    return (
      <div className="mt-1 h-[6.5rem] w-72 animate-pulse rounded-lg border border-line bg-surface-2" />
    );

  if (isError || !tema)
    return (
      <div className="mt-1 w-72 rounded-lg border border-line bg-surface-2 p-3">
        <p className="text-sm font-medium text-ink-muted">Tema indisponível</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          Quem publicou apagou, ou o link está errado.
        </p>
      </div>
    );

  const temCss = tema.css.trim().length > 0;
  const quantosTokens = Object.keys(tema.substituicoes).length;

  const resumo = [
    temCss && "Você tem CSS!",
    quantosTokens > 0 && `${quantosTokens} ${quantosTokens === 1 ? "cor" : "cores"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="mt-1 w-72 overflow-hidden rounded-lg border border-line bg-surface-2">
      <div className="flex items-center gap-3 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Palette size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{tema.nome}</p>
          <p className="truncate text-xs text-ink-faint">{resumo}</p>
        </div>
      </div>

      {(tema.descricao || tema.autor || tema.versao) && (
        <div className="px-3 pb-2">
          {tema.descricao && (
            <p className="line-clamp-2 text-xs text-ink-muted">{tema.descricao}</p>
          )}

          {(tema.autor || tema.versao) && (
            <p className="mt-1 truncate text-xs text-ink-faint">
              {[tema.autor && `por ${tema.autor}`, tema.versao && `v${tema.versao}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      <div className="p-3 pt-1">
        <Button
          size="sm"
          className="w-full"
          onClick={() =>
            void confirmar({
              titulo: `Importar ${tema.nome}?`,
              descricao: temCss
                ? "O tema que você tem hoje no estúdio é substituído por este. Um tema traz CSS de quem escreveu, que pode mexer em qualquer canto da tela — só importe de gente em quem você confia."
                : "As cores que você tem hoje no estúdio são substituídas por estas.",
              acao: "Importar",
            }).then(({ confirmado }) => {
              if (!confirmado) return;

              importar({ css: tema.css, substituicoes: tema.substituicoes, nome: tema.nome });
              abrirConfiguracoes("aparencia", "tema");
              toast.success(`${tema.nome} aplicado. Está no estúdio de temas.`);
            })
          }
        >
          Importar tema
        </Button>
      </div>
    </article>
  );
};
