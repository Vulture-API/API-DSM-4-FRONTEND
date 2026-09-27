"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { formatNumber, formatRelative } from "@/lib/format";

import type { StationOverview } from "./api";
import { STATUS_COLOR } from "./StationStatusBadge";

/**
 * Tiles do OpenStreetMap (sem chave; o CARTO passou a exigir uma). A política
 * de uso do OSM pede o Referer, por isso o referrerPolicy manda só a origem.
 * O CSS (globals.css) dessatura os tiles para combinar com o portal. Se não
 * carregarem (sem internet), os pinos continuam sobre o fundo neutro.
 */
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type Located = StationOverview & { latitude: number; longitude: number };

export function hasLocation(station: StationOverview): station is Located {
  return station.latitude !== null && station.longitude !== null;
}

/*
 * Um ícone por (status, selecionado), reaproveitado. Criar um L.divIcon novo a
 * cada render (o overview atualiza a cada 30 s) faria o react-leaflet trocar o
 * elemento do pino, e quem estivesse com o foco num pino perderia o foco.
 */
const iconCache = new Map<string, L.DivIcon>();

/**
 * Desenho do ponto de cada status. Além da cor, muda a forma (WCAG 1.4.1):
 * Online = cheio com pulso, Com alerta = cheio com "!", Offline = anel vazado.
 */
export function markerDot(status: StationOverview["status"], size: number): string {
  const color = STATUS_COLOR[status];
  const base = "position:absolute;inset:0;border-radius:9999px;box-shadow:0 2px 6px rgb(15 42 29 / .35);";
  if (status === "Offline") {
    return `<span style="${base}background:#fff;border:${Math.max(3, size / 4)}px solid ${color}"></span>`;
  }
  const glyph =
    status === "Com alerta"
      ? `<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font:800 ${Math.round(size * 0.55)}px/1 system-ui">!</span>`
      : "";
  const ping =
    status === "Online"
      ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${color};animation:station-ping 1.8s ease-out infinite"></span>`
      : "";
  return `${ping}<span style="${base}background:${color};border:2px solid #fff"></span>${glyph}`;
}

function pin(status: StationOverview["status"], selected: boolean): L.DivIcon {
  const key = `${status}:${selected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  // O ponto visível é menor, mas a área clicável tem pelo menos 24 px (WCAG 2.5.8).
  const dot = selected ? 22 : 16;
  const hit = Math.max(24, dot + 8);
  const icon = L.divIcon({
    className: "",
    iconSize: [hit, hit],
    iconAnchor: [hit / 2, hit / 2],
    popupAnchor: [0, -hit / 2],
    html: `<span style="display:grid;place-items:center;width:${hit}px;height:${hit}px"><span style="position:relative;display:block;width:${dot}px;height:${dot}px">${markerDot(status, dot)}</span></span>`,
  });
  iconCache.set(key, icon);
  return icon;
}

/** Enquadra todas as estações (ou centraliza a única). */
function FitBounds({ points, zoom }: { points: [number, number][]; zoom: number }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length === 1) map.setView(points[0]!, zoom);
    else if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: zoom });
    // key resume os pontos; evita reenquadrar a cada refetch com os mesmos dados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, zoom]);
  return null;
}

export function StationsMap({
  stations,
  selectedId,
  height = 360,
  zoom = 13,
  label = "Mapa das estações",
}: {
  stations: StationOverview[];
  selectedId?: number | undefined;
  height?: number;
  zoom?: number;
  label?: string;
}) {
  const located = useMemo(() => stations.filter(hasLocation), [stations]);
  const points = useMemo(() => located.map((s) => [s.latitude, s.longitude] as [number, number]), [located]);
  const center = points[0] ?? [-23.18, -45.88];

  return (
    <div role="region" aria-label={label} style={{ height }} className="relative isolate z-0 overflow-hidden">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="size-full" attributionControl>
        <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} referrerPolicy="strict-origin" />
        <FitBounds points={points} zoom={zoom} />
        {located.map((station) => (
          <StationMarker key={station.id} station={station} selected={station.id === selectedId} />
        ))}
      </MapContainer>
      <Legend />
    </div>
  );
}

function StationMarker({ station, selected }: { station: Located; selected: boolean }) {
  const marker = useRef<L.Marker>(null);
  const label = `${station.name}: ${station.status}`;

  // Nome acessível explícito no pino (o divIcon não usa o "alt" do Leaflet).
  useEffect(() => {
    marker.current?.getElement()?.setAttribute("aria-label", label);
  }, [label]);

  return (
    <Marker
      ref={marker}
      position={[station.latitude, station.longitude]}
      icon={pin(station.status, selected)}
      title={label}
      zIndexOffset={station.status === "Online" ? 0 : 500}
      eventHandlers={{
        // Ao abrir, o foco vai para o link do resumo; ao fechar, volta ao pino
        // (o popup fica em outro painel do DOM, longe do pino na ordem do Tab).
        popupopen: (event) => {
          requestAnimationFrame(() => event.popup.getElement()?.querySelector<HTMLElement>("a[href^='/']")?.focus());
        },
        popupclose: (event) => {
          if (event.popup.getElement()?.contains(document.activeElement)) {
            (event.target as L.Marker).getElement()?.focus();
          }
        },
      }}
    >
      <Popup>
        <StationPopup station={station} />
      </Popup>
    </Marker>
  );
}

function StationPopup({ station }: { station: Located }) {
  const temp = station.latest_readings.find((r) => r.sensor_type === "Temperatura");
  const humidity = station.latest_readings.find((r) => r.sensor_type === "Umidade");
  return (
    <div className="min-w-44 text-ink">
      <p className="text-sm font-semibold">{station.name}</p>
      <p className="text-xs text-muted">{station.property_name}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs">
        <span className="size-2 rounded-full" style={{ background: STATUS_COLOR[station.status] }} aria-hidden />
        {station.status} · {formatRelative(station.last_communication_at)}
      </p>
      {(temp || humidity) && (
        <p className="mt-1 text-xs text-muted tabular-nums">
          {temp && `${formatNumber(temp.value)} ${temp.unit_of_measure}`}
          {temp && humidity && " · "}
          {humidity && `${formatNumber(humidity.value)} ${humidity.unit_of_measure}`}
        </p>
      )}
      <Link href={`/estacoes/${station.id}`} className="mt-2 inline-block text-xs font-medium !text-brand-700 hover:underline">
        Abrir estação →
      </Link>
    </div>
  );
}

function Legend() {
  return (
    <ul
      aria-hidden
      className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] text-muted shadow-sm ring-1 ring-line backdrop-blur"
    >
      {(Object.keys(STATUS_COLOR) as (keyof typeof STATUS_COLOR)[]).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          {/* markerDot só monta HTML a partir de constantes (cor e tamanho), nunca de dados. */}
          <span className="relative inline-block size-3" dangerouslySetInnerHTML={{ __html: markerDot(status, 12) }} />
          {status}
        </li>
      ))}
    </ul>
  );
}
