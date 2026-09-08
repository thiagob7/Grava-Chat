import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { Message } from "@gravae/shared";

import { useDenunciarMensagem } from "~/@core/application/queries/message/use-denunciar-mensagem";
import { MOTIVOS_DE_DENUNCIA, type MotivoDeDenuncia } from "~/@core/application/requests/guild/denunciar-guild";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label, Textarea } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";

const TRECHO = 300;

/*
  Denunciar uma mensagem.

  Mostra de volta o que está sendo denunciado — quem abre o menu no lugar
  errado percebe antes de enviar. O texto aparece cortado no mesmo tamanho que
  o servidor guarda, para não prometer mais do que vai chegar lá.
*/
export const DenunciarMensagem: React.FC<{
  mensagem: Message;
  aberto: boolean;
  onFechar: () => void;
}> = ({ mensagem, aberto, onFechar }) => {
  const { t } = useTranslation();
  const denunciar = useDenunciarMensagem();
  const [motivo, setMotivo] = useState<MotivoDeDenuncia>("spam");
  const [detalhes, setDetalhes] = useState("");

  const trecho = mensagem.content.slice(0, TRECHO);

  return (
    <Dialog data-gc="conversa.denunciar-mensagem.dialog" open={aberto} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent data-gc="conversa.denunciar-mensagem.dialog-content" className="max-w-md">
        <DialogHeader data-gc="conversa.denunciar-mensagem.dialog-header">
          <DialogTitle data-gc="conversa.denunciar-mensagem.dialog-title">{t("conversa.denuncia.titulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.denunciar-mensagem.dialog-body" className="space-y-4">
          <p data-gc="conversa.denunciar-mensagem.p" className="text-sm text-ink-muted">{t("conversa.denuncia.descricao")}</p>

          <div data-gc="conversa.denunciar-mensagem.div" className="rounded-md border border-line bg-surface-1 p-3">
            <p data-gc="conversa.denunciar-mensagem.p--2" className="text-xs font-semibold text-ink-muted">
              {t("conversa.denuncia.de", { nome: mensagem.author.username })}
            </p>
            <p data-gc="conversa.denunciar-mensagem.p--3" className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
              {trecho || t("conversa.denuncia.semTexto")}
            </p>
          </div>

          <div data-gc="conversa.denunciar-mensagem.div--2">
            <Label data-gc="conversa.denunciar-mensagem.label" htmlFor="motivo-da-denuncia-da-mensagem">{t("conversa.denuncia.motivo")}</Label>
            <CampoSelect data-gc="conversa.denunciar-mensagem.campo-select"
              id="motivo-da-denuncia-da-mensagem"
              valor={motivo}
              onEscolher={(valor) => setMotivo(valor as MotivoDeDenuncia)}
              opcoes={MOTIVOS_DE_DENUNCIA.map((m) => ({ valor: m, rotulo: t(`conversa.denuncia.motivos.${m}`) }))}
            />
          </div>

          <div data-gc="conversa.denunciar-mensagem.div--3">
            <Label data-gc="conversa.denunciar-mensagem.label--2" htmlFor="detalhes-da-denuncia-da-mensagem">{t("conversa.denuncia.detalhes")}</Label>
            <Textarea data-gc="conversa.denunciar-mensagem.textarea"
              id="detalhes-da-denuncia-da-mensagem"
              value={detalhes}
              maxLength={1000}
              rows={4}
              onChange={(e) => setDetalhes(e.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.denunciar-mensagem.dialog-footer">
          <Button data-gc="conversa.denunciar-mensagem.button.on-fechar" variant="surface" onClick={onFechar}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="conversa.denunciar-mensagem.button"
            disabled={denunciar.isPending}
            onClick={() =>
              denunciar.mutate(
                { messageId: mensagem.id, motivo, detalhes: detalhes.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success(t("conversa.denuncia.enviada"));
                    setDetalhes("");
                    onFechar();
                  },
                },
              )
            }
          >
            {t("conversa.denuncia.enviar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
