import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { LIMITS, type StatusPersonalizado } from "@gravae/shared";

import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Label, campoNu, grupoDeCampo } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { SeletorDeEmoji } from "~/components/SeletorDeEmoji";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import type { EstiloDePerfil } from "@gravae/shared";

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

const PLACEHOLDER = "No que você está pensando?";

/// "Limpar amanhã" nao diz nada; "Limpar amanhã às 21:11" diz. O horario e
/// calculado com o mesmo `calcularExpiracao` que grava o valor, entao o rotulo
/// nunca mente sobre o que vai acontecer.
function rotuloComHora(prazo: (typeof PRAZOS)[number]): string {
  const iso = calcularExpiracao(prazo);
  if (!iso) return prazo.rotulo;

  const hora = new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${prazo.rotulo} às ${hora}`;
}

interface StatusModalProps {
  open: boolean;
  user: SelfUserModel;
  perfil: EstiloDePerfil | null;
  onClose: () => void;
  onSalvar: (status: StatusPersonalizado | null) => void;
  salvando?: boolean;
}

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

  /*
    Com o campo vazio o cartao mostra o proprio placeholder no balao, em vez de
    esconder o balao inteiro. E o que o Discord faz: a pessoa ve onde o status
    vai parar antes de digitar qualquer coisa.
  */
  const previaNoCartao: StatusPersonalizado = previa ?? {
    texto: PLACEHOLDER,
    emoji: null,
    expiraEm: null,
  };

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
            statusPersonalizado={previaNoCartao}
          />
        </div>

        <div className="mt-5">
          <Label htmlFor="status-texto">Status</Label>

          <div className={cn(grupoDeCampo, "gap-1 px-1.5")}>
            <SeletorDeEmoji onEscolher={setEmoji}>
              <button
                type="button"
                aria-label="Escolher emoji"
                className="flex size-8 shrink-0 items-center justify-center rounded text-lg text-ink-faint transition hover:bg-surface-3 hover:text-ink"
              >
                {emoji || <Smile size={16} />}
              </button>
            </SeletorDeEmoji>

            <input
              id="status-texto"
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={LIMITS.statusPersonalizado}
              placeholder={PLACEHOLDER}
              className={campoNu}
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
          <CampoSelect
            valor={prazo}
            onEscolher={setPrazo}
            className="flex-1"
            opcoes={PRAZOS.map((p) => ({ valor: p.id, rotulo: rotuloComHora(p) }))}
          />

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
