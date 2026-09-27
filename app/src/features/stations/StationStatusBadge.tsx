import { Badge, type Tone } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

import type { StationStatus } from "./api";

const tone: Record<StationStatus, Tone> = { Online: "ok", "Com alerta": "warn", Offline: "danger" };

/** Cor do ponto/pino de cada status (mapa, listas, barra de proporção). */
export const STATUS_COLOR: Record<StationStatus, string> = {
  Online: "var(--color-dot-ok)",
  "Com alerta": "var(--color-dot-warn)",
  Offline: "var(--color-dot-danger)",
};

export function StationStatusBadge({ status, alerts = 0 }: { status: StationStatus; alerts?: number }) {
  return (
    <Badge tone={tone[status]} dot pulse={status === "Online"}>
      {status}
      {alerts > 0 && (
        <span className="tabular-nums">
          {" "}
          · {alerts} {alerts === 1 ? "pendente" : "pendentes"}
        </span>
      )}
    </Badge>
  );
}

/** Ponto de status para listas densas. É só visual: quem usa põe o status em texto (sr-only). */
export function StatusDot({ status, className }: { status: StationStatus; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5 shrink-0", className)} aria-hidden>
      {status === "Online" && (
        <span
          className="absolute inset-0 rounded-full motion-safe:animate-[station-ping_1.8s_ease-out_infinite]"
          style={{ background: STATUS_COLOR[status] }}
          aria-hidden
        />
      )}
      <span className="relative inline-flex size-2.5 rounded-full ring-2 ring-white" style={{ background: STATUS_COLOR[status] }} aria-hidden />
    </span>
  );
}
