import React from "react";

import { Label } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

export const SettingsBlock: React.FC<{
  title: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, description, className, children }) => (
  <section data-gc="servidor.server-settings.settings-blocks.section" className={cn("border-t border-line pt-6 first:border-t-0 first:pt-0", className)}>
    <h3 data-gc="servidor.server-settings.settings-blocks.h3" className="text-base font-semibold">{title}</h3>
    {description && <p data-gc="servidor.server-settings.settings-blocks.p" className="mt-0.5 text-sm text-ink-muted">{description}</p>}
    <div data-gc="servidor.server-settings.settings-blocks.div" className="mt-5 space-y-6">{children}</div>
  </section>
);

export const SettingsField: React.FC<{
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, className, children }) => (
  <div data-gc="servidor.server-settings.settings-blocks.div--2" className={className}>
    <Label data-gc="servidor.server-settings.settings-blocks.label" htmlFor={htmlFor} className="mb-2 block text-sm font-semibold normal-case text-ink">
      {label}
    </Label>
    {children}
    {hint && <p data-gc="servidor.server-settings.settings-blocks.p--2" className="mt-2 text-xs text-ink-faint">{hint}</p>}
  </div>
);

export const SettingsToggle: React.FC<{
  title: string;
  description?: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, description, checked, disabled, onChange }) => (
  <div data-gc="servidor.server-settings.settings-blocks.div--3" className="flex items-start gap-4">
    <div data-gc="servidor.server-settings.settings-blocks.div--4" className="min-w-0 flex-1">
      <p data-gc="servidor.server-settings.settings-blocks.p--3" className="text-sm font-semibold">{title}</p>
      {description && <p data-gc="servidor.server-settings.settings-blocks.p--4" className="mt-0.5 text-sm text-ink-muted">{description}</p>}
    </div>
    <Switch data-gc="servidor.server-settings.settings-blocks.switch.on-change" checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);
