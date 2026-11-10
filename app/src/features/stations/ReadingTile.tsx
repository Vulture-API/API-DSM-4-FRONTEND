import { sensorVisual } from "@/features/sensor-visual";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

import type { CurrentReading } from "./api";

export function ReadingTile({ reading, now }: { reading: CurrentReading; now: number }) {
  const visual = sensorVisual(reading.sensor_type);
  const hasValue = reading.value !== null && Number.isFinite(reading.value);
  const hasTime = reading.unix_time !== null && Number.isFinite(reading.unix_time) && Number.isFinite(new Date(reading.unix_time! * 1000).getTime());
  return (
    <div className="flex min-w-[150px] flex-1 flex-col border-b border-l border-line p-5">
      <p className="flex items-start gap-2 text-[13px] leading-snug font-medium text-muted">
        <visual.icon className="mt-px size-4 shrink-0" style={{ color: visual.color }} aria-hidden />
        {reading.sensor_type}
      </p>
      <p className="mt-auto pt-2 text-[26px] leading-none font-semibold tracking-tight tabular-nums">
        {!hasValue ? "Sem leitura" : formatNumber(reading.value!)}
        <span className="ml-1 text-sm font-medium text-muted">{hasValue && reading.unit_of_measure}</span>
      </p>
      <p className="mt-2 text-xs text-faint">
        {!hasTime ? "Aguardando medição" : (
          <span title={formatDateTime(new Date(reading.unix_time! * 1000))}>
            {formatRelative(new Date(reading.unix_time! * 1000), new Date(now))}
            {now / 1000 - reading.unix_time! > 30 * 60 && " · Leitura antiga"}
          </span>
        )}
      </p>
      <p className="mt-2 font-mono text-[11px] text-faint">{reading.local_identifier}</p>
    </div>
  );
}
