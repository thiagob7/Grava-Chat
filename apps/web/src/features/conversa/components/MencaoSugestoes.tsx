import React from "react";
import { AtSign, Users } from "lucide-react";

import { Avatar } from "~/features/perfil/components/Avatar";
import type { Mentionable } from "~/features/conversa/hooks/use-mencoes";
import { readable } from "~/features/perfil/lib/contraste";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-de-tema";

interface MentionSuggestionsProps {
  items: Mentionable[];
  index: number;
  onPick: (item: Mentionable) => void;
  onPassMouse: (index: number) => void;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  items,
  index,
  onPick,
  onPassMouse,
}) => {
  if (!items.length) return null;

  return (
    <div data-gc="conversa.mencao-sugestoes.div" {...flx("suggestions", "absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line")}>
      <p data-gc="conversa.mencao-sugestoes.p" className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Membros e cargos
      </p>

      <ul data-gc="conversa.mencao-sugestoes.ul" className="max-h-72 overflow-y-auto p-1.5">
        {items.map((item, i) => (
          <li data-gc="conversa.mencao-sugestoes.li" key={`${item.kind}-${item.id}`}>
            <button data-gc="conversa.mencao-sugestoes.button"
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(item);
              }}
              onMouseEnter={() => onPassMouse(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                i === index ? "bg-surface-3 text-ink" : "text-ink-muted",
              )}
            >
              {item.kind === "usuario" ? (
                <Avatar data-gc="conversa.mencao-sugestoes.avatar" id={item.id} name={item.name} url={item.avatarUrl} size={20} />
              ) : (
                <span data-gc="conversa.mencao-sugestoes.span"
                  className="flex size-5 items-center justify-center rounded-full bg-surface-3"
                  style={item.color ? { color: readable(item.color) } : undefined}
                >
                  {item.kind === "cargo" ? <Users data-gc="conversa.mencao-sugestoes.users" size={12} /> : <AtSign data-gc="conversa.mencao-sugestoes.at-sign" size={12} />}
                </span>
              )}

              <span data-gc="conversa.mencao-sugestoes.span--2"
                className="min-w-0 truncate font-medium"
                style={item.color ? { color: readable(item.color) } : undefined}
              >
                {item.name}
              </span>

              {item.detail && (
                <span data-gc="conversa.mencao-sugestoes.span--3" className="min-w-0 truncate text-xs text-ink-faint">{item.detail}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
