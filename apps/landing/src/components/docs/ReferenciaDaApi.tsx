import referencia from "~/dados/referencia.json";

const COR_DO_METODO: Record<string, string> = {
  GET: "text-online",
  POST: "text-brand",
  PUT: "text-amber-400",
  PATCH: "text-amber-400",
  DELETE: "text-red-400",
};

const porGrupo = referencia.rest.reduce<Record<string, typeof referencia.rest>>((mapa, rota) => {
  mapa[rota.grupo] = [...(mapa[rota.grupo] ?? []), rota];
  return mapa;
}, {});

export const RotasRest = () => (
  <div className="space-y-8">
    {Object.entries(porGrupo).map(([grupo, rotas]) => (
      <div key={grupo}>
        <h3 className="pb-2.5 text-sm font-semibold text-ink">
          {grupo}
          <span className="pl-2 font-normal text-ink-faint">{rotas.length}</span>
        </h3>

        <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
          {rotas.map((rota) => (
            <div key={`${rota.metodo} ${rota.caminho}`} className="bg-surface-1 px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={`w-16 shrink-0 font-mono text-xs font-bold ${
                    COR_DO_METODO[rota.metodo] ?? "text-ink-muted"
                  }`}
                >
                  {rota.metodo}
                </span>
                <code className="text-[13px] text-ink">{rota.caminho}</code>
              </div>

              <p className="mt-1.5 text-sm text-ink-muted sm:pl-[4.75rem]">{rota.descricao}</p>

              {rota.corpo ? (
                <p className="mt-1 text-xs text-ink-faint sm:pl-[4.75rem]">
                  corpo: <code>{rota.corpo}</code>
                </p>
              ) : null}
            </div>
          ))}
        </div>
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

const CorDoCodigo = (codigo: number) => {
  if (codigo >= 500) return "text-red-400";
  if (codigo === 429) return "text-amber-400";
  if (codigo >= 400) return "text-brand";

  return "text-online";
};

export const CodigosDeErro = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {referencia.falhas.codigos.map((item) => (
      <div
        key={item.codigo}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className={`shrink-0 text-[13px] font-semibold sm:w-16 ${CorDoCodigo(item.codigo)}`}>
          {item.codigo}
        </code>
        <p className="text-sm text-ink-muted">{item.quando}</p>
      </div>
    ))}
  </div>
);

export const MotivosDeFalha = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {referencia.falhas.motivos.map((item) => (
      <div
        key={item.motivo}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className="shrink-0 text-[13px] text-ink sm:w-44">{item.motivo}</code>
        <p className="text-sm text-ink-muted">{item.quando}</p>
      </div>
    ))}
  </div>
);

type Rota = (typeof referencia.rest)[number];
type Campo = (typeof referencia.objetos)[number]["campos"][number];
type EventoDoObjeto = (typeof referencia.objetos)[number]["eventos"][number];

export const RotasDoObjeto = ({ rotas }: { rotas: Rota[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {rotas.map((rota) => (
      <div key={`${rota.metodo} ${rota.caminho}`} className="bg-surface-1 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`w-16 shrink-0 font-mono text-xs font-bold ${
              COR_DO_METODO[rota.metodo] ?? "text-ink-muted"
            }`}
          >
            {rota.metodo}
          </span>
          <code className="text-[13px] text-ink">{rota.caminho}</code>
        </div>

        <p className="mt-1.5 text-sm text-ink-muted sm:pl-[4.75rem]">{rota.descricao}</p>

        {rota.corpo ? (
          <p className="mt-1 text-xs text-ink-faint sm:pl-[4.75rem]">
            corpo: <code>{rota.corpo}</code>
          </p>
        ) : null}
      </div>
    ))}
  </div>
);

export const CamposDoObjeto = ({ campos }: { campos: Campo[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {campos.map((campo) => (
      <div
        key={campo.nome}
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-1 px-4 py-2.5"
      >
        <code className="text-[13px] text-ink sm:w-52">{campo.nome}</code>
        <span className="font-mono text-xs text-ink-muted">{campo.tipo}</span>
        {campo.obrigatorio ? null : (
          <span className="text-xs text-ink-faint">pode vir vazio</span>
        )}
      </div>
    ))}
  </div>
);

export const EventosDoObjeto = ({ eventos }: { eventos: EventoDoObjeto[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {eventos.map((evento) => (
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

export const IndiceDeObjetos = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {referencia.objetos.map((objeto) => (
      <a
        key={objeto.id}
        href={`/desenvolvedores/referencia/${objeto.id}`}
        className="rounded-xl border border-line bg-surface-1 px-4 py-3.5 transition hover:border-brand/50 hover:bg-surface-2"
      >
        <p className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-ink">{objeto.nome}</span>
          <span className="font-mono text-xs text-ink-faint">
            {objeto.rotas.length > 0 ? `${objeto.rotas.length} rotas` : "só eventos"}
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-muted">{objeto.resumo}</p>
      </a>
    ))}
  </div>
);

