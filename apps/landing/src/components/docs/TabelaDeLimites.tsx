import reference from "~/dados/referencia.json";

const format = (value: number, format: string) => {
  if (format === "bytes") {
    const mb = value / 1024 / 1024;
    return mb >= 1 ? `${mb} MB` : `${value / 1024} KB`;
  }

  if (format === "segundos") {
    const hours = value / 3600;
    return hours >= 1 ? `${hours} h` : `${value / 60} min`;
  }

  const number = value.toLocaleString("pt-BR");
  return format === "caracteres" ? `${number} caracteres` : number;
};

export const LimitsTable = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {reference.limits.map((limit) => (
      <div
        key={limit.label}
        className="flex items-baseline justify-between gap-4 bg-surface-1 px-4 py-2.5"
      >
        <span className="text-sm text-ink-muted">{limit.label}</span>
        <span className="shrink-0 text-sm font-medium text-ink">
          {format(limit.value, limit.format)}
        </span>
      </div>
    ))}
  </div>
);
