import React from "react";
import { LIMITS, type Emblema } from "@gravae/shared";
import { toast } from "react-toastify";

import { useVestirEmblemas } from "~/@core/application/queries/guild/use-emblemas";
import { cn } from "~/lib/utils";

interface EscolherEmblemasProps {
  guildId: string;
  disponiveis: Emblema[];
  vestidos: Emblema[];
}

export const EscolherEmblemas: React.FC<EscolherEmblemasProps> = ({
  guildId,
  disponiveis,
  vestidos,
}) => {
  const vestir = useVestirEmblemas(guildId);
  if (!disponiveis.length) return null;

  const atuais = new Set(vestidos.map((e) => e.id));

  const alternar = (id: string) => {
    const proximos = new Set(atuais);

    if (proximos.has(id)) proximos.delete(id);
    else if (proximos.size >= LIMITS.emblemasPorMembro) {
      return toast.info(`Dá pra vestir até ${LIMITS.emblemasPorMembro} emblemas.`);
    } else proximos.add(id);

    vestir.mutate([...proximos]);
  };

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-semibold uppercase text-ink-faint">
        Emblemas deste servidor
      </p>

      <div className="flex flex-wrap gap-1.5">
        {disponiveis.map((emblema) => (
          <button
            key={emblema.id}
            onClick={() => alternar(emblema.id)}
            title={emblema.nome}
            disabled={vestir.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition",
              atuais.has(emblema.id)
                ? "border-brand bg-surface-3 text-ink"
                : "border-line bg-surface-0 text-ink-muted hover:bg-surface-3 hover:text-ink",
            )}
          >
            {emblema.emoji ? (
              <span className="leading-none">{emblema.emoji}</span>
            ) : emblema.iconUrl ? (
              <img src={emblema.iconUrl} alt="" className="size-4 object-contain" />
            ) : null}
            {emblema.nome}
          </button>
        ))}
      </div>
    </div>
  );
};
