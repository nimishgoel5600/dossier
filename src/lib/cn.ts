export type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values: `cn("a", active && "b")`. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
