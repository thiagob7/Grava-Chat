import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import {
  INTERACTION_RESPONSE_MS,
  selectLimits,
  type ButtonComponent,
  type ButtonStyle,
  type ComponentRow,
  type SelectComponent,
} from "@gravae/shared";

import { interactWithComponent } from "~/@core/lib/websocket/emit-message-actions";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useInteractionStore } from "~/features/conversa/stores/interaction-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const WAIT_MS = INTERACTION_RESPONSE_MS + 1500;
const ERROR_VISIBLE_MS = 6000;

const BUTTON_VARIANT: Record<ButtonStyle, React.ComponentProps<typeof Button>["variant"]> = {
  primary: "primary",
  secondary: "surface",
  success: "success",
  danger: "danger",
  link: "surface",
};

interface MessageComponentsProps {
  messageId: string;
  rows: ComponentRow[];
}

export const MessageComponents: React.FC<MessageComponentsProps> = ({ messageId, rows }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const waiting = useRef<{ interactionId: string | null; timer: number } | null>(null);
  const finished = useInteractionStore((s) => s.finished);
  const consume = useInteractionStore((s) => s.consume);

  const settle = useCallback(() => {
    if (waiting.current) window.clearTimeout(waiting.current.timer);
    waiting.current = null;
    setPending(null);
  }, []);

  useEffect(() => {
    const id = waiting.current?.interactionId;
    if (id && finished[id] && consume(id)) settle();
  }, [finished, consume, settle]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), ERROR_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => () => {
    if (waiting.current) window.clearTimeout(waiting.current.timer);
  }, []);

  const interact = async (customId: string, values?: string[]) => {
    if (pending) return;

    setError(null);
    setPending(customId);

    const timer = window.setTimeout(() => {
      settle();
      setError(t("conversa.botComponents.noResponse"));
    }, WAIT_MS);
    waiting.current = { interactionId: null, timer };

    try {
      const { interactionId } = await interactWithComponent({ messageId, customId, values });
      if (!waiting.current || waiting.current.timer !== timer) return;

      waiting.current.interactionId = interactionId;
      if (consume(interactionId)) settle();
    } catch (err) {
      if (waiting.current?.timer !== timer) return;
      settle();
      setError(err instanceof Error ? err.message : t("conversa.botComponents.noResponse"));
    }
  };

  if (!rows.length) return null;

  return (
    <div data-gc="conversa.message-components.div" className="mt-2 flex max-w-[32rem] flex-col gap-2">
      {rows.map((row, rowIndex) => (
        <div data-gc="conversa.message-components.div--2" key={rowIndex} className="flex flex-wrap gap-2">
          {row.components.map((component, index) =>
            component.type === "button" ? (
              <ComponentButton data-gc="conversa.message-components.component-button.interact"
                key={component.customId ?? `${rowIndex}-${index}`}
                button={component}
                loading={pending !== null && pending === component.customId}
                blocked={pending !== null}
                onPress={interact}
              />
            ) : (
              <ComponentSelect data-gc="conversa.message-components.component-select.interact"
                key={component.customId}
                select={component}
                loading={pending === component.customId}
                blocked={pending !== null}
                onChoose={interact}
              />
            ),
          )}
        </div>
      ))}

      {error && (
        <p data-gc="conversa.message-components.p" role="status" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

const ComponentButton: React.FC<{
  button: ButtonComponent;
  loading: boolean;
  blocked: boolean;
  onPress: (customId: string) => void;
}> = ({ button, loading, blocked, onPress }) => {
  const content = (
    <>
      {button.emoji && <span data-gc="conversa.message-components.span" aria-hidden={Boolean(button.label)}>{button.emoji}</span>}
      {button.label && <span data-gc="conversa.message-components.span--2" className="truncate">{button.label}</span>}
      {button.style === "link" && <ExternalLink data-gc="conversa.message-components.external-link" size={14} aria-hidden />}
    </>
  );

  if (button.style === "link" && button.url) {
    return (
      <Button data-gc="conversa.message-components.button" asChild variant="surface" size="sm" className={cn("max-w-full", button.disabled && "pointer-events-none opacity-50")}>
        <a data-gc="conversa.message-components.a" href={button.url} target="_blank" rel="noreferrer noopener" aria-disabled={button.disabled}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button data-gc="conversa.message-components.button--2"
      variant={BUTTON_VARIANT[button.style]}
      size="sm"
      className="max-w-full"
      loading={loading}
      disabled={button.disabled || (blocked && !loading)}
      onClick={() => button.customId && onPress(button.customId)}
    >
      {content}
    </Button>
  );
};

const ComponentSelect: React.FC<{
  select: SelectComponent;
  loading: boolean;
  blocked: boolean;
  onChoose: (customId: string, values: string[]) => void;
}> = ({ select, loading, blocked, onChoose }) => {
  const { t } = useTranslation();
  const { min, max } = selectLimits(select);
  const multiple = max > 1;
  const [chosen, setChosen] = useState<string[]>([]);
  const atOpen = useRef<string[]>([]);

  const labels = select.options.filter((option) => chosen.includes(option.value)).map((option) => option.label);

  const changeOpen = (open: boolean) => {
    if (!multiple) return;
    if (open) {
      atOpen.current = chosen;
      return;
    }

    const changed = chosen.length !== atOpen.current.length || chosen.some((value) => !atOpen.current.includes(value));
    if (changed && chosen.length >= min) onChoose(select.customId, chosen);
  };

  return (
    <DropdownMenu data-gc="conversa.message-components.dropdown-menu.change-open" onOpenChange={changeOpen}>
      <DropdownMenuTrigger data-gc="conversa.message-components.dropdown-menu-trigger" asChild disabled={select.disabled || blocked}>
        <button data-gc="conversa.message-components.button--3"
          type="button"
          aria-busy={loading}
          className={cn(
            "flex min-h-10 w-full max-w-[26rem] items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm transition",
            "hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-50",
            loading && "cursor-wait opacity-80",
          )}
        >
          <span data-gc="conversa.message-components.span--3" className={cn("min-w-0 truncate", labels.length ? "text-ink" : "text-ink-faint")}>
            {labels.length ? labels.join(", ") : (select.placeholder ?? t("conversa.botComponents.choose"))}
          </span>
          <ChevronDown data-gc="conversa.message-components.chevron-down" size={16} className="shrink-0 text-ink-muted" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent data-gc="conversa.message-components.dropdown-menu-content" align="start" className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
        {select.options.map((option) => {
          const body = (
            <span data-gc="conversa.message-components.span--4" className="flex min-w-0 items-center gap-2">
              {option.emoji && <span data-gc="conversa.message-components.span--5" aria-hidden>{option.emoji}</span>}
              <span data-gc="conversa.message-components.span--6" className="min-w-0">
                <span data-gc="conversa.message-components.span--7" className="block truncate">{option.label}</span>
                {option.description && (
                  <span data-gc="conversa.message-components.span--8" className="block truncate text-xs opacity-80">{option.description}</span>
                )}
              </span>
            </span>
          );

          if (!multiple) {
            return (
              <DropdownMenuItem data-gc="conversa.message-components.dropdown-menu-item"
                key={option.value}
                onSelect={() => {
                  setChosen([option.value]);
                  onChoose(select.customId, [option.value]);
                }}
              >
                {body}
              </DropdownMenuItem>
            );
          }

          const checked = chosen.includes(option.value);

          return (
            <DropdownMenuCheckboxItem data-gc="conversa.message-components.dropdown-menu-checkbox-item"
              key={option.value}
              checked={checked}
              disabled={!checked && chosen.length >= max}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(on) =>
                setChosen((current) => (on ? [...current, option.value] : current.filter((value) => value !== option.value)))
              }
            >
              {body}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
