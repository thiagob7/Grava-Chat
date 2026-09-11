import reference from "~/dados/referencia.json";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-online",
  POST: "text-brand",
  PUT: "text-amber-400",
  PATCH: "text-amber-400",
  DELETE: "text-red-400",
};

const byGroup = reference.rest.reduce<Record<string, typeof reference.rest>>((map, route) => {
  map[route.group] = [...(map[route.group] ?? []), route];
  return map;
}, {});

export const RoutesRest = () => (
  <div className="space-y-8">
    {Object.entries(byGroup).map(([group, routes]) => (
      <div key={group}>
        <h3 className="pb-2.5 text-sm font-semibold text-ink">
          {group}
          <span className="pl-2 font-normal text-ink-faint">{routes.length}</span>
        </h3>

        <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
          {routes.map((route) => (
            <div key={`${route.method} ${route.path}`} className="bg-surface-1 px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={`w-16 shrink-0 font-mono text-xs font-bold ${
                    METHOD_COLOR[route.method] ?? "text-ink-muted"
                  }`}
                >
                  {route.method}
                </span>
                <code className="text-[13px] text-ink">{route.path}</code>
              </div>

              <p className="mt-1.5 text-sm text-ink-muted sm:pl-[4.75rem]">{route.description}</p>

              {route.body ? (
                <p className="mt-1 text-xs text-ink-faint sm:pl-[4.75rem]">
                  corpo: <code>{route.body}</code>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const EventsSent = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {reference.events.map((event) => (
      <div key={event.name} className="rounded-xl border border-line bg-surface-1 px-4 py-3">
        <code className="text-[13px] text-ink">{event.name}</code>

        {event.fields.length ? (
          <ul className="mt-2 space-y-1">
            {event.fields.map((field) => (
              <li key={field.name} className="flex items-baseline gap-2 text-xs">
                <code className="text-ink-muted">{field.name}</code>
                <span className="text-ink-faint">{field.kind}</span>
                {field.required ? null : <span className="text-ink-faint">opcional</span>}
                {field.limit ? <span className="text-ink-faint">até {field.limit}</span> : null}
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

export const EventsReceived = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {reference.received.map((event) => (
      <div
        key={event.name}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className="shrink-0 text-[13px] text-ink sm:w-52">{event.name}</code>
        <p className="text-sm text-ink-muted">{event.description}</p>
      </div>
    ))}
  </div>
);

const CodeColor = (code: number) => {
  if (code >= 500) return "text-red-400";
  if (code === 429) return "text-amber-400";
  if (code >= 400) return "text-brand";

  return "text-online";
};

export const ErrorCodes = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {reference.failures.codes.map((item) => (
      <div
        key={item.code}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className={`shrink-0 text-[13px] font-semibold sm:w-16 ${CodeColor(item.code)}`}>
          {item.code}
        </code>
        <p className="text-sm text-ink-muted">{item.when}</p>
      </div>
    ))}
  </div>
);

export const FailureReasons = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {reference.failures.reasons.map((item) => (
      <div
        key={item.reason}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className="shrink-0 text-[13px] text-ink sm:w-44">{item.reason}</code>
        <p className="text-sm text-ink-muted">{item.when}</p>
      </div>
    ))}
  </div>
);

type Route = (typeof reference.rest)[number];
type Field = (typeof reference.objects)[number]["fields"][number];
type ObjectEvent = (typeof reference.objects)[number]["events"][number];

export const ObjectRoutes = ({ routes }: { routes: Route[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {routes.map((route) => (
      <div key={`${route.method} ${route.path}`} className="bg-surface-1 px-4 py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`w-16 shrink-0 font-mono text-xs font-bold ${
              METHOD_COLOR[route.method] ?? "text-ink-muted"
            }`}
          >
            {route.method}
          </span>
          <code className="text-[13px] text-ink">{route.path}</code>
        </div>

        <p className="mt-1.5 text-sm text-ink-muted sm:pl-[4.75rem]">{route.description}</p>

        {route.body ? (
          <p className="mt-1 text-xs text-ink-faint sm:pl-[4.75rem]">
            corpo: <code>{route.body}</code>
          </p>
        ) : null}
      </div>
    ))}
  </div>
);

export const ObjectFields = ({ fields }: { fields: Field[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {fields.map((field) => (
      <div
        key={field.name}
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-surface-1 px-4 py-2.5"
      >
        <code className="text-[13px] text-ink sm:w-52">{field.name}</code>
        <span className="font-mono text-xs text-ink-muted">{field.kind}</span>
        {field.required ? null : (
          <span className="text-xs text-ink-faint">pode vir vazio</span>
        )}
      </div>
    ))}
  </div>
);

export const ObjectEvents = ({ events }: { events: ObjectEvent[] }) => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {events.map((event) => (
      <div
        key={event.name}
        className="flex flex-col gap-x-4 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
      >
        <code className="shrink-0 text-[13px] text-ink sm:w-52">{event.name}</code>
        <p className="text-sm text-ink-muted">{event.description}</p>
      </div>
    ))}
  </div>
);

export const ObjectsIndex = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {reference.objects.map((object) => (
      <a
        key={object.id}
        href={`/desenvolvedores/referencia/${object.id}`}
        className="rounded-xl border border-line bg-surface-1 px-4 py-3.5 transition hover:border-brand/50 hover:bg-surface-2"
      >
        <p className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-ink">{object.name}</span>
          <span className="font-mono text-xs text-ink-faint">
            {object.routes.length > 0 ? `${object.routes.length} rotas` : "só eventos"}
          </span>
        </p>
        <p className="mt-1 text-sm text-ink-muted">{object.summary}</p>
      </a>
    ))}
  </div>
);

