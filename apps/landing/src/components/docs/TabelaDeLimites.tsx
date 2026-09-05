import referencia from "~/dados/referencia.json";

const formatar = (valor: number, formato: string) => {
  if (formato === "bytes") {
    const mb = valor / 1024 / 1024;
    return mb >= 1 ? `${mb} MB` : `${valor / 1024} KB`;
  }

  if (formato === "segundos") {
    const horas = valor / 3600;
    return horas >= 1 ? `${horas} h` : `${valor / 60} min`;
  }

  const numero = valor.toLocaleString("pt-BR");
  return formato === "caracteres" ? `${numero} caracteres` : numero;
};

export const TabelaDeLimites = () => (
  <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
    {referencia.limites.map((limite) => (
      <div
        key={limite.rotulo}
        className="flex items-baseline justify-between gap-4 bg-surface-1 px-4 py-2.5"
      >
        <span className="text-sm text-ink-muted">{limite.rotulo}</span>
        <span className="shrink-0 text-sm font-medium text-ink">
          {formatar(limite.valor, limite.formato)}
        </span>
      </div>
    ))}
  </div>
);
