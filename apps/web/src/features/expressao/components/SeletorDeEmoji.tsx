import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Clock, Loader2, Search, Smile } from "lucide-react";

import { Emoji } from "~/features/expressao/components/Emoji";
import { GROUP_ICONS } from "~/features/expressao/components/icones-de-grupo";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  loadEmojis,
  matches,
  recentEmojis,
  registerUse,
  type EmojiGroup,
} from "~/features/expressao/lib/emoji";

interface EmojiPropsPicker {
  children: ReactNode;
  onPick: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPropsPicker> = ({
  children,
  onPick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover data-gc="expressao.seletor-de-emoji.popover.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger data-gc="expressao.seletor-de-emoji.popover-trigger" asChild>{children}</PopoverTrigger>

      <PopoverContent data-gc="expressao.seletor-de-emoji.popover-content" side="bottom" align="start" portal={false} className="w-[22rem] p-0">
        {isOpen && (
          <Grid data-gc="expressao.seletor-de-emoji.grid"
            onPick={(emoji) => {
              registerUse(emoji);
              onPick(emoji);
              setIsOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};

const Grid: React.FC<{ onPick: (emoji: string) => void }> = ({
  onPick,
}) => {
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const recent = useMemo(() => recentEmojis(), []);
  const scroll = useRef<HTMLDivElement>(null);

  const irFor = (slug: string) => {
    const target = scroll.current?.querySelector<HTMLElement>(`[data-secao="${slug}"]`);
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  useEffect(() => {
    void loadEmojis().then(setGroups);
  }, []);

  const filtered = useMemo(() => {
    if (!groups) return [];
    if (!search.trim()) return groups;

    return groups
      .map((g) => ({ ...g, emojis: g.emojis.filter((e) => matches(e, search)) }))
      .filter((g) => g.emojis.length);
  }, [groups, search]);

  return (
    <div data-gc="expressao.seletor-de-emoji.div" className="flex max-h-80 flex-col">
      <div data-gc="expressao.seletor-de-emoji.div--2" className="flex shrink-0 items-center gap-2 border-b border-line px-3">
        <Search data-gc="expressao.seletor-de-emoji.search" size={14} className="shrink-0 text-ink-faint" />
        <Input data-gc="expressao.seletor-de-emoji.input"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar emoji"
          className="bg-transparent px-0 focus:ring-0"
        />
      </div>

      <div data-gc="expressao.seletor-de-emoji.div--3" className="flex min-h-0 flex-1">
        {!search.trim() && groups && (
          <nav data-gc="expressao.seletor-de-emoji.nav" className="flex w-11 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-r border-line py-2">
            {recent.length > 0 && (
              <GroupButton data-gc="expressao.seletor-de-emoji.group-button" title="Usados com frequência" onClick={() => irFor("recentes")}>
                <Clock data-gc="expressao.seletor-de-emoji.clock" size={18} />
              </GroupButton>
            )}

            {groups.map((group) => (
              <GroupButton data-gc="expressao.seletor-de-emoji.group-button--2"
                key={group.slug}
                title={group.title}
                onClick={() => irFor(group.slug)}
              >
                {GROUP_ICONS[group.slug] ?? <Smile data-gc="expressao.seletor-de-emoji.smile" size={18} />}
              </GroupButton>
            ))}
          </nav>
        )}

      <div data-gc="expressao.seletor-de-emoji.div--4" ref={scroll} className="min-h-0 flex-1 overflow-y-auto p-2">
        {!groups && (
          <div data-gc="expressao.seletor-de-emoji.div--5" className="flex justify-center py-10 text-ink-faint">
            <Loader2 data-gc="expressao.seletor-de-emoji.loader2" size={20} className="animate-spin" />
          </div>
        )}

        {!search.trim() && recent.length > 0 && (
          <Section data-gc="expressao.seletor-de-emoji.section" slug="recentes" title="Usados com frequência" icon={<Clock data-gc="expressao.seletor-de-emoji.clock--2" size={12} />}>
            {recent.map((emoji) => (
              <Button data-gc="expressao.seletor-de-emoji.button"
                key={emoji}
                emoji={emoji}
                onClick={() => onPick(emoji)}
              />
            ))}
          </Section>
        )}

        {filtered.map((group) => (
          <Section data-gc="expressao.seletor-de-emoji.section--2" key={group.slug} slug={group.slug} title={group.title}>
            {group.emojis.map((item) => (
              <Button data-gc="expressao.seletor-de-emoji.button--2"
                key={item.slug}
                emoji={item.emoji}
                title={item.name}
                onClick={() => onPick(item.emoji)}
              />
            ))}
          </Section>
        ))}

        {groups && !filtered.length && (
          <p data-gc="expressao.seletor-de-emoji.p" className="py-10 text-center text-sm text-ink-faint">
            Nenhum emoji com esse nome.
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

const GroupButton: React.FC<{ title: string; onClick: () => void; children: ReactNode }> = ({
  title,
  onClick,
  children,
}) => (
  <button data-gc="expressao.seletor-de-emoji.button.on-click"
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="flex size-8 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-surface-3 hover:text-ink"
  >
    {children}
  </button>
);

const Section: React.FC<{
  slug: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}> = ({ slug, title, icon, children }) => (
  <section data-gc="expressao.seletor-de-emoji.section--3" data-secao={slug} className="mb-2">
    <p data-gc="expressao.seletor-de-emoji.p--2" className="mb-1 flex items-center gap-1 px-1 text-11 font-semibold uppercase tracking-wide text-ink-faint">
      {icon} {title}
    </p>
    <div data-gc="expressao.seletor-de-emoji.div--6" className="grid grid-cols-8 gap-0.5">{children}</div>
  </section>
);

const Button: React.FC<{
  emoji: string;
  title?: string;
  onClick: () => void;
}> = ({ emoji, title, onClick }) => (
  <button data-gc="expressao.seletor-de-emoji.button.on-click--2"
    onClick={onClick}
    title={title}
    className="flex size-8 items-center justify-center rounded transition hover:bg-surface-3"
  >
    <Emoji data-gc="expressao.seletor-de-emoji.emoji" emoji={emoji} className="size-6" />
  </button>
);
