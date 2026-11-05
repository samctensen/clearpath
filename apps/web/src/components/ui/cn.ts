/** Joins class names, dropping the falsy branches of conditional variants. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
