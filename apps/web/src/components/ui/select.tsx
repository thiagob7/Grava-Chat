import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "~/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-campo px-3 text-sm text-ink shadow-xs outline-none transition-colors",
      "focus-visible:border-campo-foco data-[placeholder]:text-ink-faint",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1 [&>span]:text-left",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon data-gc="ui.select.select-primitiveicon" asChild>
      <ChevronDown data-gc="ui.select.chevron-down" size={16} className="shrink-0 text-ink-faint" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);

const BotaoDeRolagem = ({
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) => (
  <div data-gc="ui.select.div"
    className="flex cursor-default items-center justify-center py-1 text-ink-faint"
    {...props}
  >
    {children}
  </div>
);

export const SelectContent = ({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content data-gc="ui.select.select-primitivecontent"
      position={position}
      className={cn(
        "regiao-sem-arrasto z-[60] max-h-[var(--radix-select-content-available-height)] min-w-[8rem] overflow-hidden rounded-lg border border-white/5 bg-surface-2 shadow-2xl",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton data-gc="ui.select.select-primitivescroll-up-button" asChild>
        <BotaoDeRolagem data-gc="ui.select.botao-de-rolagem">
          <ChevronUp data-gc="ui.select.chevron-up" size={14} />
        </BotaoDeRolagem>
      </SelectPrimitive.ScrollUpButton>

      <SelectPrimitive.Viewport data-gc="ui.select.select-primitiveviewport"
        className={cn(
          "p-1",
          position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>

      <SelectPrimitive.ScrollDownButton data-gc="ui.select.select-primitivescroll-down-button" asChild>
        <BotaoDeRolagem data-gc="ui.select.botao-de-rolagem--2">
          <ChevronDown data-gc="ui.select.chevron-down--2" size={14} />
        </BotaoDeRolagem>
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);

export const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item data-gc="ui.select.select-primitiveitem"
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-8 text-sm text-ink outline-none transition-colors",
      "focus:bg-surface-3 data-[state=checked]:text-brand",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText data-gc="ui.select.select-primitiveitem-text">{children}</SelectPrimitive.ItemText>
    <span data-gc="ui.select.span" className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator data-gc="ui.select.select-primitiveitem-indicator">
        <Check data-gc="ui.select.check" size={14} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
);

export const SelectSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) => (
  <SelectPrimitive.Separator data-gc="ui.select.select-primitiveseparator"
    className={cn("-mx-1 my-1 h-px bg-line", className)}
    {...props}
  />
);

interface CampoSelectProps<T extends string | number> {
  id?: string;
  valor: T;
  onEscolher: (valor: T) => void;
  opcoes: { valor: T; rotulo: React.ReactNode }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const VAZIO = "__vazio__";

export function CampoSelect<T extends string | number>({
  id,
  valor,
  onEscolher,
  opcoes,
  placeholder,
  disabled,
  className,
}: CampoSelectProps<T>) {
  const numerico = typeof valor === "number";
  const paraRadix = (v: T) => (String(v) === "" ? VAZIO : String(v));

  return (
    <Select data-gc="ui.select.select"
      value={paraRadix(valor)}
      disabled={disabled}
      onValueChange={(bruto) => {
        const limpo = bruto === VAZIO ? "" : bruto;
        onEscolher((numerico ? Number(limpo) : limpo) as T);
      }}
    >
      <SelectTrigger data-gc="ui.select.select-trigger" id={id} className={className}>
        <SelectValue data-gc="ui.select.select-value" placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent data-gc="ui.select.select-content">
        {opcoes.map((o) => (
          <SelectItem data-gc="ui.select.select-item" key={String(o.valor)} value={paraRadix(o.valor)}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
