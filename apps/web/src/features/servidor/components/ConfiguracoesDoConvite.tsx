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

export interface OpcoesDoConvite {
  expiresInHours: number | null;
  maxUses: number | null;
}

const SEM_LIMITE = 0;

const VALIDADES: { value: number; label: string }[] = [
  { value: 0.5, label: "30 minutos" },
  { value: 1, label: "1 hora" },
  { value: 6, label: "6 horas" },
  { value: 12, label: "12 horas" },
  { value: 24, label: "1 dia" },
  { value: 24 * 7, label: "7 dias" },
  { value: 24 * 30, label: "30 dias" },
  { value: SEM_LIMITE, label: "Nunca" },
];

const USOS: { value: number; label: string }[] = [
  { value: SEM_LIMITE, label: "Sem limite" },
  { value: 1, label: "1 uso" },
  { value: 5, label: "5 usos" },
  { value: 10, label: "10 usos" },
  { value: 25, label: "25 usos" },
  { value: 50, label: "50 usos" },
  { value: 100, label: "100 usos" },
];

interface Props {
  atuais: OpcoesDoConvite;
  gerando?: boolean;
  onVoltar: () => void;
  onCriar: (opcoes: OpcoesDoConvite) => void;
}

export const ConfiguracoesDoConvite: React.FC<Props> = ({
  atuais,
  gerando,
  onVoltar,
  onCriar,
}) => {
  const [validade, setValidade] = useState(atuais.expiresInHours ?? SEM_LIMITE);
  const [usos, setUsos] = useState(atuais.maxUses ?? SEM_LIMITE);

  useEffect(() => {
    setValidade(atuais.expiresInHours ?? SEM_LIMITE);
    setUsos(atuais.maxUses ?? SEM_LIMITE);
  }, [atuais.expiresInHours, atuais.maxUses]);

  return (
    <>
      <DialogHeader data-gc="servidor.configuracoes-do-convite.dialog-header">
        <DialogTitle data-gc="servidor.configuracoes-do-convite.dialog-title">Configurações do link de convite</DialogTitle>
      </DialogHeader>

      <DialogBody data-gc="servidor.configuracoes-do-convite.dialog-body" className="cascata min-h-[24rem] space-y-5">
        <div data-gc="servidor.configuracoes-do-convite.div">
          <Label data-gc="servidor.configuracoes-do-convite.label" htmlFor="convite-validade">Expira em</Label>
          <Combobox data-gc="servidor.configuracoes-do-convite.combobox.set-validade"
            id="convite-validade"
            value={validade}
            onSelect={setValidade}
            options={VALIDADES}
            placeholder="Escolha ou digite…"
          />
        </div>

        <div data-gc="servidor.configuracoes-do-convite.div--2">
          <Label data-gc="servidor.configuracoes-do-convite.label--2" htmlFor="convite-usos">Número máximo de usos</Label>
          <Combobox data-gc="servidor.configuracoes-do-convite.combobox.set-usos"
            id="convite-usos"
            value={usos}
            onSelect={setUsos}
            options={USOS}
            placeholder="Escolha ou digite…"
          />
        </div>

        <p data-gc="servidor.configuracoes-do-convite.p" className="text-xs text-ink-faint">
          O link que já está na tela continua funcionando para quem o recebeu.
          Confirmar cria um link novo, com estas opções.
        </p>
      </DialogBody>

      <DialogFooter data-gc="servidor.configuracoes-do-convite.dialog-footer">
        <Button data-gc="servidor.configuracoes-do-convite.button.on-voltar" variant="surface" onClick={onVoltar} disabled={gerando}>
          Cancelar
        </Button>

        <Button data-gc="servidor.configuracoes-do-convite.button"
          onClick={() =>
            onCriar({
              expiresInHours: validade === SEM_LIMITE ? null : validade,
              maxUses: usos === SEM_LIMITE ? null : usos,
            })
          }
          disabled={gerando}
        >
          {gerando ? "Criando…" : "Criar novo link"}
        </Button>
      </DialogFooter>
    </>
  );
};
