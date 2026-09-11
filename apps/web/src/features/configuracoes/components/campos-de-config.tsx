import React from "react";

import { Switch } from "~/components/ui/switch";

export const Choice: React.FC<{
  title: string;
  detail: string;
  on: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, detail, on, onChange }) => (
  <div data-gc="configuracoes.campos-de-config.div" className="mt-4 flex items-start gap-4 first:mt-0">
    <div data-gc="configuracoes.campos-de-config.div--2" className="min-w-0 flex-1">
      <p data-gc="configuracoes.campos-de-config.p" className="text-sm font-medium">{title}</p>
      <p data-gc="configuracoes.campos-de-config.p--2" className="mt-0.5 text-xs text-ink-faint">{detail}</p>
    </div>
    <Switch data-gc="configuracoes.campos-de-config.switch.on-change" checked={on} onCheckedChange={onChange} />
  </div>
);

export const Line: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div data-gc="configuracoes.campos-de-config.div--3" className="mt-4 flex items-center justify-between gap-4">
    <p data-gc="configuracoes.campos-de-config.p--3" className="text-sm font-medium">{title}</p>
    <div data-gc="configuracoes.campos-de-config.div--4" className="w-52">{children}</div>
  </div>
);

export const Selection = <T extends string>({
  title,
  detail,
  value,
  options,
  onChange,
}: {
  title: string;
  detail: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => (
  <div data-gc="configuracoes.campos-de-config.div--5" className="mt-4 first:mt-0">
    <p data-gc="configuracoes.campos-de-config.p--4" className="text-sm font-medium">{title}</p>
    <p data-gc="configuracoes.campos-de-config.p--5" className="mt-0.5 text-xs text-ink-faint">{detail}</p>

    <div data-gc="configuracoes.campos-de-config.div--6" className="mt-3 space-y-2">
      {options.map((option) => (
        <label data-gc="configuracoes.campos-de-config.label" key={option.value} className="flex items-center gap-2.5 text-sm text-ink-muted">
          <input data-gc="configuracoes.campos-de-config.input"
            type="radio"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="size-4 shrink-0 accent-brand"
          />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);
