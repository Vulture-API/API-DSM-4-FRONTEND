"use client";

import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export type DateRangePickerProps = {
  startDate: string; // Formato DD/MM/YYYY
  endDate: string; // Formato DD/MM/YYYY
  onChange: (start: string, end: string) => void;
  className?: string;
  id?: string;
  label?: string;
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isBetween(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const time = d.getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const [min, max] = s <= e ? [s, e] : [e, s];
  return time > min && time < max;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  id,
  label = "Intervalo de datas",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedStart = useMemo(() => parseDate(startDate), [startDate]);
  const parsedEnd = useMemo(() => parseDate(endDate), [endDate]);

  // Mês e ano exibidos no visualizador do calendário
  const [viewDate, setViewDate] = useState(() => {
    return parsedEnd ?? parsedStart ?? new Date(1791936000 * 1000);
  });

  // Seleção intermediária enquanto o usuário clica no calendário
  const [pickingStart, setPickingStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Fecha ao clicar fora do popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickingStart(null);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  function prevMonth() {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  }

  // Gera a matriz do mês (6 semanas x 7 dias = 42 células)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: new Date(viewYear, viewMonth, i),
        isCurrentMonth: true,
      });
    }

    // Dias do próximo mês
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(viewYear, viewMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  function handleDayClick(d: Date) {
    if (!pickingStart) {
      // Primeiro clique: define o início e aguarda o segundo clique
      setPickingStart(d);
    } else {
      // Segundo clique: define o fim e aplica o intervalo
      const start = pickingStart <= d ? pickingStart : d;
      const end = pickingStart <= d ? d : pickingStart;
      onChange(formatDate(start), formatDate(end));
      setPickingStart(null);
      setIsOpen(false);
    }
  }

  function applyPreset(days: number) {
    const end = new Date(1791936000 * 1000);
    const start = new Date(1791936000 * 1000);
    start.setDate(end.getDate() - days);
    onChange(formatDate(start), formatDate(end));
    setViewDate(end);
    setPickingStart(null);
    setIsOpen(false);
  }

  function applyThisMonth() {
    const base = new Date(1791936000 * 1000);
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    onChange(formatDate(start), formatDate(end));
    setViewDate(base);
    setPickingStart(null);
    setIsOpen(false);
  }

  // Quantidade de dias selecionados no intervalo atual
  const daysDiff = useMemo(() => {
    if (!parsedStart || !parsedEnd) return null;
    const diffTime = Math.abs(parsedEnd.getTime() - parsedStart.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [parsedStart, parsedEnd]);

  const activeStart = pickingStart ?? parsedStart;
  const activeEnd = pickingStart ? (hoverDate ?? pickingStart) : parsedEnd;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Inputs acessíveis e sincronizados para leitores de tela e testes automatizados */}
      <div className="sr-only">
        <input
          id={id ? `${id}-start` : undefined}
          aria-label="Data inicial"
          type="text"
          value={startDate}
          suppressHydrationWarning
          onChange={(e) => onChange(e.target.value, endDate)}
        />
        <input
          id={id ? `${id}-end` : undefined}
          aria-label="Data final"
          type="text"
          value={endDate}
          suppressHydrationWarning
          onChange={(e) => onChange(startDate, e.target.value)}
        />
      </div>

      {/* Botão de disparo com o intervalo atual estilizado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={isOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink shadow-sm transition-all hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          isOpen && "border-brand-500 ring-2 ring-brand-500/20",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="size-4 shrink-0 text-brand-600" />
          <span className="truncate font-mono tabular-nums text-ink">
            {startDate} — {endDate}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {daysDiff && (
            <span className="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.5 text-[10px] font-medium text-brand-800">
              {daysDiff} {daysDiff === 1 ? "dia" : "dias"}
            </span>
          )}
          <ChevronDown className={cn("size-3.5 text-muted transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {/* Popover interativo do calendário */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar período"
          className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)] animate-[pop-in_160ms_ease-out]"
        >
          {/* Cabeçalho do mês e botões de navegação */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="text-xs font-semibold text-ink">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="flex size-7 items-center justify-center rounded-lg border border-line text-muted hover:bg-subtle hover:text-ink transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="flex size-7 items-center justify-center rounded-lg border border-line text-muted hover:bg-subtle hover:text-ink transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar calendário"
                className="ml-1 flex size-7 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Atalhos rápidos de seleção */}
          <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className="rounded-md bg-subtle px-2 py-1 font-medium text-muted hover:bg-brand-50 hover:text-brand-800 transition-colors"
            >
              24 h
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-md bg-subtle px-2 py-1 font-medium text-muted hover:bg-brand-50 hover:text-brand-800 transition-colors"
            >
              7 dias
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="rounded-md bg-subtle px-2 py-1 font-medium text-muted hover:bg-brand-50 hover:text-brand-800 transition-colors"
            >
              30 dias
            </button>
            <button
              type="button"
              onClick={applyThisMonth}
              className="rounded-md bg-subtle px-2 py-1 font-medium text-muted hover:bg-brand-50 hover:text-brand-800 transition-colors"
            >
              Este mês
            </button>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-faint pb-1">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="py-1">
                {name}
              </div>
            ))}
          </div>

          {/* Grid de dias do mês */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const isStart = isSameDay(date, activeStart);
              const isEnd = isSameDay(date, activeEnd);
              const inRange = isBetween(date, activeStart, activeEnd);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDayClick(date)}
                  onMouseEnter={() => {
                    if (pickingStart) setHoverDate(date);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-xs font-mono transition-colors",
                    !isCurrentMonth && "text-faint/40",
                    isCurrentMonth && !isStart && !isEnd && !inRange && "text-ink hover:bg-subtle",
                    inRange && "bg-brand-50 text-brand-900 font-medium rounded-none first:rounded-l-lg last:rounded-r-lg",
                    (isStart || isEnd) && "bg-brand-600 font-semibold text-white shadow-sm hover:bg-brand-700",
                    isStart && inRange && "rounded-r-none",
                    isEnd && inRange && "rounded-l-none",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Rodapé com campos manuais e confirmação */}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[11px] text-muted">
              {pickingStart ? "Selecione a data final" : `${startDate} — ${endDate}`}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPickingStart(null);
                  setIsOpen(false);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
