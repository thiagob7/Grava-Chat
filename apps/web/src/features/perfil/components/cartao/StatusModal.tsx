import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { LIMITS, type StatusPersonalizado } from "@gravae/shared";

import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { Button } from "~/components/ui/button";
import { CampoSelect } from "~/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Label, campoNu, grupoDeCampo } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { SeletorDeEmoji } from "~/features/expressao/components/SeletorDeEmoji";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import type { EstiloDePerfil } from "@gravae/shared";
import { i18next, idiomaAtual, useTranslation } from "~/traducao";

const PRAZOS = [
  { id: "nunca", chave: "naoLimpar", minutos: null },
  { id: "30m", chave: "limpar30m", minutos: 30 },
  { id: "1h", chave: "limpar1h", minutos: 60 },
  { id: "4h", chave: "limpar4h", minutos: 240 },
  {
    id: "hoje",
    chave: "limparHoje",
    minutos: null as number | null,
    ateOFimDoDia: true,
  },
  { id: "amanha", chave: "limparAmanha", minutos: 24 * 60 },
] as const;

function rotuloComHora(prazo: (typeof PRAZOS)[number]): string {
  const nome = i18next.t(`perfil.status.${prazo.chave}`);
  const iso = calcularExpiracao(prazo);
  if (!iso) return nome;

  const hora = new Date(iso).toLocaleTimeString(idiomaAtual(), {
    hour: "2-digit",
    minute: "2-digit",
  });

  return i18next.t("perfil.status.comHora", { prazo: nome, hora });
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
  const { t } = useTranslation();
  const atual = user.statusPersonalizado;
  const [texto, setTexto] = useState(atual?.texto ?? "");
  const [emoji, setEmoji] = useState(atual?.emoji ?? "");
  const [prazo, setPrazo] = useState<string>("nunca");

  const previa: StatusPersonalizado | null = texto.trim()
    ? { texto: texto.trim(), emoji: emoji.trim() || null, expiraEm: null }
    : null;

  const previaNoCartao: StatusPersonalizado = previa ?? {
    texto: t("perfil.status.oQuePensa"),
    emoji: null,
    expiraEm: null,
  };

  const salvar = () => {
    if (!previa) return onSalvar(null);

    const escolhido = PRAZOS.find((p) => p.id === prazo);
    onSalvar({ ...previa, expiraEm: calcularExpiracao(escolhido) });
  };

  return (
    <Dialog data-gc="perfil.cartao.status-modal.dialog" open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent data-gc="perfil.cartao.status-modal.dialog-content" className="max-w-md p-5">
        <DialogTitle data-gc="perfil.cartao.status-modal.dialog-title" className="text-lg font-semibold">
          {t("perfil.status.definir")}
        </DialogTitle>

        <div data-gc="perfil.cartao.status-modal.div" className="mt-4">
          <ProfileCardVisual data-gc="perfil.cartao.status-modal.profile-card-visual"
            id={user.id}
            displayName={user.displayName}
            username={user.username}
            avatarUrl={user.avatarUrl}
            status={user.status}
            perfil={perfil}
            statusPersonalizado={previaNoCartao}
          />
        </div>

        <div data-gc="perfil.cartao.status-modal.div--2" className="mt-5">
          <Label data-gc="perfil.cartao.status-modal.label" htmlFor="status-texto">{t("perfil.status.titulo")}</Label>

          <div data-gc="perfil.cartao.status-modal.div--3" className={cn(grupoDeCampo, "gap-1 px-1.5")}>
            <SeletorDeEmoji data-gc="perfil.cartao.status-modal.seletor-de-emoji.set-emoji" onEscolher={setEmoji}>
              <button data-gc="perfil.cartao.status-modal.button"
                type="button"
                aria-label={t("perfil.status.escolherEmoji")}
                className="flex size-8 shrink-0 items-center justify-center rounded text-lg text-ink-faint transition hover:bg-surface-3 hover:text-ink"
              >
                {emoji || <Smile data-gc="perfil.cartao.status-modal.smile" size={16} />}
              </button>
            </SeletorDeEmoji>

            <input data-gc="perfil.cartao.status-modal.input"
              id="status-texto"
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={LIMITS.statusPersonalizado}
              placeholder={t("perfil.status.oQuePensa")}
              className={campoNu}
            />

            {emoji && (
              <button data-gc="perfil.cartao.status-modal.button--2"
                type="button"
                onClick={() => setEmoji("")}
                aria-label={t("perfil.status.tirarEmoji")}
                className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
              >
                <X data-gc="perfil.cartao.status-modal.x" size={14} />
              </button>
            )}
          </div>
        </div>

        <div data-gc="perfil.cartao.status-modal.div--4" className="mt-4 flex items-center gap-3">
          <CampoSelect data-gc="perfil.cartao.status-modal.campo-select.set-prazo"
            valor={prazo}
            onEscolher={setPrazo}
            className="flex-1"
            opcoes={PRAZOS.map((p) => ({ valor: p.id, rotulo: rotuloComHora(p) }))}
          />

          <Button data-gc="perfil.cartao.status-modal.button.salvar" onClick={salvar} disabled={salvando}>
            {t(salvando ? "comum.salvando" : "comum.salvar")}
          </Button>
        </div>

        {atual && (
          <button data-gc="perfil.cartao.status-modal.button--3"
            onClick={() => onSalvar(null)}
            className="mt-3 text-xs text-ink-faint transition hover:text-danger"
          >
            {t("perfil.status.limparAgora")}
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
