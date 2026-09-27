import { query, request, requestAll } from "@/lib/api/http";
import type { Paginated } from "@/lib/api/http";

export const OPERATORS = [">", "<", ">=", "<=", "=", "!="] as const;
export type Operator = (typeof OPERATORS)[number];

export const OPERATOR_LABELS: Record<Operator, string> = {
  ">": "maior que",
  "<": "menor que",
  ">=": "maior ou igual a",
  "<=": "menor ou igual a",
  "=": "igual a",
  "!=": "diferente de",
};

/** Forma curta para frases ("Temperatura acima de 28 °C"). */
export const OPERATOR_PHRASES: Record<Operator, string> = {
  ">": "acima de",
  "<": "abaixo de",
  ">=": "a partir de",
  "<=": "até",
  "=": "igual a",
  "!=": "diferente de",
};

export type Severity = "alta" | "moderada";

/**
 * Quanto a leitura passou do limite. Acima de 10% do valor de referência
 * (ou do próprio limite, se ele for 0) conta como gravidade alta.
 */
export function exceedance(value: number, reference: number): { delta: number; severity: Severity } {
  const delta = value - reference;
  const base = Math.abs(reference) || 1;
  return { delta, severity: Math.abs(delta) / base > 0.1 ? "alta" : "moderada" };
}

export type AlertRule = {
  id: number;
  manager_user_id: number | null;
  sensor_id: number;
  reference_value: number;
  comparison_operator: Operator;
  message: string | null;
  active: boolean;
  created_at: string;
};
export type AlertRuleInput = Omit<AlertRule, "id" | "created_at">;

export type TriggeredAlert = {
  id: number;
  alert_config_id: number;
  reading_id: number;
  acknowledged_by: number | null;
  triggered_at: string;
  acknowledged_at: string | null;
  reading_value: number | null;
  reading_unix_time: number | null;
};

export const alertsApi = {
  rules: () => requestAll<AlertRule>("/api/alerts/config"),
  createRule: (input: AlertRuleInput) => request<AlertRule>("/api/alerts/config", { method: "POST", json: input }),
  updateRule: (id: number, input: AlertRuleInput) =>
    request<AlertRule>(`/api/alerts/config/${id}`, { method: "PUT", json: input }),
  removeRule: (id: number) => request<void>(`/api/alerts/config/${id}`, { method: "DELETE" }),

  triggered: (acknowledged: boolean, page: number, limit: number) =>
    request<Paginated<TriggeredAlert>>(`/api/alerts/triggered${query({ acknowledged, page, limit })}`),
  pendingCount: async () =>
    (await request<Paginated<TriggeredAlert>>("/api/alerts/triggered?acknowledged=false&limit=1")).meta
      .total_records,
  acknowledge: (id: number, userId: number) =>
    request<TriggeredAlert>(`/api/alerts/triggered/${id}/acknowledge`, {
      method: "PUT",
      json: { acknowledged_by: userId },
    }),
};
