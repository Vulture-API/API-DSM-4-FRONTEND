const TZ = "America/Sao_Paulo";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const fullDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const hourMinute = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const weekdayHour = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "short",
  hour: "2-digit",
});

export const formatDateTime = (value: string | number | Date) =>
  dateTime.format(new Date(value)).replace(",", "");
export const formatDate = (value: string | number | Date) =>
  fullDate.format(new Date(value));
export const formatHour = (value: string | number | Date) =>
  hourMinute.format(new Date(value));
export const formatWeekdayHour = (value: string | number | Date) =>
  weekdayHour.format(new Date(value));

/** "agora", "há 5 min", "há 3 h", "há 2 dias". */
export function formatRelative(value: string | Date | null, now = new Date()): string {
  if (!value) return "nunca";
  const diff = Math.max(0, now.getTime() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
export const formatNumber = (value: number) => numberFormat.format(value);

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
