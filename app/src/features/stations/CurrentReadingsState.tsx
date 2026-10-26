"use client";

import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/format";

import type { ConnectionStatus } from "./useCurrentReadings";

export function CurrentReadingsState({
  connection, error, updatedAt, now, onRetry,
}: {
  connection: ConnectionStatus;
  error: Error | null;
  updatedAt: number;
  now: number;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs text-muted" role="status" aria-live="polite">
      <span>
        {error
          ? "Não foi possível sincronizar. Mantendo as últimas medições disponíveis."
          : connection === "connected"
            ? "Recebendo novas medições automaticamente."
            : connection === "reconnecting"
              ? "Conexão interrompida. Tentando reconectar; consulta automática a cada 30 s."
              : "Conectando às novas medições…"}
      </span>
      {updatedAt > 0 && <span>Sincronizado {formatRelative(new Date(updatedAt), new Date(now))}.</span>}
      {error && <Button variant="secondary" size="sm" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}
