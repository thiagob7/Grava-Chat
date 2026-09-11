import React, { useEffect, useRef } from "react";
import { Smile } from "lucide-react";
import type { NameFont } from "@gravae/shared";

import { EmojiPicker } from "~/features/expressao/components/SeletorDeEmoji";
import { FontIcon } from "~/components/SeletorDeFonte";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { bareField, fieldGroup } from "~/components/ui/input";
import { FONTS } from "~/features/perfil/lib/catalogo";
import { loadAllFonts, fontFamily } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";

interface NameChannelPropsField {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  font: NameFont;
  onFont: (font: NameFont) => void;
  isVoice: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}

export const NameChannelField: React.FC<NameChannelPropsField> = ({
  id,
  value,
  onChange,
  font,
  onFont,
  isVoice,
  icon,
  placeholder,
  autoFocus,
  onEnter,
}) => {
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => loadAllFonts(), []);

  const normalize = (raw: string) => raw.replace(/\s+/g, isVoice ? " " : "-");

  const insertEmoji = (emoji: string) => {
    const el = field.current;
    const cut = el?.selectionStart ?? value.length;
    onChange(normalize(value.slice(0, cut) + emoji + value.slice(cut)));

    requestAnimationFrame(() => {
      el?.focus();
      const end = cut + emoji.length;
      el?.setSelectionRange(end, end);
    });
  };

  return (
    <div data-gc="servidor.campo-de-nome-de-canal.div" className={fieldGroup}>
      {icon}

      <input data-gc="servidor.campo-de-nome-de-canal.input"
        ref={field}
        id={id}
        value={value}
        maxLength={48}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(normalize(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        style={{ fontFamily: fontFamily(font) ?? undefined }}
        className={bareField}
      />

      <EmojiPicker data-gc="servidor.campo-de-nome-de-canal.emoji-picker.insert-emoji" onPick={insertEmoji}>
        <button data-gc="servidor.campo-de-nome-de-canal.button"
          type="button"
          aria-label="Emoji no nome"
          className="flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-surface-3 hover:text-ink"
        >
          <Smile data-gc="servidor.campo-de-nome-de-canal.smile" size={16} />
        </button>
      </EmojiPicker>

      <DropdownMenu data-gc="servidor.campo-de-nome-de-canal.dropdown-menu">
        <Tooltip data-gc="servidor.campo-de-nome-de-canal.tooltip" label="Fonte do nome">
          <DropdownMenuTrigger data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-trigger" asChild>
            <button data-gc="servidor.campo-de-nome-de-canal.button--2"
              type="button"
              aria-label="Fonte do nome"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded transition hover:bg-surface-3",
                font === "padrao" ? "text-ink-faint hover:text-ink" : "text-brand",
              )}
            >
              <FontIcon data-gc="servidor.campo-de-nome-de-canal.font-icon" size={16} />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>

        <DropdownMenuContent data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-content" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          {FONTS.map((option) => (
            <DropdownMenuItem data-gc="servidor.campo-de-nome-de-canal.dropdown-menu-item"
              key={option.id}
              onSelect={() => onFont(option.id)}
              className={cn("text-base", option.id === font && "text-brand")}
              style={{ fontFamily: fontFamily(option.id) ?? undefined }}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
