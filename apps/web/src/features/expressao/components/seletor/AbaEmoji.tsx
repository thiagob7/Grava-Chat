import React, { useEffect, useMemo, useState } from "react";
import { Clock, Smile } from "lucide-react";

import {
  BarSide,
  Loading,
  ServerIcon,
  Footer,
  Section,
  Empty,
  type BarShortcut,
} from "~/features/expressao/components/seletor/pecas";
import { Emoji } from "~/features/expressao/components/Emoji";
import { GROUP_ICONS } from "~/features/expressao/components/icones-de-grupo";
import { useCollapse } from "~/features/expressao/components/seletor/use-colapso";
import { useSections } from "~/features/expressao/components/seletor/use-secoes";
import { useServers } from "~/features/expressao/components/seletor/use-servidores";
import {
  loadEmojis,
  matches,
  recentEmojis,
  registerUse,
  type EmojiGroup,
} from "~/features/expressao/lib/emoji";

interface Pointed {
  sample: React.ReactNode;
  title: string;
  detail?: string;
  right?: React.ReactNode;
}

export const TabEmoji: React.FC<{
  guildId: string | undefined;
  search: string;
  onEmoji: (text: string) => void;
}> = ({ guildId, search, onEmoji }) => {
  const servers = useServers(guildId);
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [recent, setRecent] = useState<string[]>(() => recentEmojis());
  const [pointed, setPointed] = useState<Pointed | null>(null);
  const { container, register, irFor, onScroll, active } = useSections();
  const { closed, toggle, open } = useCollapse("emoji");

  useEffect(() => {
    void loadEmojis().then(setGroups);
  }, []);

  useEffect(onScroll, [closed, onScroll]);

  const irOpen = (id: string) => {
    open(id);
    irFor(id);
  };

  const pick = (text: string, unicode: boolean) => {
    if (unicode) {
      registerUse(text);
      setRecent(recentEmojis());
    }
    onEmoji(text);
  };

  const term = search.trim();
  const termTiny = term.toLowerCase();

  const filtered = useMemo(() => {
    if (!groups) return [];
    if (!term) return groups;

    return groups
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => matches(e, term)) }))
      .filter((g) => g.emojis.length);
  }, [groups, term]);

  const withEmoji = servers
    .map((s) => ({
      ...s,
      emojis: term
        ? s.emojis.filter((e) => e.name.toLowerCase().includes(termTiny))
        : s.emojis,
    }))
    .filter((s) => s.emojis.length);

  const recentShows = !term && recent.length > 0;

  const shortcuts: BarShortcut[] = [
    ...(recentShows
      ? [{ id: "recentes", title: "Usados com frequência", icon: <Clock data-gc="expressao.seletor.aba-emoji.clock" size={18} /> }]
      : []),
    ...withEmoji.map((s) => ({
      id: `servidor:${s.id}`,
      title: s.name,
      icon: <ServerIcon data-gc="expressao.seletor.aba-emoji.server-icon" name={s.name} iconUrl={s.iconUrl} />,
    })),
    ...filtered.map((g) => ({
      id: g.slug,
      title: g.title,
      icon: GROUP_ICONS[g.slug] ?? <Smile data-gc="expressao.seletor.aba-emoji.smile" size={18} />,
    })),
  ];

  const nothing = Boolean(groups) && !filtered.length && !withEmoji.length;

  return (
    <div data-gc="expressao.seletor.aba-emoji.div" className="flex min-h-0 flex-1 flex-col">
      <div data-gc="expressao.seletor.aba-emoji.div--2" className="flex min-h-0 flex-1">
        <BarSide data-gc="expressao.seletor.aba-emoji.bar-side.ir-open" shortcuts={shortcuts} active={active} onIr={irOpen} />

        <div data-gc="expressao.seletor.aba-emoji.div.on-scroll"
          ref={container}
          onScroll={onScroll}
          onMouseLeave={() => setPointed(null)}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {recentShows && (
            <div data-gc="expressao.seletor.aba-emoji.div--3" ref={register("recentes")}>
              <Section data-gc="expressao.seletor.aba-emoji.section"
                title="Usados com frequência"
                icon={<Clock data-gc="expressao.seletor.aba-emoji.clock--2" size={12} />}
                closed={closed.has("recentes")}
                onToggle={() => toggle("recentes")}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--4" className="flex flex-wrap gap-0.5">
                  {recent.map((emoji) => (
                    <ButtonEmoji data-gc="expressao.seletor.aba-emoji.button-emoji"
                      key={emoji}
                      emoji={emoji}
                      onClick={() => pick(emoji, true)}
                      onPoint={() => setPointed({ sample: <Emoji data-gc="expressao.seletor.aba-emoji.emoji" emoji={emoji} className="size-7" />, title: emoji })}
                    />
                  ))}
                </div>
              </Section>
            </div>
          )}

          {withEmoji.map((server) => (
            <div data-gc="expressao.seletor.aba-emoji.div--5" key={server.id} ref={register(`servidor:${server.id}`)}>
              <Section data-gc="expressao.seletor.aba-emoji.section--2"
                title={server.name}
                icon={
                  <ServerIcon data-gc="expressao.seletor.aba-emoji.server-icon--2"
                    name={server.name}
                    iconUrl={server.iconUrl}
                    className="size-4"
                  />
                }
                closed={closed.has(`servidor:${server.id}`)}
                onToggle={() => toggle(`servidor:${server.id}`)}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--6" className="flex flex-wrap gap-0.5">
                  {server.emojis.map((emoji) => (
                    <button data-gc="expressao.seletor.aba-emoji.button"
                      key={emoji.id}
                      onClick={() => pick(`:${emoji.name}:`, false)}
                      onMouseEnter={() =>
                        setPointed({
                          sample: (
                            <img data-gc="expressao.seletor.aba-emoji.img" src={emoji.url} alt="" className="size-7 object-contain" />
                          ),
                          title: `:${emoji.name}:`,
                          detail: `de ${server.name}`,
                          right: (
                            <ServerIcon data-gc="expressao.seletor.aba-emoji.server-icon--3"
                              name={server.name}
                              iconUrl={server.iconUrl}
                              className="size-6"
                            />
                          ),
                        })
                      }
                      className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
                    >
                      <img data-gc="expressao.seletor.aba-emoji.img--2" src={emoji.url} alt={emoji.name} className="size-7 object-contain" />
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          ))}

          {!groups && <Loading data-gc="expressao.seletor.aba-emoji.loading" />}

          {filtered.map((group) => (
            <div data-gc="expressao.seletor.aba-emoji.div--7" key={group.slug} ref={register(group.slug)}>
              <Section data-gc="expressao.seletor.aba-emoji.section--3"
                title={group.title}
                closed={closed.has(group.slug)}
                onToggle={() => toggle(group.slug)}
              >
                <div data-gc="expressao.seletor.aba-emoji.div--8" className="flex flex-wrap gap-0.5">
                  {group.emojis.map((item) => (
                    <ButtonEmoji data-gc="expressao.seletor.aba-emoji.button-emoji--2"
                      key={item.slug}
                      emoji={item.emoji}
                      onClick={() => pick(item.emoji, true)}
                      onPoint={() =>
                        setPointed({
                          sample: <Emoji data-gc="expressao.seletor.aba-emoji.emoji--2" emoji={item.emoji} className="size-7" />,
                          title: `:${item.slug}:`,
                          detail: item.name,
                        })
                      }
                    />
                  ))}
                </div>
              </Section>
            </div>
          ))}

          {nothing && <Empty data-gc="expressao.seletor.aba-emoji.empty">Nenhum emoji com esse nome.</Empty>}
        </div>
      </div>

      <Footer data-gc="expressao.seletor.aba-emoji.footer"
        sample={pointed?.sample}
        title={pointed?.title}
        detail={pointed?.detail}
        right={pointed?.right}
        empty="Passe o mouse para ver o nome"
      />
    </div>
  );
};

const ButtonEmoji: React.FC<{ emoji: string; onClick: () => void; onPoint: () => void }> = ({
  emoji,
  onClick,
  onPoint,
}) => (
  <button data-gc="expressao.seletor.aba-emoji.button.on-click"
    onClick={onClick}
    onMouseEnter={onPoint}
    onFocus={onPoint}
    className="flex size-9 items-center justify-center rounded transition hover:bg-surface-3"
  >
    <Emoji data-gc="expressao.seletor.aba-emoji.emoji--3" emoji={emoji} className="size-7" />
  </button>
);
