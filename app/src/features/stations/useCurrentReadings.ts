"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";

import { query } from "@/lib/api/http";

import { type CurrentData, type LiveReading, stationsApi } from "./api";
import { mergeReading, parseLiveReading } from "./current";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

/**
 * REST carrega/sincroniza o cadastro; WS aplica medições sem esperar o polling.
 * Eventos recebidos durante o REST são reaplicados para evitar regressões.
 */
export function useCurrentReadings(propertyId?: number, stationId?: number) {
  const client = useQueryClient();
  const auth = useAuth();
  const allowed = auth.can("monitoring.read");
  const userId = auth.user?.id;
  const refreshSession = auth.refresh;
  const buffers = useRef(new Map<string, Map<number, LiveReading>>());
  const scope = `${propertyId ?? "all"}:${stationId ?? "all"}`;
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [now, setNow] = useState(() => Date.now());
  const key = ["stations", "current", propertyId ?? "all", stationId ?? "all"] as const;
  const current = useQuery({
    enabled: allowed,
    queryKey: key,
    queryFn: async () => {
      const events = buffers.current.get(scope) ?? new Map<number, LiveReading>();
      buffers.current.set(scope, events);
      let data = await stationsApi.current(propertyId, stationId);
      for (const [sensorId, event] of events) {
        const snapshot = data.stations.find((s) => s.station_id === event.station_id)
          ?.readings.find((r) => r.sensor_id === sensorId);
        if (snapshot?.unix_time != null && snapshot.unix_time >= event.unix_time) {
          events.delete(sensorId);
        } else {
          data = mergeReading(data, event);
        }
      }
      return data;
    },
    // Também recupera eventos perdidos, alterações de cadastro e status.
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!allowed || !userId) return;
    const events = buffers.current.get(scope) ?? new Map<number, LiveReading>();
    const bufferStore = buffers.current;
    bufferStore.set(scope, events);
    let disposed = false;
    let socket: WebSocket | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const cacheKey = ["stations", "current", propertyId ?? "all", stationId ?? "all"] as const;
    const sync = () => {
      void client.invalidateQueries({ queryKey: cacheKey, exact: true });
    };
    const connect = () => {
      if (disposed) return;
      try {
        const url = new URL("/api/stations/current/ws", window.location.href);
        url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        url.search = query({ station_id: stationId });
        const ws = new WebSocket(url);
        socket = ws;
        timeout = setTimeout(() => ws.close(), 10_000);
        ws.onopen = () => {
          clearTimeout(timeout);
          attempts = 0;
          setConnection("connected");
          sync();
        };
        ws.onmessage = (message) => {
          if (disposed) return;
          const event = parseLiveReading(message.data);
          if (!event || (stationId !== undefined && event.station_id !== stationId)) return;
          const previous = events.get(event.sensor_id);
          if (previous && previous.unix_time >= event.unix_time) return;
          events.set(event.sensor_id, event);
          client.setQueryData<CurrentData>(cacheKey, (data) => data ? mergeReading(data, event) : data);
          setNow(Date.now());
        };
        ws.onerror = () => ws.close();
        ws.onclose = (event) => {
          if (event?.code === 1008) { refreshSession(); return; }
          retry();
        };
      } catch {
        retry();
      }
    };
    const retry = () => {
      clearTimeout(timeout);
      if (disposed) return;
      setConnection("reconnecting");
      reconnect = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 30_000));
    };
    const resume = () => {
      if (document.visibilityState === "hidden") return;
      sync();
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        clearTimeout(reconnect);
        connect();
      }
    };
    // Atualiza idade das leituras mesmo quando o backend não muda.
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    connect();
    return () => {
      disposed = true;
      bufferStore.delete(scope);
      clearTimeout(timeout);
      clearTimeout(reconnect);
      clearInterval(clock);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
      if (socket) {
        socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
        socket.close();
      }
    };
  }, [client, propertyId, stationId, scope, allowed, userId, refreshSession]);

  return { ...current, connection, now };
}
