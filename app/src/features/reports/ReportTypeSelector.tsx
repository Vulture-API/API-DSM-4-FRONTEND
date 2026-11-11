"use client";

import { BellRing, CloudSun, History, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  type CanonicalReportType,
  REPORT_TYPE_OPTIONS,
  type ReportTypeOption,
} from "./reportRules";

const REPORT_ICONS: Record<CanonicalReportType, LucideIcon> = {
  history: History,
  forecast: CloudSun,
  alerts: BellRing,
};

export type ReportTypeSelectorProps = {
  selectedType: CanonicalReportType;
  onSelectType: (type: CanonicalReportType) => void;
  options?: ReportTypeOption[];
};

export function ReportTypeSelector({
  selectedType,
  onSelectType,
  options = REPORT_TYPE_OPTIONS,
}: ReportTypeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de relatório meteorológico"
      className="grid gap-3.5 md:grid-cols-3"
    >
      {options.map((option) => {
        const Icon = REPORT_ICONS[option.type];
        const isSelected = selectedType === option.type;

        return (
          <Card
            key={option.type}
            className={cn(
              "p-0 transition-all",
              isSelected
                ? "border-brand-600 ring-2 ring-brand-500/20 bg-brand-50/30"
                : "hover:border-line-strong",
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectType(option.type)}
              className="flex h-full w-full flex-col justify-between p-5 text-left"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-subtle text-muted",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <Badge tone={isSelected ? "brand" : "neutral"}>
                    {option.badgeText}
                  </Badge>
                </div>

                <h3 className="mt-4 text-sm font-semibold tracking-tight text-ink">
                  {option.label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {option.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-[11px] font-medium">
                <span className={isSelected ? "text-brand-700" : "text-muted"}>
                  {isSelected ? "Relatório selecionado" : "Clique para selecionar"}
                </span>
                <span className="font-mono uppercase tracking-wider text-faint">
                  {option.shortLabel}
                </span>
              </div>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
