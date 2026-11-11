import { formatDateTime } from "@/lib/format";

/** Data da medição fornecida pela estação; não é o horário de sincronização. */
export function formatLastUpdate(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return formatDateTime(value);
}
