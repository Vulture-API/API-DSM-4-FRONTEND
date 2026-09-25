"use client";

import { type KeyboardEvent, useRef } from "react";

import { cn } from "@/lib/cn";

export type SegmentOption<T extends string> = { value: T; label: string; count?: number };

const NEXT_KEYS = ["ArrowRight", "ArrowDown"];
const PREV_KEYS = ["ArrowLeft", "ArrowUp"];

/**
 * Grupo de filtros exclusivos (Todas / Online / Offline...), no padrão ARIA de
 * radiogroup: o Tab entra só na opção marcada e as setas trocam a opção.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number | undefined;
    if (NEXT_KEYS.includes(event.key)) next = (selectedIndex + 1) % options.length;
    if (PREV_KEYS.includes(event.key)) next = (selectedIndex - 1 + options.length) % options.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(options[next]!.value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="inline-flex max-w-full overflow-x-auto rounded-lg bg-subtle p-0.5 [scrollbar-width:none]"
    >
      {options.map((option, index) => {
        const active = index === selectedIndex;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors",
              active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-brand-50 text-brand-700" : "text-faint",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
