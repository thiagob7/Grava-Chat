import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes deixando a última vencer em conflito (padrão shadcn). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
