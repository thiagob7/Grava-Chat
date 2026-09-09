import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const FONT_SIZES = ["10", "11", "12", "13", "14", "16", "18", "20", "24"];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: FONT_SIZES }] } },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
