import React, { useEffect, useState } from "react";

import { useSalvarNota } from "~/@core/application/queries/user/use-salvar-nota";

/**
 * A anotação privada sobre alguém.
 *
 * Grava ao sair do campo, não a cada tecla: é texto curto escrito de uma vez, e
 * uma requisição por letra seria desperdício num campo que quase ninguém usa.
 *
 * O aviso de que ninguém mais vê fica NO rótulo, não num tooltip. Sem ele a
 * pessoa não sabe se está escrevendo um recado pro outro — e aí ou não escreve,
 * ou escreve achando que ele vai ler.
 */
export const CampoDeNota: React.FC<{ userId: string; nota: string | null }> = ({ userId, nota }) => {
  const salvar = useSalvarNota(userId);
  const [texto, setTexto] = useState(nota ?? "");

  // trocar de pessoa reaproveita o componente; sem isto a nota de um apareceria no outro
  useEffect(() => setTexto(nota ?? ""), [nota, userId]);

  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-semibold uppercase text-ink-faint">Nota (só você vê)</p>
      <textarea
        value={texto}
        rows={2}
        maxLength={256}
        placeholder="Clique para anotar algo"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          if (texto.trim() !== (nota ?? "").trim()) salvar.mutate(texto.trim());
        }}
        className="w-full resize-none rounded bg-surface-3/60 px-2 py-1.5 text-sm text-ink-muted outline-none ring-brand/60 transition placeholder:text-ink-faint focus:bg-surface-3 focus:text-ink focus:ring-2"
      />
    </div>
  );
};
