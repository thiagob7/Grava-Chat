import { useCallback, useMemo } from "react";
import type { AvailableCommand } from "@gravae/shared";

import { useFindCommands } from "~/@core/application/queries/comando/use-find-comandos";

export function detectCommand(text: string, cursor: number) {
  if (!text.startsWith("/")) return null;

  const until = text.slice(0, cursor);
  if (until.includes(" ")) return null;

  return { term: until.slice(1) };
}

export function split(command: AvailableCommand, rest: string) {
  const options: Record<string, string> = {};
  let leftover = rest.trim();

  command.options.forEach((option, i) => {
    const last = i === command.options.length - 1;

    if (!leftover) return;

    if (last) {
      options[option.name] = leftover;
      leftover = "";
      return;
    }

    const space = leftover.search(/\s/);

    if (space < 0) {
      options[option.name] = leftover;
      leftover = "";
      return;
    }

    options[option.name] = leftover.slice(0, space);
    leftover = leftover.slice(space).trimStart();
  });

  return options;
}

export function useCommands(guildId: string | undefined) {
  const { data: commands = [] } = useFindCommands(guildId);

  const filter = useCallback(
    (term: string) => {
      const target = term.toLowerCase();

      return commands
        .filter((c) => !target || c.name.includes(target) || c.description.toLowerCase().includes(target))
        .sort((a, b) => Number(b.name.startsWith(target)) - Number(a.name.startsWith(target)))
        .slice(0, 10);
    },
    [commands],
  );

  const analyse = useCallback(
    (text: string) => {
      if (!text.startsWith("/")) return null;

      const line = text.slice(1);
      const space = line.search(/\s/);
      const name = (space < 0 ? line : line.slice(0, space)).toLowerCase();

      const command = commands.find((c) => c.name === name);
      if (!command) return null;

      const rest = space < 0 ? "" : line.slice(space + 1);
      const options = split(command, rest);

      const missing = command.options.filter((o) => o.required && !options[o.name]);

      return { command, options, missing };
    },
    [commands],
  );

  const algum = useMemo(() => commands.length > 0, [commands]);

  return { filter, analyse, algum };
}
