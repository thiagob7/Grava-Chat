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
      <div data-gc="tema.cartao-de-tema.div" className="mt-1 h-[6.5rem] w-72 animate-pulse rounded-lg border border-line bg-surface-2" />
    );

  if (isError || !tema)
    return (
      <div data-gc="tema.cartao-de-tema.div--2" className="mt-1 w-72 rounded-lg border border-line bg-surface-2 p-3">
        <p data-gc="tema.cartao-de-tema.p" className="text-sm font-medium text-ink-muted">Tema indisponível</p>
        <p data-gc="tema.cartao-de-tema.p--2" className="mt-0.5 text-xs text-ink-faint">
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
    <article data-gc="tema.cartao-de-tema.article" className="mt-1 w-72 overflow-hidden rounded-lg border border-line bg-surface-2">
      <div data-gc="tema.cartao-de-tema.div--3" className="flex items-center gap-3 p-3">
        <span data-gc="tema.cartao-de-tema.span" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Palette data-gc="tema.cartao-de-tema.palette" size={20} />
        </span>

        <div data-gc="tema.cartao-de-tema.div--4" className="min-w-0 flex-1">
          <p data-gc="tema.cartao-de-tema.p--3" className="truncate text-sm font-semibold">{tema.nome}</p>
          <p data-gc="tema.cartao-de-tema.p--4" className="truncate text-xs text-ink-faint">{resumo}</p>
        </div>
      </div>

      {(tema.descricao || tema.autor || tema.versao) && (
        <div data-gc="tema.cartao-de-tema.div--5" className="px-3 pb-2">
          {tema.descricao && (
            <p data-gc="tema.cartao-de-tema.p--5" className="line-clamp-2 text-xs text-ink-muted">{tema.descricao}</p>
          )}

          {(tema.autor || tema.versao) && (
            <p data-gc="tema.cartao-de-tema.p--6" className="mt-1 truncate text-xs text-ink-faint">
              {[tema.autor && `por ${tema.autor}`, tema.versao && `v${tema.versao}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      <div data-gc="tema.cartao-de-tema.div--6" className="p-3 pt-1">
        <Button data-gc="tema.cartao-de-tema.button"
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
