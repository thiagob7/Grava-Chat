import React from "react";
import { useMatch } from "react-router";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { ehDesktop } from "~/lib/desktop";
import { avatarColor, initials } from "~/lib/format";

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
  /*
    `useMatch`, e não `useParams`: a faixa mora ao lado do `<Routes>`, não
    dentro dele, e fora de uma rota casada o `useParams` devolve um objeto
    vazio. O `guildId` vinha sempre `undefined`, então a faixa mostrava o nome
    de reserva e nunca o logotipo — o que só não saltava aos olhos porque o
    servidor de teste também se chama Gravaê.
  */
  const rota = useMatch("/channels/:guildId/*");
  const { data: guilds = [] } = useFindManyGuilds(ehDesktop());

  if (!ehDesktop()) return null;

  const atual = guilds.find((g) => g.id === rota?.params.guildId);

  return (
    <header className="regiao-de-arrasto flex h-8 shrink-0 items-center justify-center border-b border-divisor bg-surface-0 px-2">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
        {atual ? (
          <>
            {/*
              Servidor sem foto ainda tem logotipo: as iniciais na cor dele, do
              mesmo jeito que na coluna de servidores e na página de convite.
            */}
            {atual.iconUrl ? (
              <img src={atual.iconUrl} alt="" className="size-4 shrink-0 rounded object-cover" />
            ) : (
              <span
                aria-hidden
                className="flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                style={{ backgroundColor: avatarColor(atual.id) }}
              >
                {initials(atual.name)}
              </span>
            )}
            <span className="truncate">{atual.name}</span>
          </>
        ) : (
          "Gravaê"
        )}
      </span>
    </header>
  );
};
