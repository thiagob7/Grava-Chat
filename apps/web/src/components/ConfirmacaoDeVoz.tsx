import React from "react";

import { Button } from "~/components/ui/button";
import { useTranslation } from "~/traducao";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface Props {
  canal: string | null;
  onFechar: () => void;
  onTrazerParaCa: () => void;
}

/*
  {t("chamada.jaConectado.titulo")}, em outro lugar. E agora?

  Antes o clique no canal simplesmente NÃO FAZIA NADA nesse caso — a única
  pista era uma caixinha no rodapé da barra lateral, que competia por atenção
  com tudo o mais que mora ali. Quem não reparava clicava de novo, e de novo, e
  concluía que o app tinha travado.

  Perguntar no meio da tela resolve as duas pontas: o clique passa a ter
  resposta, e o rodapé volta a ser só o cartão de quem você é.

  Duas saídas, e não três: o estado de voz no Redis é UM por conta, então
  "entrar mantendo as outras conexões" não existe aqui. Oferecer um botão que
  o servidor não sustenta seria inventar um recurso na tela.
*/
export const ConfirmacaoDeVoz: React.FC<Props> = ({ canal, onFechar, onTrazerParaCa }) => {
  const { t } = useTranslation();

  return (
  <Dialog open={Boolean(canal)} onOpenChange={(v) => !v && onFechar()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t("chamada.jaConectado.titulo")}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <p className="text-sm leading-relaxed text-ink-muted">
          Sua conta está conectada em {canal ? <b className="text-ink">{canal}</b> : "outro canal"}{" "}
          por outro aparelho ou outra aba — e o áudio está tocando lá.
        </p>

        <div className="mt-5 space-y-2">
          <Button className="w-full" onClick={onTrazerParaCa}>
            {t("chamada.jaConectado.trazer")}
          </Button>

          <Button variant="surface" className="w-full" onClick={onFechar}>
            {t("chamada.jaConectado.deixar")}
          </Button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Trazendo para cá, a outra ponta sai da chamada — sua conta fica em um
          lugar de cada vez.
        </p>
      </DialogBody>
    </DialogContent>
  </Dialog>
  );
};
