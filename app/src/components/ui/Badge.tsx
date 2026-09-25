import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted ring-line",
  ok: "bg-ok-soft text-ok ring-ok/15",
  warn: "bg-warn-soft text-warn ring-warn/20",
  danger: "bg-danger-soft text-danger ring-danger/15",
  info: "bg-info-soft text-info ring-info/15",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
};

const dots: Record<Tone, string> = {
  neutral: "bg-faint",
  ok: "bg-dot-ok",
  warn: "bg-dot-warn",
  danger: "bg-dot-danger",
  info: "bg-info",
  brand: "bg-brand-500",
};

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", dots[tone])} />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", dots[tone])} />
        </span>
      )}
      {children}
    </span>
  );
}
