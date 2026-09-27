import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative } from "@/lib/format";

/** A partir de quanto tempo sem dados a estação ganha o indicativo de falha (SCRUM-372). */
export const COMMUNICATION_ALERT_MINUTES = 60;

/**
 * Texto do atraso de comunicação ("Sem comunicação há 2 h e 5 min"), ou null
 * se a estação comunicou dentro do limite.
 */
export function communicationDelay(
  lastCommunicationAt: string | null,
  now = new Date(),
  thresholdMinutes = COMMUNICATION_ALERT_MINUTES,
): string | null {
  if (!lastCommunicationAt) return "Sem registro de comunicação";
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(lastCommunicationAt).getTime()) / 60_000));
  if (minutes <= thresholdMinutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 48) return `Sem comunicação há ${Math.floor(hours / 24)} dias`;
  return `Sem comunicação há ${hours} h${rest > 0 ? ` e ${rest} min` : ""}`;
}

/** Última comunicação da estação, com ícone e texto de alerta quando passou do limite. */
export function LastCommunication({
  lastCommunicationAt,
  className,
}: {
  lastCommunicationAt: string | null;
  className?: string;
}) {
  const delay = communicationDelay(lastCommunicationAt);
  const title = lastCommunicationAt ? formatDateTime(lastCommunicationAt) : undefined;
  if (!delay) {
    return (
      <span className={cn("text-muted", className)} title={title}>
        {formatRelative(lastCommunicationAt)}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium text-danger", className)} title={title}>
      <TriangleAlert className="size-4 shrink-0" aria-hidden />
      {delay}
    </span>
  );
}
