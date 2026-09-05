import referencia from "~/dados/referencia.json";

const COR_DO_METODO: Record<string, string> = {
  GET: "text-online",
  POST: "text-brand",
  PUT: "text-amber-400",
  PATCH: "text-amber-400",
  DELETE: "text-red-400",
};

export const RotasRest = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {referencia.rest.map((rota) => (
      <div key={`${rota.metodo} ${rota.caminho}`} className="bg-surface-1 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`w-16 shrink-0 font-mono text-xs font-bold ${COR_DO_METODO[rota.metodo] ?? "text-ink-muted"}`}
          >
            {rota.metodo}
          </span>
          <code className="text-[13px] text-ink">{rota.caminho}</code>
        </div>

        <p className="mt-1.5 pl-0 text-sm text-ink-muted sm:pl-[4.75rem]">{rota.descricao}</p>

        {rota.corpo ? (
          <p className="mt-1 pl-0 text-xs text-ink-faint sm:pl-[4.75rem]">
            corpo: <code>{rota.corpo}</code>
          </p>
        ) : null}
      </div>
    ))}
  </div>
);

export const EventosEnviados = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {referencia.eventos.map((evento) => (
      <div key={evento.nome} className="rounded-xl border border-line bg-surface-1 px-4 py-3">
        <code className="text-[13px] text-ink">{evento.nome}</code>

        {evento.campos.length ? (
          <ul className="mt-2 space-y-1">
            {evento.campos.map((campo) => (
              <li key={campo.nome} className="flex items-baseline gap-2 text-xs">
                <code className="text-ink-muted">{campo.nome}</code>
                <span className="text-ink-faint">{campo.tipo}</span>
                {campo.obrigatorio ? null : <span className="text-ink-faint">opcional</span>}
                {campo.limite ? <span className="text-ink-faint">até {campo.limite}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">sem campos</p>
        )}
      </div>
    ))}
  </div>
);

export const EventosRecebidos = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {referencia.recebidos.map((evento) => (
      <div
        key={evento.nome}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className="shrink-0 text-[13px] text-ink sm:w-52">{evento.nome}</code>
        <p className="text-sm text-ink-muted">{evento.descricao}</p>
      </div>
    ))}
  </div>
);
