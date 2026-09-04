import React, { useEffect, useState } from "react";
import type { VersoesDoAplicativo } from "@gravae/shared";

import { Tooltip } from "~/components/ui/tooltip";
import { copiarTexto } from "~/lib/copiar";
import { desktop } from "~/lib/desktop";
import { useTranslation } from "~/traducao";

declare const __VERSAO_WEB__: string;

export const RodapeDeVersoes: React.FC = () => {
  const { t } = useTranslation();
  const [doApp, setDoApp] = useState<VersoesDoAplicativo | null>(null);
  const nome = desktop()?.nomeNoSistema ?? "Gravaê";
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const pedir = desktop()?.versoes;
    if (!pedir) return;

    let vivo = true;

    void pedir()
      .then((v) => vivo && setDoApp(v))
      .catch(() => undefined);

    return () => {
      vivo = false;
    };
  }, []);

  const linhas = [
    ...(doApp
      ? [
          `${nome} ${doApp.app}`,
          `Electron ${doApp.electron}`,
          `Chromium ${doApp.chrome}`,
          doApp.sistema,
        ]
      : []),
    `Web ${__VERSAO_WEB__}`,
  ];

  const copiar = () => {
    void copiarTexto(linhas.join("\n")).then((deu) => {
      if (!deu) return;

      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    });
  };

  return (
    <Tooltip
      label={t(copiado ? "configuracoes.versoes.copiado" : "configuracoes.versoes.copiar")}
      side="top"
    >
      <button
        type="button"
        onClick={copiar}
        aria-label={t("configuracoes.versoes.copiar")}
        className="mt-1 block w-full rounded-md px-2.5 py-2 text-left text-11 leading-[1.45] text-ink-faint transition hover:bg-hover hover:text-ink-muted"
      >
        {linhas.map((linha) => (
          <span key={linha} className="block tabular-nums">
            {linha}
          </span>
        ))}
      </button>
    </Tooltip>
  );
};
