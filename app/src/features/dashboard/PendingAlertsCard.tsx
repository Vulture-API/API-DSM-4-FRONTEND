"use client";

import { BellRing, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { exceedance } from "@/features/alerts/api";
import { useAlertRules, useTriggeredAlerts } from "@/features/alerts/hooks";
import { SeverityValue } from "@/features/alerts/SeverityValue";
import { useSensorCatalog } from "@/features/catalog";
import { sensorVisual } from "@/features/sensor-visual";
import { cn } from "@/lib/cn";
import { formatNumber, formatRelative } from "@/lib/format";

export function PendingAlertsCard({ className }: { className?: string }) {
  const triggered = useTriggeredAlerts(false, 1, 6);
  const rules = useAlertRules();
  const catalog = useSensorCatalog();
  const ruleById = new Map(rules.data?.map((r) => [r.id, r]));
  const loading = triggered.isLoading || rules.isLoading || catalog.isLoading;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader
        title="Alertas pendentes"
        description={triggered.data ? `${triggered.data.meta.total_records} aguardando reconhecimento` : "Últimos disparos"}
        icon={<BellRing className="size-4" />}
      />
      <div className="flex-1 px-2 pt-3 pb-2">
        {loading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : triggered.error ? (
          <ErrorState message={triggered.error.message} onRetry={() => void triggered.refetch()} />
        ) : !triggered.data?.data.length ? (
          <EmptyState title="Nenhum alerta pendente" description="Tudo dentro dos limites configurados." />
        ) : (
          <ul>
            {triggered.data.data.map((alert) => {
              const rule = ruleById.get(alert.alert_config_id);
              const entry = rule ? catalog.bySensorId.get(rule.sensor_id) : undefined;
              const visual = sensorVisual(entry?.type?.name ?? "");
              const severity =
                rule && alert.reading_value !== null
                  ? exceedance(alert.reading_value, rule.reference_value).severity
                  : "moderada";
              return (
                <li key={alert.id}>
                  <Link href="/alertas" className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas">
                    <span
                      className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: visual.soft, color: visual.color }}
                      aria-hidden
                    >
                      <visual.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-medium text-ink">
                        {rule?.message ?? `Regra #${alert.alert_config_id}`}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {entry?.station?.name ?? "Estação"} · {formatRelative(alert.triggered_at)}
                      </span>
                    </span>
                    <span className="mt-0.5 shrink-0">
                      <SeverityValue severity={alert.reading_value !== null ? severity : undefined}>
                        {alert.reading_value !== null
                          ? `${formatNumber(alert.reading_value)} ${entry?.type?.unit_of_measure ?? ""}`
                          : "leitura expirada"}
                      </SeverityValue>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Link
        href="/alertas"
        className="flex items-center justify-center gap-1 border-t border-line py-3 text-[13px] font-medium text-brand-700 hover:bg-canvas"
      >
        Ver todos os alertas <ChevronRight className="size-4" aria-hidden />
      </Link>
    </Card>
  );
}
