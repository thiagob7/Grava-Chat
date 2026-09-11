import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Compass, UserRoundPlus } from "lucide-react";
import { NOTE_LIMIT } from "@gravae/shared";

import { useRequestFriend } from "~/@core/application/queries/friend/use-request-friend";
import { Button } from "~/components/ui/button";
import { bareField } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const AddFriendForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requestFriend = useRequestFriend();

  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const target = username.trim();

  const send = async () => {
    if (!target) return;

    const result = await requestFriend
      .mutateAsync({ username: target, note: note.trim() || null })
      .catch(() => null);

    if (!result) return;

    setSent(target.replace(/^@/, ""));
    setUsername("");
    setNote("");
  };

  return (
    <div data-gc="amizades.add-friend-form.div" className="mx-auto w-full max-w-3xl px-6 py-6">
      <div data-gc="amizades.add-friend-form.div--2" className="flex items-start justify-between gap-6">
        <div data-gc="amizades.add-friend-form.div--3" className="min-w-0">
          <h2 data-gc="amizades.add-friend-form.h2" className="text-lg font-bold">{t("amizades.adicionar.titulo")}</h2>
          <p data-gc="amizades.add-friend-form.p" className="mt-1 text-sm text-ink-muted">
            {t("amizades.adicionar.detalhe")}
          </p>
        </div>

        <span data-gc="amizades.add-friend-form.span" className="hidden size-16 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand sm:flex">
          <UserRoundPlus data-gc="amizades.add-friend-form.user-round-plus" size={30} />
        </span>
      </div>

      <div data-gc="amizades.add-friend-form.div--4" className={cn(
        "mt-5 rounded-lg border bg-campo p-3 transition",
        sent ? "border-online" : "border-line",
      )}>
        <div data-gc="amizades.add-friend-form.div--5" className="flex items-center gap-2">
          <input data-gc="amizades.add-friend-form.input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSent(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder={t("amizades.adicionar.exemplo")}
            aria-label={t("amizades.adicionar.exemplo")}
            className={cn(bareField, "min-w-0 flex-1 text-sm")}
          />

          <Button data-gc="amizades.add-friend-form.button"
            size="sm"
            className="shrink-0"
            onClick={() => void send()}
            disabled={!target || requestFriend.isPending}
          >
            {requestFriend.isPending ? t("amizades.adicionar.enviando") : t("amizades.adicionar.enviar")}
          </Button>
        </div>

        <div data-gc="amizades.add-friend-form.div--6" className="mt-2 flex items-end gap-2 border-t border-line pt-2">
          <textarea data-gc="amizades.add-friend-form.textarea"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
            placeholder={t("amizades.adicionar.recado")}
            aria-label={t("amizades.adicionar.recado")}
            rows={2}
            className={cn(bareField, "min-w-0 flex-1 resize-none text-sm")}
          />

          <span data-gc="amizades.add-friend-form.span--2" className="shrink-0 pb-1 text-11 tabular-nums text-ink-faint">
            {NOTE_LIMIT - note.length}
          </span>
        </div>
      </div>

      <p data-gc="amizades.add-friend-form.p--2" className="mt-2 text-xs text-ink-faint">
        {t("amizades.adicionar.recadoDica")}
      </p>

      {sent && (
        <p data-gc="amizades.add-friend-form.p--3" className="mt-2 text-sm text-online">
          {t("amizades.adicionar.enviadoPara", { nome: sent })}
        </p>
      )}

      <div data-gc="amizades.add-friend-form.div--7" className="mt-8 border-t border-line pt-6">
        <h3 data-gc="amizades.add-friend-form.h3" className="text-base font-bold">{t("amizades.adicionar.outrosLugares")}</h3>
        <p data-gc="amizades.add-friend-form.p--4" className="mt-1 text-sm text-ink-muted">
          {t("amizades.adicionar.outrosLugaresDetalhe")}
        </p>

        <button data-gc="amizades.add-friend-form.button--2"
          type="button"
          onClick={() => navigate("/explorar")}
          className="mt-4 flex w-full max-w-md items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-3 text-left transition hover:border-ink-faint/40"
        >
          <span data-gc="amizades.add-friend-form.span--3" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-online/15 text-online">
            <Compass data-gc="amizades.add-friend-form.compass" size={18} />
          </span>

          <span data-gc="amizades.add-friend-form.span--4" className="min-w-0 flex-1 truncate text-sm font-medium">
            {t("amizades.adicionar.explorarComunidades")}
          </span>

          <ChevronRight data-gc="amizades.add-friend-form.chevron-right" size={16} className="shrink-0 text-ink-faint" />
        </button>
      </div>
    </div>
  );
};
