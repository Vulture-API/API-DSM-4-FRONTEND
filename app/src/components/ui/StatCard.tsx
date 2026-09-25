import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { Card } from "./Card";

const accents = {
  brand: "bg-brand-50 text-brand-600",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: keyof typeof accents;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", accents[accent])}>{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
