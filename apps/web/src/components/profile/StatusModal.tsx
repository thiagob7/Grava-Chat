import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { LIMITS, type StatusPersonalizado } from "@gravae/shared";

import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/input";
import { SeletorDeEmoji } from "~/components/SeletorDeEmoji";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import type { EstiloDePerfil } from "@gravae/shared";

/**
 * Por quanto tempo o status vale.
 *
 * A expiração é conferida na SERIALIZAÇÃO, não por tarefa agendada — o mesmo
 * idioma que o castigo já usa comparando `timeoutUntil` com a hora atual. Sem
 * cron, sem fila: o documento vencido fica no banco até a próxima escrita e não
 * incomoda ninguém.
 */
const PRAZOS = [
  { id: "nunca", rotulo: "Não limpar", minutos: null },
  { id: "30m", rotulo: "Limpar em 30 minutos", minutos: 30 },
  { id: "1h", rotulo: "Limpar em 1 hora", minutos: 60 },
  { id: "4h", rotulo: "Limpar em 4 horas", minutos: 240 },
  {
    id: "hoje",
    rotulo: "Limpar hoje",
    minutos: null as number | null,
    ateOFimDoDia: true,
  },
  { id: "amanha", rotulo: "Limpar amanhã", minutos: 24 * 60 },
] as const;

interface StatusModalProps {
  open: boolean;
  user: SelfUserModel;
  /** o perfil do RASCUNHO, pra prévia bater com o que está sendo editado */
  perfil: EstiloDePerfil | null;
  onClose: () => void;
  onSalvar: (status: StatusPersonalizado | null) => void;
  salvando?: boolean;
}

/**
 * "Definir seu status" — o recado curto ao lado do seu nome.
 *
 * Tem prévia porque o status divide a linha com a etiqueta e os emblemas: um
 * texto que parece curto no campo pode empurrar tudo. Aqui dá pra ver antes.
 */
export const StatusModal: React.FC<StatusModalProps> = ({
  open,
  user,
  perfil,
  onClose,
  onSalvar,
  salvando = false,
}) => {
  const atual = user.statusPersonalizado;
  const [texto, setTexto] = useState(atual?.texto ?? "");
  const [emoji, setEmoji] = useState(atual?.emoji ?? "");
  const [prazo, setPrazo] = useState<string>("nunca");

  const previa: StatusPersonalizado | null = texto.trim()
    ? { texto: texto.trim(), emoji: emoji.trim() || null, expiraEm: null }
    : null;

  const salvar = () => {
    if (!previa) return onSalvar(null);

    const escolhido = PRAZOS.find((p) => p.id === prazo);
    onSalvar({ ...previa, expiraEm: calcularExpiracao(escolhido) });
  };

  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-w-md p-5">
        <DialogTitle className="text-lg font-semibold">
          Definir seu status
        </DialogTitle>

        <div className="mt-4">
          <ProfileCardVisual
            id={user.id}
            displayName={user.displayName}
            username={user.username}
            avatarUrl={user.avatarUrl}
            status={user.status}
            perfil={perfil}
            statusPersonalizado={previa}
          />
        </div>

        <div className="mt-5">
          <Label htmlFor="status-texto">Status</Label>

          {/*
            UM campo, não dois.

            O emoji e o texto são a mesma frase, e cada um com a própria caixa
            (e o próprio anel de foco) parecia formulário de cadastro. O anel
            vive no contêiner, com `focus-within`: clicar em qualquer parte
            acende a coisa inteira, que é como um campo composto tem que se
            comportar.
          */}
          <div className="flex items-center gap-1 rounded bg-surface-0 px-1 ring-ink-faint/70 transition focus-within:ring-2">
            <SeletorDeEmoji onEscolher={setEmoji}>
              <button
                type="button"
                aria-label="Escolher emoji"
                className="flex size-9 shrink-0 items-center justify-center rounded text-xl text-ink-faint transition hover:bg-surface-3 hover:text-ink"
              >
                {emoji || <Smile size={18} />}
              </button>
            </SeletorDeEmoji>

            <input
              id="status-texto"
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={LIMITS.statusPersonalizado}
              placeholder="No que você está pensando?"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />

            {emoji && (
              <button
                type="button"
                onClick={() => setEmoji("")}
                aria-label="Tirar o emoji"
                className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <select
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            aria-label="Quando limpar"
            className="flex-1 rounded bg-surface-0 px-3 py-2 text-sm text-ink-muted outline-none ring-ink-faint/70 transition focus:ring-2"
          >
            {PRAZOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rotulo}
              </option>
            ))}
          </select>

          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </div>

        {atual && (
          <button
            onClick={() => onSalvar(null)}
            className="mt-3 text-xs text-ink-faint transition hover:text-danger"
          >
            Limpar status agora
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};

/** `null` = não expira. O horário sai daqui em ISO, que é o formato do schema. */
function calcularExpiracao(prazo?: (typeof PRAZOS)[number]): string | null {
  if (!prazo) return null;

  if ("ateOFimDoDia" in prazo && prazo.ateOFimDoDia) {
    const fim = new Date();
    fim.setHours(23, 59, 59, 999);
    return fim.toISOString();
  }

  if (!prazo.minutos) return null;

  return new Date(Date.now() + prazo.minutos * 60_000).toISOString();
}
