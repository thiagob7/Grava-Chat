import reference from "~/dados/referencia.json";

export const PermissionsTable = () => (
  <div className="space-y-8">
    {reference.permissions.map((group) => (
      <div key={group.title}>
        <h3 className="pb-2.5 text-sm font-semibold text-ink">{group.title}</h3>

        <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
          {group.items.map((item) => (
            <div key={item.key} className="bg-surface-1 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-[13px] text-ink">{item.key}</code>

                <span className="text-xs text-ink-faint">{item.name}</span>

                {item.fallback ? (
                  <span className="ml-auto shrink-0 rounded bg-online/15 px-1.5 py-0.5 text-[11px] text-online">
                    de fábrica
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
