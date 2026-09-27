import { CircleAlert, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/cn";

import type { Severity } from "./api";

/**
 * Valor lido com a gravidade do alerta. A gravidade não vai só na cor
 * (WCAG 1.4.1): tem ícone próprio e o nome para leitor de tela.
 */
export function SeverityValue({
  children,
  severity,
  muted = false,
}: {
  children: React.ReactNode;
  severity: Severity | undefined;
  muted?: boolean;
}) {
  if (muted || !severity) {
    return <span className="inline-flex rounded-md px-1.5 py-0.5 font-semibold text-muted">{children}</span>;
  }
  const Icon = severity === "alta" ? TriangleAlert : CircleAlert;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap",
        severity === "alta" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn",
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">Gravidade {severity}: </span>
      {children}
    </span>
  );
}
