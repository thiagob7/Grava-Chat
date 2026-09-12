import React, { useEffect, useState } from "react";

import { useSaveNote } from "~/@core/application/queries/user/use-salvar-nota";
import { useTranslation } from "~/traducao";

export const NoteField: React.FC<{
  userId: string;
  note: string | null;
  field?: React.RefObject<HTMLTextAreaElement | null>;
  /** Sem o rótulo, para quem já desenha um título em volta. */
  bare?: boolean;
}> = ({ userId, note, field, bare = false }) => {
  const { t } = useTranslation();
  const save = useSaveNote(userId);
  const [text, setText] = useState(note ?? "");

  useEffect(() => setText(note ?? ""), [note, userId]);

  return (
    <div data-gc="perfil.cartao.campo-de-nota.div" className={bare ? undefined : "mt-3"}>
      {!bare && (
        <p data-gc="perfil.cartao.campo-de-nota.p" className="mb-1 text-xs font-semibold uppercase text-ink-faint">
          {t("perfil.nota.rotulo")}
        </p>
      )}

      <textarea data-gc="perfil.cartao.campo-de-nota.textarea"
        ref={field}
        value={text}
        rows={2}
        maxLength={256}
        placeholder={t("perfil.nota.vazia")}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() !== (note ?? "").trim()) save.mutate(text.trim());
        }}
        className="w-full resize-none rounded bg-surface-3/60 px-2 py-1.5 text-sm text-ink-muted outline-none ring-foco-anel transition placeholder:text-ink-faint focus:bg-surface-3 focus:text-ink focus:ring-2"
      />
    </div>
  );
};
