const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const timestamp = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(value: string) {
  return date.format(new Date(value));
}

export function formatTime(value: string) {
  return timestamp.format(new Date(value));
}
