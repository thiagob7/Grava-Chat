import React, { useEffect, useState } from "react";
import type { AppVersions } from "@gravae/shared";

import { Tooltip } from "~/components/ui/tooltip";
import { copyText } from "~/lib/copiar";
import { desktop } from "~/lib/desktop";
import { useTranslation } from "~/traducao";

declare const __VERSION_WEB__: string;

export const VersionsFooter: React.FC = () => {
  const { t } = useTranslation();
  const [fromApp, setDoApp] = useState<AppVersions | null>(null);
  const name = desktop()?.nameSystem ?? "Gravaê";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const askFor = desktop()?.versions;
    if (!askFor) return;

    let live = true;

    void askFor()
      .then((v) => live && setDoApp(v))
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, []);

  const lines = [
    ...(fromApp
      ? [
          `${name} ${fromApp.app}`,
          `Electron ${fromApp.electron}`,
          `Chromium ${fromApp.chrome}`,
          fromApp.system,
        ]
      : []),
    `Web ${__VERSION_WEB__}`,
  ];

  const copy = () => {
    void copyText(lines.join("\n")).then((gave) => {
      if (!gave) return;

      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const policies = [
    { url: import.meta.env.VITE_TERMS_URL as string | undefined, key: "configuracoes.versoes.termos" },
    { url: import.meta.env.VITE_PRIVACY_URL as string | undefined, key: "configuracoes.versoes.privacidade" },
  ].filter((item): item is { url: string; key: string } => Boolean(item.url));

  return (
    <>
    <Tooltip data-gc="configuracoes.rodape-de-versoes.tooltip"
      label={t(copied ? "configuracoes.versoes.copiado" : "configuracoes.versoes.copiar")}
      side="top"
    >
      <button data-gc="configuracoes.rodape-de-versoes.button.copy"
        type="button"
        onClick={copy}
        aria-label={t("configuracoes.versoes.copiar")}
        className="mt-1 block w-full rounded-md px-2.5 py-2 text-left text-11 leading-[1.45] text-ink-faint transition hover:bg-hover hover:text-ink-muted"
      >
        {lines.map((line) => (
          <span data-gc="configuracoes.rodape-de-versoes.span" key={line} className="block tabular-nums">
            {line}
          </span>
        ))}
      </button>
    </Tooltip>

    {policies.length > 0 && (
      <p data-gc="configuracoes.rodape-de-versoes.p" className="mt-1 flex flex-col gap-0.5 px-2.5 text-11 leading-[1.45]">
        {policies.map((item) => (
          <a data-gc="configuracoes.rodape-de-versoes.a"
            key={item.key}
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-link transition hover:underline"
          >
            {t(item.key)}
          </a>
        ))}
      </p>
    )}
    </>
  );
};
