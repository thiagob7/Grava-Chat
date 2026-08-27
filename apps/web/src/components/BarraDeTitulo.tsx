import React from "react";
import { useParams } from "react-router";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { ehDesktop } from "~/lib/desktop";

/*
  Faixa de título do aplicativo, no topo de tudo — como a do Discord.

  Ela existe por um motivo prático: com a barra nativa escondida, os três botões
  do macOS ficavam flutuando SOBRE o primeiro ícone da barra de servidores. Uma
  faixa própria devolve o lugar deles, dá um alvo generoso pra arrastar a janela
  e ainda diz onde você está.

  Só aparece no aplicativo instalado. No navegador não há janela pra arrastar
  nem botão de sistema pra acomodar, e a faixa seria uma tira preta inútil.
*/
export const BarraDeTitulo: React.FC = () => {
  const { guildId } = useParams();
  const { data: guilds = [] } = useFindManyGuilds(ehDesktop());

  if (!ehDesktop()) return null;

  const atual = guilds.find((g) => g.id === guildId);

  return (
    <header className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-center border-b border-divisor bg-surface-0 px-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        {atual?.iconUrl && (
          <img src={atual.iconUrl} alt="" className="size-4 rounded" />
        )}
        {atual?.name ?? "Gravaê"}
      </span>
    </header>
  );
};
