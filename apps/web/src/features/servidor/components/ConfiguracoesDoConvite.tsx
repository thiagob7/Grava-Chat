import React, { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/input";
import { Combobox } from "~/components/ui/combobox";

export interface InviteOptions {
  expiresInHours: number | null;
  maxUses: number | null;
}

const WITHOUT_LIMIT = 0;

const VALIDITIES: { value: number; label: string }[] = [
  { value: 0.5, label: "30 minutos" },
  { value: 1, label: "1 hora" },
  { value: 6, label: "6 horas" },
  { value: 12, label: "12 horas" },
  { value: 24, label: "1 dia" },
  { value: 24 * 7, label: "7 dias" },
  { value: 24 * 30, label: "30 dias" },
  { value: WITHOUT_LIMIT, label: "Nunca" },
];

const USES: { value: number; label: string }[] = [
  { value: WITHOUT_LIMIT, label: "Sem limite" },
  { value: 1, label: "1 uso" },
  { value: 5, label: "5 usos" },
  { value: 10, label: "10 usos" },
  { value: 25, label: "25 usos" },
  { value: 50, label: "50 usos" },
  { value: 100, label: "100 usos" },
];

interface Props {
  current: InviteOptions;
  generating?: boolean;
  onBack: () => void;
  onCreate: (options: InviteOptions) => void;
}

export const InviteSettings: React.FC<Props> = ({
  current,
  generating,
  onBack,
  onCreate,
}) => {
  const [validity, setValidity] = useState(current.expiresInHours ?? WITHOUT_LIMIT);
  const [uses, setUses] = useState(current.maxUses ?? WITHOUT_LIMIT);

  useEffect(() => {
    setValidity(current.expiresInHours ?? WITHOUT_LIMIT);
    setUses(current.maxUses ?? WITHOUT_LIMIT);
  }, [current.expiresInHours, current.maxUses]);

  return (
    <>
      <DialogHeader data-gc="servidor.configuracoes-do-convite.dialog-header">
        <DialogTitle data-gc="servidor.configuracoes-do-convite.dialog-title">Configurações do link de convite</DialogTitle>
      </DialogHeader>

      <DialogBody data-gc="servidor.configuracoes-do-convite.dialog-body" className="cascata min-h-[24rem] space-y-5">
        <div data-gc="servidor.configuracoes-do-convite.div">
          <Label data-gc="servidor.configuracoes-do-convite.label" htmlFor="convite-validade">Expira em</Label>
          <Combobox data-gc="servidor.configuracoes-do-convite.combobox.set-validity"
            id="convite-validade"
            value={validity}
            onSelect={setValidity}
            options={VALIDITIES}
            placeholder="Escolha ou digite…"
          />
        </div>

        <div data-gc="servidor.configuracoes-do-convite.div--2">
          <Label data-gc="servidor.configuracoes-do-convite.label--2" htmlFor="convite-usos">Número máximo de usos</Label>
          <Combobox data-gc="servidor.configuracoes-do-convite.combobox.set-uses"
            id="convite-usos"
            value={uses}
            onSelect={setUses}
            options={USES}
            placeholder="Escolha ou digite…"
          />
        </div>

        <p data-gc="servidor.configuracoes-do-convite.p" className="text-xs text-ink-faint">
          O link que já está na tela continua funcionando para quem o recebeu.
          Confirmar cria um link novo, com estas opções.
        </p>
      </DialogBody>

      <DialogFooter data-gc="servidor.configuracoes-do-convite.dialog-footer">
        <Button data-gc="servidor.configuracoes-do-convite.button.on-back" variant="surface" onClick={onBack} disabled={generating}>
          Cancelar
        </Button>

        <Button data-gc="servidor.configuracoes-do-convite.button"
          onClick={() =>
            onCreate({
              expiresInHours: validity === WITHOUT_LIMIT ? null : validity,
              maxUses: uses === WITHOUT_LIMIT ? null : uses,
            })
          }
          disabled={generating}
        >
          {generating ? "Criando…" : "Criar novo link"}
        </Button>
      </DialogFooter>
    </>
  );
};
