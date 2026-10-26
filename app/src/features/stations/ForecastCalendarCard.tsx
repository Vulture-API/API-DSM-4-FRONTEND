"use client";

import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

import { Skeleton } from "@/components/ui/States";
import type { StationForecast } from "@/features/stations/api";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export type ForecastCalendarCardProps = {
  stationName?: string;
  propertyName?: string;
  latitude?: number | null;
  longitude?: number | null;
  forecast?: StationForecast | null;
  isLoading?: boolean;
  className?: string;
};

type WeatherVisual = {
  label: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
};

export function getWeatherVisual(
  weatherCode: number | null | undefined,
  rainMm = 0,
  rainProb = 0,
): WeatherVisual {
  // WMO Weather interpretation codes (WW)
  // 0: Céu limpo / Sol predominante
  // 1: Principalmente limpo / Tempo firme
  // 2: Parcialmente nublado / Sol entre nuvens
  // 3: Nublado / Encoberto
  // 45, 48: Nevoeiro
  // 51, 53, 55: Chuvisco / Garoa
  // 61, 63, 65: Chuva fraca a forte
  // 80, 81, 82: Pancadas de chuva
  // 95, 96, 99: Tempestade com trovoadas
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    return {
      label: "Tempestade",
      Icon: CloudLightning,
      bg: "#eeeffc",
      color: "#5b61c9",
    };
  }

  if (weatherCode === 63 || weatherCode === 65 || rainMm >= 15) {
    return {
      label: "Chuva forte",
      Icon: CloudRain,
      bg: "#eeeffc",
      color: "#5b61c9",
    };
  }

  if (weatherCode === 80 || weatherCode === 81 || weatherCode === 82 || (rainMm > 4 && rainMm < 15)) {
    return {
      label: "Pancadas isoladas",
      Icon: CloudRain,
      bg: "#e8f1fb",
      color: "#2f6fb3",
    };
  }

  if (weatherCode === 51 || weatherCode === 53 || weatherCode === 55 || weatherCode === 61 || (rainMm > 0 && rainMm <= 4)) {
    return {
      label: "Chuva leve",
      Icon: CloudDrizzle,
      bg: "#e8f1fb",
      color: "#2f6fb3",
    };
  }

  if (weatherCode === 3 || (rainProb >= 40 && rainMm === 0)) {
    return {
      label: "Aumento de nuvens",
      Icon: Cloud,
      bg: "#efeee7",
      color: "#58605a",
    };
  }

  if (weatherCode === 2) {
    return {
      label: "Sol entre nuvens",
      Icon: CloudSun,
      bg: "#fdeee7",
      color: "#d9582b",
    };
  }

  if (weatherCode === 1) {
    return {
      label: "Tempo firme",
      Icon: Sun,
      bg: "#fdeee7",
      color: "#d9582b",
    };
  }

  return {
    label: "Sol predominante",
    Icon: Sun,
    bg: "#fdeee7",
    color: "#d9582b",
  };
}

function parseForecastDate(dateStr: string, index: number) {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] ?? 2026;
  const month = parts[1] ?? 10;
  const day = parts[2] ?? 14;

  const dateObj = new Date(year, month - 1, day);
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const weekday = weekdays[dateObj.getDay()] ?? "Dia";
  const dayMonth = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;

  return {
    isToday: index === 0,
    weekdayLabel: index === 0 ? "Hoje" : weekday,
    rawWeekday: weekday,
    dayMonth,
  };
}

export function ForecastCalendarCard({
  stationName = "Estação Sede",
  propertyName = "Fazenda Santa Rita",
  latitude = -23.1896,
  longitude = -45.8841,
  forecast,
  isLoading = false,
  className,
}: ForecastCalendarCardProps) {
  const days = useMemo(() => forecast?.days.slice(0, 7) ?? [], [forecast]);

  // Análise agroclimática e operacional baseada nas métricas dos 7 dias
  const insights = useMemo(() => {
    const today = days[0];
    const totalRain = days.reduce((sum, d) => sum + (d.precipitation_mm ?? 0), 0);
    const heavyRainDay = days.find((d) => (d.precipitation_mm ?? 0) >= 10);
    const maxTempDay = days.reduce(
      (prev, curr) => ((curr.temperature_max ?? 0) > (prev.temperature_max ?? 0) ? curr : prev),
      days[0] ?? { temperature_max: 30, date: "" },
    );

    // 1. Pulverização (24h)
    const todayWind = today?.wind_speed_max_kmh ?? 12;
    const todayRainProb = today?.precipitation_probability ?? 15;
    let sprayStatus = "● Favorável";
    let sprayBadgeClass = "bg-ok-soft text-ok";
    let sprayText = `Vento entre ${Math.max(8, Math.round(todayWind - 2))} e ${Math.round(todayWind + 2)} km/h e umidade adequada até amanhã.`;

    if (todayWind > 20 || todayRainProb > 70) {
      sprayStatus = "● Desfavorável";
      sprayBadgeClass = "bg-danger-soft text-danger";
      sprayText = `Vento elevado (${Math.round(todayWind)} km/h) ou alta probabilidade de chuva (${todayRainProb}%). Risco crítico de deriva.`;
    } else if (todayWind > 15 || todayRainProb > 40) {
      sprayStatus = "● Moderado";
      sprayBadgeClass = "bg-warn-soft text-warn";
      sprayText = `Condições limítrofes (${Math.round(todayWind)} km/h e ${todayRainProb}% de chuva). Recomenda-se aplicar nas primeiras horas matinais.`;
    }

    // 2. Manejo de Irrigação
    let irrigationStatus = "● Irrigação Regular";
    let irrigationBadgeClass = "bg-ok-soft text-ok";
    let irrigationText = `Previsão de ${formatNumber(totalRain)} mm acumulados na semana. Manter escala regular dos pivôs.`;

    if (totalRain >= 20 && heavyRainDay) {
      const idx = days.indexOf(heavyRainDay);
      const parsed = parseForecastDate(heavyRainDay.date, idx);
      irrigationStatus = `● Suspender na ${parsed.weekdayLabel}`;
      irrigationBadgeClass = "bg-info-soft text-info";
      irrigationText = `Previsão de ${formatNumber(totalRain)} mm acumulados com pico no dia ${parsed.dayMonth}. Recomendado desligar setores.`;
    } else if (totalRain >= 10) {
      irrigationStatus = "● Reduzir Lâmina";
      irrigationBadgeClass = "bg-info-soft text-info";
      irrigationText = `Precipitação estimada em ${formatNumber(totalRain)} mm. Reduzir tempo de aplicação para economizar recursos.`;
    }

    // 3. Risco de Estresse Térmico
    const peakTemp = maxTempDay?.temperature_max ?? 30;
    let heatStatus = "● Baixo Risco";
    let heatBadgeClass = "bg-ok-soft text-ok";
    let heatText = `Temperaturas amenas (máxima de ${formatNumber(peakTemp)} °C). Sem risco fitossanitário de calor extremo.`;

    if (peakTemp >= 34) {
      const idx = days.indexOf(maxTempDay);
      const parsed = parseForecastDate(maxTempDay.date, idx);
      heatStatus = `● Atenção ${parsed.weekdayLabel}`;
      heatBadgeClass = "bg-warn-soft text-warn";
      heatText = `Máxima prevista de ${formatNumber(peakTemp)} °C na ${parsed.weekdayLabel} (${parsed.dayMonth}) entre 13h e 16h.`;
    }

    // Alerta do topo
    let headerAlert = "Condições climáticas favoráveis para os próximos 7 dias";
    let alertBg = "bg-ok-soft text-ok";
    let alertDot = "bg-ok";

    if (heavyRainDay) {
      const idx = days.indexOf(heavyRainDay);
      const parsed = parseForecastDate(heavyRainDay.date, idx);
      headerAlert = `Frente chuvosa prevista na ${parsed.weekdayLabel} (${parsed.dayMonth})`;
      alertBg = "bg-warn-soft text-warn";
      alertDot = "bg-[#e59b1a]";
    } else if (peakTemp >= 34) {
      const idx = days.indexOf(maxTempDay);
      const parsed = parseForecastDate(maxTempDay.date, idx);
      headerAlert = `Onda de calor prevista na ${parsed.weekdayLabel} (${parsed.dayMonth}) — ${formatNumber(peakTemp)} °C`;
      alertBg = "bg-warn-soft text-warn";
      alertDot = "bg-[#e59b1a]";
    }

    return {
      spray: { status: sprayStatus, badgeClass: sprayBadgeClass, text: sprayText },
      irrigation: { status: irrigationStatus, badgeClass: irrigationBadgeClass, text: irrigationText },
      heat: { status: heatStatus, badgeClass: heatBadgeClass, text: heatText },
      headerAlert,
      alertBg,
      alertDot,
    };
  }, [days]);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-6 w-80 rounded" />
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
          <Skeleton className="h-10 w-2/3 rounded-lg" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!days.length) return <div className={cn("rounded-2xl border border-line bg-surface p-6 text-sm text-muted", className)}>Previsão indisponível no momento.</div>;

  return (
    <div className={cn("pt-2", className)} data-testid="forecast-calendar-card">
      {/* Badge de cabeçalho da seção leve, elegante e alinhado ao Design System */}
      <div className="mb-3 inline-flex items-center gap-2.5 rounded-full border border-brand-200 bg-brand-50/90 px-3.5 py-1 text-xs font-medium text-brand-900 shadow-2xs">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
        </span>
        <span className="font-semibold text-brand-900">Previsão Meteorológica</span>
        <span className="text-brand-300">·</span>
        <span className="text-brand-700">Próximos 7 dias e condições operacionais</span>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--shadow-card)]">
        {/* Cabeçalho da Previsão */}
        <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-200/60 bg-brand-50 text-brand-700 shadow-2xs">
              <CloudSun className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                  Previsão meteorológica — {stationName}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                  <span className="size-1.5 rounded-full bg-brand-500" />
                  Próximos 7 dias
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-muted">
                Projeção diária para {propertyName} ({latitude?.toFixed(4)}, {longitude?.toFixed(4)}) · Temperatura, precipitação e janelas agrícolas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border border-line/60", insights.alertBg)}>
              <span className={cn("size-1.5 rounded-full", insights.alertDot)} />
              {insights.headerAlert}
            </span>
          </div>
        </div>

        {/* Grade de 7 Dias de Previsão */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-y divide-line border-t border-line sm:grid-cols-4 lg:grid-cols-7 lg:divide-y-0">
          {days.map((day, index) => {
            const { isToday, weekdayLabel, dayMonth } = parseForecastDate(day.date, index);
            const visual = getWeatherVisual(
              day.weather_code,
              day.precipitation_mm ?? 0,
              day.precipitation_probability ?? 0,
            );
            const VisualIcon = visual.Icon;

            const minTemp = day.temperature_min ?? 15;
            const maxTemp = day.temperature_max ?? 28;
            const rainMm = day.precipitation_mm ?? 0;
            const rainProb = day.precipitation_probability ?? 0;
            const windKm = day.wind_speed_max_kmh ?? 12;

            // Escala visual da barra de temperatura (10°C a 40°C)
            const minScale = 10;
            const maxScale = 40;
            const leftPct = Math.max(5, Math.min(55, Math.round(((minTemp - minScale) / (maxScale - minScale)) * 100)));
            const rightPct = Math.max(leftPct + 20, Math.min(95, Math.round(((maxTemp - minScale) / (maxScale - minScale)) * 100)));
            const widthPct = Math.max(22, rightPct - leftPct);

            return (
              <div
                key={day.date}
                className={cn(
                  "p-4 transition-colors",
                  isToday ? "bg-brand-50/40" : "hover:bg-canvas/50",
                )}
                data-testid={`forecast-day-${index}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">{weekdayLabel}</span>
                  {isToday ? (
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600">
                      {dayMonth}
                    </span>
                  ) : (
                    <span className="text-[11px] tabular-nums text-faint">{dayMonth}</span>
                  )}
                </div>

                <div className="my-3 flex items-center gap-2.5">
                  <span
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: visual.bg, color: visual.color }}
                  >
                    <VisualIcon className="size-5" />
                  </span>
                  <span className="text-xs font-medium leading-tight text-ink">{visual.label}</span>
                </div>

                <div className="flex items-baseline justify-between text-xs tabular-nums">
                  <span className="font-medium text-info">{Math.round(minTemp)}°</span>
                  <div className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        maxTemp >= 30
                          ? "bg-gradient-to-r from-[#2f6fb3] to-[#b12f1c]"
                          : maxTemp >= 26
                            ? "bg-gradient-to-r from-[#2f6fb3] to-[#d9582b]"
                            : "bg-[#2f6fb3]",
                      )}
                      style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="font-semibold text-danger">{Math.round(maxTemp)}°C</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line/80 pt-2 text-[11px] tabular-nums text-muted">
                  <span className={cn("font-medium", rainProb >= 75 ? "font-semibold text-[#5b61c9]" : "text-[#2f6fb3]")}>
                    {rainProb}% · {formatNumber(rainMm)} mm
                  </span>
                  <span>{Math.round(windKm)} km/h</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Previsão: Recomendações Operacionais Agrícolas */}
        <div className="grid gap-4 border-t border-line bg-subtle/35 p-5 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Janela de Pulverização (24h)</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", insights.spray.badgeClass)}>
                {insights.spray.status}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {insights.spray.text}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Manejo de Irrigação (Pivô / Geral)</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", insights.irrigation.badgeClass)}>
                {insights.irrigation.status}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {insights.irrigation.text}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Risco de Estresse Térmico</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", insights.heat.badgeClass)}>
                {insights.heat.status}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {insights.heat.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
