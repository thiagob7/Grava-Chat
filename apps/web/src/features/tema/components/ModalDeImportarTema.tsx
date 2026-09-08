import React from "react";
import { toast } from "react-toastify";

import { useTema } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { useEstudio } from "~/features/configuracoes/stores/estudio";
import { useImportarTema } from "~/features/tema/stores/importar-tema";

/*
  Importar um tema compartilhado, sem sair de onde se está.

  Antes o link abria uma página — e, no aplicativo, uma segunda janela do
  Gravaê. Agora tanto o link quanto o botão do cartão abrem isto, com o CSS
  à mostra: quem vai aplicar precisa poder ler o que está aplicando.
*/
export const ModalDeImportarTema: React.FC = () => {
  const temaId = useImportarTema((s) => s.temaId);
  const fechar = useImportarTema((s) => s.fechar);
  const importar = useEstudio((s) => s.importar);
  const abrirConfiguracoes = useConfiguracoes((s) => s.abrir);

  const { data: tema, isLoading, isError } = useTema(temaId ?? undefined);

  const aplicar = () => {
    if (!tema) return;

    importar({ css: tema.css, substituicoes: tema.substituicoes, nome: tema.nome });
    abrirConfiguracoes("aparencia", "tema");
    toast.success(`${tema.nome} aplicado. Está no estúdio de temas.`);
    fechar();
  };

  const quantosTokens = tema ? Object.keys(tema.substituicoes).length : 0;

  return (
    <Dialog data-gc="tema.modal-de-importar-tema.dialog" open={temaId !== null} onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent data-gc="tema.modal-de-importar-tema.dialog-content" className="max-w-xl">
        <DialogHeader data-gc="tema.modal-de-importar-tema.dialog-header">
          <DialogTitle data-gc="tema.modal-de-importar-tema.dialog-title">Importar tema</DialogTitle>
          <DialogDescription data-gc="tema.modal-de-importar-tema.dialog-description">
            Isso substitui o tema que você tem agora. Dá para editar depois em Configurações
            {" > "}Aparência{" > "}Estúdio de temas.
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="tema.modal-de-importar-tema.dialog-body" className="space-y-3">
          {isLoading && <Skeleton data-gc="tema.modal-de-importar-tema.skeleton" className="h-64 w-full rounded-lg" />}

          {isError && (
            <p data-gc="tema.modal-de-importar-tema.p" className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
              Tema indisponível. Quem publicou apagou, ou o link está errado.
            </p>
          )}

          {tema && (
            <>
              <p data-gc="tema.modal-de-importar-tema.p--2" className="text-sm">
                <span data-gc="tema.modal-de-importar-tema.span" className="font-semibold">{tema.nome}</span>
                {(tema.autor || tema.versao) && (
                  <span data-gc="tema.modal-de-importar-tema.span--2" className="text-ink-faint">
                    {" · "}
                    {[tema.autor && `por ${tema.autor}`, tema.versao && `v${tema.versao}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </p>

              {quantosTokens > 0 && (
                <p data-gc="tema.modal-de-importar-tema.p--3" className="text-xs text-ink-faint">
                  {quantosTokens} {quantosTokens === 1 ? "cor trocada" : "cores trocadas"}
                </p>
              )}

              {tema.css.trim() ? (
                <>
                  <pre data-gc="tema.modal-de-importar-tema.pre" className="max-h-72 overflow-auto rounded-lg border border-line bg-surface-0 p-4 font-mono text-13 leading-relaxed text-ink">
                    {tema.css}
                  </pre>

                  <p data-gc="tema.modal-de-importar-tema.p--4" className="text-xs text-aviso">
                    Este tema traz CSS de quem escreveu, e CSS mexe em qualquer canto da tela. Só
                    importe de gente em quem você confia.
                  </p>
                </>
              ) : (
                <p data-gc="tema.modal-de-importar-tema.p--5" className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
                  Este tema só troca cores. Nada de CSS de fora.
                </p>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter data-gc="tema.modal-de-importar-tema.dialog-footer">
          <Button data-gc="tema.modal-de-importar-tema.button.fechar" variant="surface" onClick={fechar}>
            Cancelar
          </Button>
          <Button data-gc="tema.modal-de-importar-tema.button.aplicar" disabled={!tema} onClick={aplicar}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
