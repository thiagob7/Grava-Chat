import type { ComponentRow, MessageComponent } from "@gravae/shared";
import type { Prisma } from "@prisma/client";

type StoredRow = Prisma.ComponentRowGetPayload<object>;
type StoredComponent = StoredRow["components"][number];

export const toStoredComponents = (rows: ComponentRow[]) =>
  rows.map((row) => ({
    components: row.components.map((component) =>
      component.type === "button"
        ? {
            type: "button",
            style: component.style,
            label: component.label ?? null,
            emoji: component.emoji ?? null,
            customId: component.customId ?? null,
            url: component.url ?? null,
            disabled: component.disabled ?? false,
            placeholder: null,
            minValues: null,
            maxValues: null,
            options: [],
          }
        : {
            type: "select",
            style: null,
            label: null,
            emoji: null,
            customId: component.customId,
            url: null,
            disabled: component.disabled ?? false,
            placeholder: component.placeholder ?? null,
            minValues: component.minValues ?? null,
            maxValues: component.maxValues ?? null,
            options: component.options.map((option) => ({
              label: option.label,
              value: option.value,
              description: option.description ?? null,
              emoji: option.emoji ?? null,
            })),
          },
    ),
  }));

const toComponent = (stored: StoredComponent): MessageComponent =>
  stored.type === "select"
    ? {
        type: "select",
        customId: stored.customId ?? "",
        ...(stored.placeholder ? { placeholder: stored.placeholder } : {}),
        ...(stored.minValues !== null && stored.minValues !== undefined ? { minValues: stored.minValues } : {}),
        ...(stored.maxValues !== null && stored.maxValues !== undefined ? { maxValues: stored.maxValues } : {}),
        options: stored.options.map((option) => ({
          label: option.label,
          value: option.value,
          ...(option.description ? { description: option.description } : {}),
          ...(option.emoji ? { emoji: option.emoji } : {}),
        })),
        ...(stored.disabled ? { disabled: true } : {}),
      }
    : {
        type: "button",
        style: (stored.style ?? "secondary") as Extract<MessageComponent, { type: "button" }>["style"],
        ...(stored.label ? { label: stored.label } : {}),
        ...(stored.emoji ? { emoji: stored.emoji } : {}),
        ...(stored.customId ? { customId: stored.customId } : {}),
        ...(stored.url ? { url: stored.url } : {}),
        ...(stored.disabled ? { disabled: true } : {}),
      };

export const toComponentRows = (rows: StoredRow[] | null | undefined): ComponentRow[] =>
  (rows ?? []).map((row) => ({ components: row.components.map(toComponent) }));

export const findComponent = (rows: StoredRow[] | null | undefined, customId: string) =>
  toComponentRows(rows)
    .flatMap((row) => row.components)
    .find((component) => component.customId === customId && !(component.type === "button" && component.style === "link"));
