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

const VALIDADES: { valor: number; rotulo: string }[] = [
  { valor: 0.5, rotulo: "30 minutos" },
  { valor: 1, rotulo: "1 hora" },
  { valor: 6, rotulo: "6 horas" },
  { valor: 12, rotulo: "12 horas" },
  { valor: 24, rotulo: "1 dia" },
  { valor: 24 * 7, rotulo: "7 dias" },
  { valor: 24 * 30, rotulo: "30 dias" },
  { valor: SEM_LIMITE, rotulo: "Nunca" },
];

const USOS: { valor: number; rotulo: string }[] = [
  { valor: SEM_LIMITE, rotulo: "Sem limite" },
  { valor: 1, rotulo: "1 uso" },
  { valor: 5, rotulo: "5 usos" },
  { valor: 10, rotulo: "10 usos" },
  { valor: 25, rotulo: "25 usos" },
  { valor: 50, rotulo: "50 usos" },
  { valor: 100, rotulo: "100 usos" },
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
            valor={validade}
            onEscolher={setValidade}
            opcoes={VALIDADES}
            placeholder="Escolha ou digite…"
          />
        </div>

        <div data-gc="servidor.configuracoes-do-convite.div--2">
          <Label data-gc="servidor.configuracoes-do-convite.label--2" htmlFor="convite-usos">Número máximo de usos</Label>
          <Combobox data-gc="servidor.configuracoes-do-convite.combobox.set-usos"
            id="convite-usos"
            valor={usos}
            onEscolher={setUsos}
            opcoes={USOS}
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
