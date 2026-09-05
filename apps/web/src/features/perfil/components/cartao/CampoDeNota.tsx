import React, { useEffect, useState } from "react";

import { useSalvarNota } from "~/@core/application/queries/user/use-salvar-nota";
import { useTranslation } from "~/traducao";

export const CampoDeNota: React.FC<{
  userId: string;
  nota: string | null;
  campo?: React.RefObject<HTMLTextAreaElement | null>;
}> = ({ userId, nota, campo }) => {
  const { t } = useTranslation();
  const salvar = useSalvarNota(userId);
  const [texto, setTexto] = useState(nota ?? "");

  useEffect(() => setTexto(nota ?? ""), [nota, userId]);

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase text-ink-faint">{t("perfil.nota.rotulo")}</p>
      <textarea
        ref={campo}
        value={texto}
        rows={2}
        maxLength={256}
        placeholder={t("perfil.nota.vazia")}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          if (texto.trim() !== (nota ?? "").trim()) salvar.mutate(texto.trim());
        }}
        className="w-full resize-none rounded bg-surface-3/60 px-2 py-1.5 text-sm text-ink-muted outline-none ring-brand/60 transition placeholder:text-ink-faint focus:bg-surface-3 focus:text-ink focus:ring-2"
      />
    </div>
  );
};
