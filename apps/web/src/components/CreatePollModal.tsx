import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { CreatePollInput } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label, campoBase } from "~/components/ui/input";
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
    <Dialog open={open} onOpenChange={(next) => !next && fechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar enquete</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div>
            <Label htmlFor="pergunta">Pergunta</Label>
            <Input
              id="pergunta"
              autoFocus
              value={pergunta}
              maxLength={200}
              placeholder="O que a gente joga hoje?"
              onChange={(e) => setPergunta(e.target.value)}
            />
          </div>

          <div>
            <Label>Respostas</Label>
            <div className="space-y-2">
              {opcoes.map((opcao, indice) => (
                <div key={indice} className="flex items-center gap-2">
                  <Input
                    value={opcao}
                    maxLength={80}
                    placeholder={`Opção ${indice + 1}`}
                    onChange={(e) =>
                      setOpcoes((atual) => atual.map((o, i) => (i === indice ? e.target.value : o)))
                    }
                  />
                  {opcoes.length > 2 && (
                    <button
                      onClick={() => setOpcoes((atual) => atual.filter((_, i) => i !== indice))}
                      aria-label="Remover opção"
                      className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {opcoes.length < LIMITS.opcoesPorEnquete && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setOpcoes((atual) => [...atual, ""])}
              >
                <Plus size={14} /> Adicionar opção
              </Button>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Permitir mais de uma resposta</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                Sem isto, votar numa opção tira o voto da anterior.
              </p>
            </div>
            <Switch checked={multiSelect} onCheckedChange={setMultiSelect} />
          </div>

          <div>
            <Label htmlFor="duracao">Duração</Label>
            <select
              id="duracao"
              value={duracao ?? ""}
              onChange={(e) => setDuracao(e.target.value ? Number(e.target.value) : null)}
              className={campoBase}
            >
              {DURACOES.map((item) => (
                <option key={item.horas} value={item.horas}>
                  {item.label}
                </option>
              ))}
              <option value="">Até eu encerrar</option>
            </select>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button
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
