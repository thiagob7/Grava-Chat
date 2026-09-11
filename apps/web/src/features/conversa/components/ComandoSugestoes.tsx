import React from "react";
import type { AvailableCommand, CommandOption } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

const signature = (options: CommandOption[]) =>
  options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(" ");

interface CommandSuggestionsProps {
  items: AvailableCommand[];
  index: number;
  onPick: (item: AvailableCommand) => void;
  onPassMouse: (index: number) => void;
}

export const CommandSuggestions: React.FC<CommandSuggestionsProps> = ({
  items,
  index,
  onPick,
  onPassMouse,
}) => {
  if (!items.length) return null;

  return (
    <div data-gc="conversa.comando-sugestoes.div" className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line">
      <p data-gc="conversa.comando-sugestoes.p" className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Comandos
      </p>

      <ul data-gc="conversa.comando-sugestoes.ul" className="max-h-72 overflow-y-auto p-1.5">
        {items.map((item, i) => (
          <li data-gc="conversa.comando-sugestoes.li" key={`${item.botId}-${item.name}`}>
            <button data-gc="conversa.comando-sugestoes.button"
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
              <span data-gc="conversa.comando-sugestoes.span" className="shrink-0 font-medium text-ink">/{item.name}</span>

              {item.options.length > 0 && (
                <span data-gc="conversa.comando-sugestoes.span--2" className="shrink-0 font-mono text-xs text-ink-faint">
                  {signature(item.options)}
                </span>
              )}

              <span data-gc="conversa.comando-sugestoes.span--3" className="min-w-0 flex-1 truncate text-xs text-ink-faint">
                {item.description}
              </span>

              <span data-gc="conversa.comando-sugestoes.span--4" className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                <Avatar data-gc="conversa.comando-sugestoes.avatar"
                  id={item.bot.id}
                  name={item.bot.displayName}
                  url={item.bot.avatarUrl}
                  size={16}
                />
                {item.bot.displayName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const CommandHint: React.FC<{
  command: AvailableCommand;
  filled: Record<string, string>;
  missing: CommandOption[];
}> = ({ command, filled, missing }) => {
  const current = command.options.find((o) => !filled[o.name]) ?? null;

  return (
    <div data-gc="conversa.comando-sugestoes.div--2" className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line">
      <div data-gc="conversa.comando-sugestoes.div--3" className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <span data-gc="conversa.comando-sugestoes.span--5" className="font-medium text-ink">/{command.name}</span>

        {command.options.map((option) => (
          <span data-gc="conversa.comando-sugestoes.span--6"
            key={option.name}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-xs transition",
              option.name === current?.name
                ? "bg-brand/20 text-brand"
                : filled[option.name]
                  ? "text-ink-muted"
                  : "text-ink-faint",
            )}
          >
            {option.required ? `<${option.name}>` : `[${option.name}]`}
          </span>
        ))}

        <span data-gc="conversa.comando-sugestoes.span--7" className="ml-auto flex items-center gap-1.5 text-xs text-ink-faint">
          <Avatar data-gc="conversa.comando-sugestoes.avatar--2"
            id={command.bot.id}
            name={command.bot.displayName}
            url={command.bot.avatarUrl}
            size={16}
          />
          {command.bot.displayName}
        </span>
      </div>

      <p data-gc="conversa.comando-sugestoes.p--2" className="border-t border-line px-3 py-1.5 text-xs text-ink-faint">
        {current ? (
          <>
            <span data-gc="conversa.comando-sugestoes.span--8" className="font-medium text-ink-muted">{current.name}</span> — {current.description}
          </>
        ) : (
          command.description
        )}
      </p>

      {missing.length > 0 && (
        <p data-gc="conversa.comando-sugestoes.p--3" className="border-t border-line bg-danger-fundo px-3 py-1.5 text-xs text-danger">
          Falta {missing.map((o) => o.name).join(", ")}.
        </p>
      )}
    </div>
  );
};
