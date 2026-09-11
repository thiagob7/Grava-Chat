import React from "react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { toast } from "react-toastify";

import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useStudio } from "~/features/configuracoes/stores/estudio";

/*
  Tema importado é cópia: entra no estúdio e para no tempo. Quem publicou
  arruma o tema, solta a versão nova, e a pessoa continua vendo a antiga sem
  nenhum sinal de que existe outra.

  Guardamos de onde o CSS veio, então dá para perguntar ao servidor e avisar.
  A comparação é do CSS inteiro, não da versão declarada, porque quase ninguém
  lembra de subir o `@version` a cada ajuste.
*/
export const VersionNewNotice: React.FC = () => {
  const originId = useStudio((s) => s.originId);
  const css = useStudio((s) => s.css);
  const doImport = useStudio((s) => s.doImport);

  const { data: published } = useTheme(originId ?? undefined);

  if (!published || published.css === css) return null;

  return (
    <div
      data-gc="configuracoes.estudio.aviso-de-versao-nova.div"
      className="flex shrink-0 items-center gap-3 border-b border-line bg-brand/10 px-6 py-2.5"
    >
      <ArrowClockwise
        data-gc="configuracoes.estudio.aviso-de-versao-nova.arrow-clockwise"
        size={16}
        className="shrink-0 text-brand"
      />

      <p data-gc="configuracoes.estudio.aviso-de-versao-nova.p" className="min-w-0 flex-1 text-xs">
        <span data-gc="configuracoes.estudio.aviso-de-versao-nova.span" className="font-medium">
          {published.name}
        </span>{" "}
        mudou desde que você importou
        {published.version ? ` — agora é a v${published.version}` : ""}. Atualizar troca o CSS que
        está aqui pelo de lá.
      </p>

      <Button
        data-gc="configuracoes.estudio.aviso-de-versao-nova.button"
        size="sm"
        variant="surface"
        onClick={() => {
          doImport({
            css: published.css,
            overrides: published.overrides,
            actives: published.actives,
            name: published.name,
            originId: published.id,
          });
          toast.success(`${published.name} atualizado.`);
        }}
      >
        Atualizar
      </Button>
    </div>
  );
};
