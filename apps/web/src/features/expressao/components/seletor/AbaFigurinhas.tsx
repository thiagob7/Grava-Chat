import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { Sticker } from "@gravae/shared";

import {
  BarSide,
  ServerIcon,
  Footer,
  Section,
  Empty,
  type BarShortcut,
} from "~/features/expressao/components/seletor/pecas";
import { useCollapse } from "~/features/expressao/components/seletor/use-colapso";
import { useSections } from "~/features/expressao/components/seletor/use-secoes";
import { useServers } from "~/features/expressao/components/seletor/use-servidores";
import { recentStickers, registerSticker } from "~/features/expressao/lib/expressoes-recentes";

type WithAuthor = Sticker & { createdBy: { displayName: string } | null };

interface Pointed {
  sticker: WithAuthor;
  server: { name: string; iconUrl: string | null };
}

export const TabStickers: React.FC<{
  guildId: string | undefined;
  search: string;
  onSticker: (s: Sticker) => void;
}> = ({ guildId, search, onSticker }) => {
  const servers = useServers(guildId);
  const [recent, setRecent] = useState<string[]>(() => recentStickers());
  const [pointed, setPointed] = useState<Pointed | null>(null);
  const { container, register, irFor, onScroll, active } = useSections();
  const { closed, toggle, open } = useCollapse("figurinhas");

  useEffect(onScroll, [closed, onScroll]);

  const irOpen = (id: string) => {
    open(id);
    irFor(id);
  };

  const term = search.toLowerCase().trim();

  const matches = (s: Sticker) =>
    s.name.toLowerCase().includes(term) || s.relatedEmoji.includes(term);

  const withSticker = servers
    .map((s) => ({ ...s, stickers: term ? s.stickers.filter(matches) : s.stickers }))
    .filter((s) => s.stickers.length);

  const used = term
    ? []
    : recent.flatMap((id) => {
        for (const server of withSticker) {
          const match = server.stickers.find((f) => f.id === id);
          if (match) return [{ sticker: match, server }];
        }
        return [];
      });

  const pick = (sticker: WithAuthor) => {
    registerSticker(sticker.id);
    setRecent(recentStickers());
    onSticker(sticker);
  };

  if (!servers.some((s) => s.stickers.length)) {
    return (
      <div data-gc="expressao.seletor.aba-figurinhas.div" className="flex min-h-0 flex-1 flex-col">
        <Empty data-gc="expressao.seletor.aba-figurinhas.empty">
          Nenhum dos seus servidores tem figurinhas. Quem gerencia expressões pode subir até 5 em
          Configurações do servidor.
        </Empty>
      </div>
    );
  }

  const shortcuts: BarShortcut[] = [
    ...(used.length
      ? [{ id: "recentes", title: "Utilizadas com frequência", icon: <Clock data-gc="expressao.seletor.aba-figurinhas.clock" size={18} /> }]
      : []),
    ...withSticker.map((s) => ({
      id: `servidor:${s.id}`,
      title: s.name,
      icon: <ServerIcon data-gc="expressao.seletor.aba-figurinhas.server-icon" name={s.name} iconUrl={s.iconUrl} />,
    })),
  ];

  return (
    <div data-gc="expressao.seletor.aba-figurinhas.div--2" className="flex min-h-0 flex-1 flex-col">
      <div data-gc="expressao.seletor.aba-figurinhas.div--3" className="flex min-h-0 flex-1">
        <BarSide data-gc="expressao.seletor.aba-figurinhas.bar-side.ir-open" shortcuts={shortcuts} active={active} onIr={irOpen} />

        <div data-gc="expressao.seletor.aba-figurinhas.div.on-scroll"
          ref={container}
          onScroll={onScroll}
          onMouseLeave={() => setPointed(null)}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {used.length > 0 && (
            <div data-gc="expressao.seletor.aba-figurinhas.div--4" ref={register("recentes")}>
              <Section data-gc="expressao.seletor.aba-figurinhas.section"
                title="Utilizadas com frequência"
                icon={<Clock data-gc="expressao.seletor.aba-figurinhas.clock--2" size={12} />}
                closed={closed.has("recentes")}
                onToggle={() => toggle("recentes")}
              >
                <Grid data-gc="expressao.seletor.aba-figurinhas.grid.pick" items={used} onPick={pick} onPoint={setPointed} />
              </Section>
            </div>
          )}

          {withSticker.map((server) => (
            <div data-gc="expressao.seletor.aba-figurinhas.div--5" key={server.id} ref={register(`servidor:${server.id}`)}>
              <Section data-gc="expressao.seletor.aba-figurinhas.section--2"
                title={server.name}
                icon={
                  <ServerIcon data-gc="expressao.seletor.aba-figurinhas.server-icon--2"
                    name={server.name}
                    iconUrl={server.iconUrl}
                    className="size-4"
                  />
                }
                closed={closed.has(`servidor:${server.id}`)}
                onToggle={() => toggle(`servidor:${server.id}`)}
              >
                <Grid data-gc="expressao.seletor.aba-figurinhas.grid.pick--2"
                  items={server.stickers.map((sticker) => ({ sticker, server }))}
                  onPick={pick}
                  onPoint={setPointed}
                />
              </Section>
            </div>
          ))}

          {!withSticker.length && <Empty data-gc="expressao.seletor.aba-figurinhas.empty--2">Nenhuma figurinha com esse nome.</Empty>}
        </div>
      </div>

      <Footer data-gc="expressao.seletor.aba-figurinhas.footer"
        sample={
          pointed && (
            <img data-gc="expressao.seletor.aba-figurinhas.img" src={pointed.sticker.url} alt="" className="size-7 rounded object-contain" />
          )
        }
        title={pointed?.sticker.name}
        detail={pointed ? `de ${pointed.server.name}` : undefined}
        right={
          pointed && (
            <ServerIcon data-gc="expressao.seletor.aba-figurinhas.server-icon--3"
              name={pointed.server.name}
              iconUrl={pointed.server.iconUrl}
              className="size-6"
            />
          )
        }
        empty="Passe o mouse para ver o nome"
      />
    </div>
  );
};

const Grid: React.FC<{
  items: Pointed[];
  onPick: (s: WithAuthor) => void;
  onPoint: (a: Pointed) => void;
}> = ({ items, onPick, onPoint }) => (
  <div data-gc="expressao.seletor.aba-figurinhas.div--6" className="grid grid-cols-3 gap-2">
    {items.map(({ sticker, server }) => (
      <button data-gc="expressao.seletor.aba-figurinhas.button"
        key={sticker.id}
        onClick={() => onPick(sticker)}
        onMouseEnter={() => onPoint({ sticker, server })}
        onFocus={() => onPoint({ sticker, server })}
        className="aspect-square rounded-lg p-1.5 transition hover:bg-surface-3"
      >
        <img data-gc="expressao.seletor.aba-figurinhas.img--2"
          src={sticker.url}
          alt={sticker.name}
          loading="lazy"
          className="size-full object-contain"
        />
      </button>
    ))}
  </div>
);
