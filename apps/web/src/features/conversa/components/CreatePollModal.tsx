import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { CreatePollInput } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { CampoSelect } from "~/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  onCriar: (poll: CreatePollInput) => void;
}

const DURACOES = [
  { horas: 1, label: "1 hora" },
  { horas: 4, label: "4 horas" },
  { horas: 8, label: "8 horas" },
  { horas: 24, label: "1 dia" },
  { horas: 72, label: "3 dias" },
  { horas: 168, label: "1 semana" },
];

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ open, onClose, onCriar }) => {
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [duracao, setDuracao] = useState<number | null>(24);

  const validas = opcoes.map((o) => o.trim()).filter(Boolean);
  const pode = pergunta.trim().length > 0 && validas.length >= 2;

  const fechar = () => {
    setPergunta("");
    setOpcoes(["", ""]);
    setMultiSelect(false);
    setDuracao(24);
    onClose();
  };

  return (
    <Dialog data-gc="conversa.create-poll-modal.dialog" open={open} onOpenChange={(next) => !next && fechar()}>
      <DialogContent data-gc="conversa.create-poll-modal.dialog-content">
        <DialogHeader data-gc="conversa.create-poll-modal.dialog-header">
          <DialogTitle data-gc="conversa.create-poll-modal.dialog-title">Criar enquete</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.create-poll-modal.dialog-body" className="space-y-4">
          <div data-gc="conversa.create-poll-modal.div">
            <Label data-gc="conversa.create-poll-modal.label" htmlFor="pergunta">Pergunta</Label>
            <Input data-gc="conversa.create-poll-modal.input"
              id="pergunta"
              autoFocus
              value={pergunta}
              maxLength={200}
              placeholder="O que a gente joga hoje?"
              onChange={(e) => setPergunta(e.target.value)}
            />
          </div>

          <div data-gc="conversa.create-poll-modal.div--2">
            <Label data-gc="conversa.create-poll-modal.label--2">Respostas</Label>
            <div data-gc="conversa.create-poll-modal.div--3" className="space-y-2">
              {opcoes.map((opcao, indice) => (
                <div data-gc="conversa.create-poll-modal.div--4" key={indice} className="flex items-center gap-2">
                  <Input data-gc="conversa.create-poll-modal.input--2"
                    value={opcao}
                    maxLength={80}
                    placeholder={`Opção ${indice + 1}`}
                    onChange={(e) =>
                      setOpcoes((atual) => atual.map((o, i) => (i === indice ? e.target.value : o)))
                    }
                  />
                  {opcoes.length > 2 && (
                    <button data-gc="conversa.create-poll-modal.button"
                      onClick={() => setOpcoes((atual) => atual.filter((_, i) => i !== indice))}
                      aria-label="Remover opção"
                      className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                    >
                      <X data-gc="conversa.create-poll-modal.x" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {opcoes.length < LIMITS.opcoesPorEnquete && (
              <Button data-gc="conversa.create-poll-modal.button--2"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setOpcoes((atual) => [...atual, ""])}
              >
                <Plus data-gc="conversa.create-poll-modal.plus" size={14} /> Adicionar opção
              </Button>
            )}
          </div>

          <div data-gc="conversa.create-poll-modal.div--5" className="flex items-start gap-4">
            <div data-gc="conversa.create-poll-modal.div--6" className="flex-1">
              <p data-gc="conversa.create-poll-modal.p" className="text-sm font-medium">Permitir mais de uma resposta</p>
              <p data-gc="conversa.create-poll-modal.p--2" className="mt-0.5 text-xs text-ink-faint">
                Sem isto, votar numa opção tira o voto da anterior.
              </p>
            </div>
            <Switch data-gc="conversa.create-poll-modal.switch.set-multi-select" checked={multiSelect} onCheckedChange={setMultiSelect} />
          </div>

          <div data-gc="conversa.create-poll-modal.div--7">
            <Label data-gc="conversa.create-poll-modal.label--3" htmlFor="duracao">Duração</Label>
            <CampoSelect data-gc="conversa.create-poll-modal.campo-select"
              id="duracao"
              valor={duracao === null ? "" : String(duracao)}
              onEscolher={(v) => setDuracao(v ? Number(v) : null)}
              opcoes={[
                ...DURACOES.map((item) => ({ valor: String(item.horas), rotulo: item.label })),
                { valor: "", rotulo: "Até eu encerrar" },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.create-poll-modal.dialog-footer">
          <Button data-gc="conversa.create-poll-modal.button.fechar" variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button data-gc="conversa.create-poll-modal.button--3"
            disabled={!pode}
            onClick={() =>
              onCriar({
                pergunta: pergunta.trim(),
                opcoes: validas.map((texto) => ({ texto })),
                multiSelect,
                duracaoHoras: duracao,
              })
            }
          >
            Criar enquete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
