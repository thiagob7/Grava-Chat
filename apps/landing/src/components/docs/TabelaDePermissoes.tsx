import referencia from "~/dados/referencia.json";

export const TabelaDePermissoes = () => (
  <div className="space-y-8">
    {referencia.permissoes.map((grupo) => (
      <div key={grupo.titulo}>
        <h3 className="pb-2.5 text-sm font-semibold text-ink">{grupo.titulo}</h3>

        <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
          {grupo.itens.map((item) => (
            <div key={item.chave} className="bg-surface-1 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-[13px] text-ink">{item.chave}</code>

                <span className="text-xs text-ink-faint">{item.nome}</span>

                {item.padrao ? (
                  <span className="ml-auto shrink-0 rounded bg-online/15 px-1.5 py-0.5 text-[11px] text-online">
                    de fábrica
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-ink-muted">{item.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
