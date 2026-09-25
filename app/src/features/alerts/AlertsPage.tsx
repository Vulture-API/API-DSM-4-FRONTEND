"use client";

import { BellRing, Check, ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonClasses, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useSensorCatalog } from "@/features/catalog";
import { sensorVisual } from "@/features/sensor-visual";
import { useCurrentUser, useUsers } from "@/features/users/hooks";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

import { exceedance, OPERATOR_PHRASES } from "./api";
import { useAcknowledge, useAlertRules, useTriggeredAlerts } from "./hooks";
import { SeverityValue } from "./SeverityValue";

const PAGE_SIZE = 15;

export function AlertsPage() {
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [page, setPage] = useState(1);
  const acknowledged = tab === "done";
  const triggered = useTriggeredAlerts(acknowledged, page, PAGE_SIZE);
  // O total da aba aberta vem da própria tabela (que já faz polling); a outra
  // aba usa uma consulta leve (limit=1) sem polling, atualizada ao reconhecer.
  const pendingCount = useTriggeredAlerts(false, 1, 1, { poll: false });
  const doneCount = useTriggeredAlerts(true, 1, 1, { poll: false });
  const tableTotal = triggered.isPlaceholderData ? undefined : triggered.data?.meta.total_records;
  const pendingTotal = (!acknowledged ? tableTotal : undefined) ?? pendingCount.data?.meta.total_records;
  const doneTotal = (acknowledged ? tableTotal : undefined) ?? doneCount.data?.meta.total_records;
  const rules = useAlertRules();
  const catalog = useSensorCatalog();
  const users = useUsers();
  const me = useCurrentUser();
  const acknowledge = useAcknowledge();
  const toast = useToast();

  const ruleById = new Map(rules.data?.map((r) => [r.id, r]));
  const userById = new Map(users.data?.map((u) => [u.id, u]));
  const loading = triggered.isLoading || rules.isLoading || catalog.isLoading;
  const totalPages = triggered.data?.meta.total_pages ?? 1;

  async function ack(id: number) {
    if (!me) {
      toast.error("Nenhum usuário ativo para registrar o reconhecimento.");
      return;
    }
    try {
      await acknowledge.mutateAsync({ id, userId: me.id });
      toast.success("Alerta reconhecido.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Alertas"
        title="Alertas disparados"
        description="Ocorrências geradas pelo motor de regras a partir das leituras das estações."
        actions={
          <Link href="/alertas/regras" className={buttonClasses("glass")}>
            Gerenciar regras
          </Link>
        }
      />

      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between gap-3 border-b border-line p-4">
          <Segmented
            label="Situação do alerta"
            value={tab}
            onChange={(value) => {
              setTab(value);
              setPage(1);
            }}
            options={[
              { value: "pending", label: "Pendentes", ...(pendingTotal !== undefined ? { count: pendingTotal } : {}) },
              { value: "done", label: "Reconhecidos", ...(doneTotal !== undefined ? { count: doneTotal } : {}) },
            ]}
          />
          {me && (
            <p className="hidden items-center gap-2 text-xs text-muted sm:flex">
              <Avatar name={me.name} size="sm" />
              Reconhecendo como <span className="font-medium text-ink">{me.name}</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : triggered.error ? (
          <ErrorState message={triggered.error.message} onRetry={() => void triggered.refetch()} />
        ) : !triggered.data?.data.length ? (
          <EmptyState
            icon={<BellRing className="size-5" />}
            title={acknowledged ? "Nenhum alerta reconhecido ainda" : "Nenhum alerta pendente"}
            description={acknowledged ? undefined : "Tudo dentro dos limites configurados."}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Alerta</Th>
                <Th className="hidden md:table-cell">Estação</Th>
                <Th className="text-right">Leitura</Th>
                <Th className="hidden sm:table-cell">Disparado</Th>
                <Th className="text-right">{acknowledged ? "Reconhecido" : <span className="sr-only">Ação</span>}</Th>
              </tr>
            </thead>
            <tbody>
              {triggered.data.data.map((alert) => {
                const rule = ruleById.get(alert.alert_config_id);
                const entry = rule ? catalog.bySensorId.get(rule.sensor_id) : undefined;
                const visual = sensorVisual(entry?.type?.name ?? "");
                const unit = entry?.type?.unit_of_measure ?? "";
                const excess =
                  rule && alert.reading_value !== null ? exceedance(alert.reading_value, rule.reference_value) : undefined;
                return (
                  <Tr key={alert.id}>
                    <Td>
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: visual.soft, color: visual.color }}
                        >
                          <visual.icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{rule?.message ?? `Regra #${alert.alert_config_id}`}</p>
                          {rule && (
                            <p className="text-xs text-muted">
                              {entry?.type?.name ?? "Sensor"} {OPERATOR_PHRASES[rule.comparison_operator]}{" "}
                              {formatNumber(rule.reference_value)} {unit}
                            </p>
                          )}
                          <p className="text-xs text-muted md:hidden">
                            {entry?.station?.name ?? "Estação"} · {formatRelative(alert.triggered_at)}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden md:table-cell">
                      {entry?.station ? (
                        <Link href={`/estacoes/${entry.station.id}`} className="hover:text-brand-700">
                          <span className="block text-ink">{entry.station.name}</span>
                          <span className="block text-xs text-muted">{entry.property?.name}</span>
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {alert.reading_value !== null ? (
                        <>
                          <SeverityValue severity={excess?.severity} muted={acknowledged}>
                            {formatNumber(alert.reading_value)} {unit}
                          </SeverityValue>
                          {excess && (
                            <span className="mt-0.5 block text-xs text-faint">
                              {excess.delta > 0 ? "+" : ""}
                              {formatNumber(excess.delta)} do limite
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <span className="text-muted" title={formatDateTime(alert.triggered_at)}>
                        {formatRelative(alert.triggered_at)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      {acknowledged ? (
                        <span className="text-xs text-muted">
                          <span className="block font-medium text-ink">
                            {userById.get(alert.acknowledged_by ?? -1)?.name ?? "—"}
                          </span>
                          {alert.acknowledged_at && formatDateTime(alert.acknowledged_at)}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Check className="size-3.5" />}
                          loading={acknowledge.isPending && acknowledge.variables?.id === alert.id}
                          onClick={() => void ack(alert.id)}
                          aria-label="Reconhecer"
                          className="max-sm:size-8 max-sm:px-0"
                        >
                          <span className="hidden sm:inline">Reconhecer</span>
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-muted">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <IconButton label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" />
              </IconButton>
              <IconButton label="Próxima página" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-4" />
              </IconButton>
            </div>
          </div>
        )}
      </Card>
      {!acknowledged && (pendingTotal ?? 0) > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Info className="size-4 text-info" aria-hidden />
          Reconhecer um alerta tira a estação do status &quot;Com alerta&quot;. A regra só dispara de novo depois disso.
        </p>
      )}
    </>
  );
}
