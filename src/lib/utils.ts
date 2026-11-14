import { twMerge } from "tailwind-merge";

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[];

function flattenClasses(inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const item of inputs) {
    if (!item) continue;
    if (typeof item === "string" || typeof item === "number") {
      classes.push(String(item));
    } else if (Array.isArray(item)) {
      const nested = flattenClasses(item);
      if (nested) classes.push(nested);
    }
  }
  return classes.join(" ");
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(flattenClasses(inputs));
}
