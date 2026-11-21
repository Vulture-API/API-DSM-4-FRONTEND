"use client";

import { Cpu } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useCan } from "@/features/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";

import type { StationCollectionSettings } from "./api";
import {
  collectionErrorMessage,
  collectionIntervalError,
  formatCollectionInterval,
} from "./collection-settings";
import {
  useCollectionSettings,
  useSaveCollectionSettings,
  useStationStatus,
} from "./hooks";

/** Only mount the queries for users with the administrative collection permission. */
export function CollectionSettingsCard({
  stationId,
  stationName,
}: {
  stationId: number;
  stationName: string;
}) {
  const canRead = useCan("station-collection.read");
  return canRead ? (
    <CollectionSettingsContent
      key={stationId}
      stationId={stationId}
      stationName={stationName}
    />
  ) : null;
}

function CollectionSettingsContent({
  stationId,
  stationName,
}: {
  stationId: number;
  stationName: string;
}) {
  const settings = useCollectionSettings(stationId);
  const status = useStationStatus(stationId);
  return (
    <Card role="region" aria-label="Configuração da coleta">
      <CardHeader
        title="Configuração da coleta"
        description={`Estação selecionada: ${stationName}`}
        icon={<Cpu className="size-4" />}
      />
      <div className="space-y-4 p-5">
        {settings.isPending && (
          <div role="status">
            Carregando configuração da coleta…
            <Skeleton className="mt-3 h-24" />
          </div>
        )}
        {settings.error && (
          <ErrorState
            message={collectionErrorMessage(settings.error)}
            onRetry={() => void settings.refetch()}
          />
        )}
        {settings.data && (
          <>
            <p className="text-sm text-muted">
              Datalogger (MAC):{" "}
              <span className="font-mono text-ink">
                {settings.data.mac_address}
              </span>
            </p>
            <p className="text-sm">
              Intervalo configurado:{" "}
              <strong>
                {formatCollectionInterval(
                  settings.data.collection_interval_seconds,
                )}
              </strong>
            </p>
            <CollectionForm
              key={stationId}
              settings={settings.data}
              unavailable={Boolean(settings.error)}
            />
          </>
        )}
        <div className="border-t border-line pt-4 text-sm">
          {status.isPending && <p role="status">Consultando comunicação…</p>}
          {status.error && (
            <ErrorState
              message={collectionErrorMessage(status.error)}
              onRetry={() => void status.refetch()}
            />
          )}
          {status.data && !status.error && (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted">Comunicação da estação</dt>
                <dd className="font-medium">
                  {status.data.status === "Online"
                    ? "Em comunicação"
                    : "Sem comunicação"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Última comunicação</dt>
                <dd>
                  {status.data.last_communication_at
                    ? formatDateTime(status.data.last_communication_at)
                    : "Nenhuma comunicação registrada"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Verificado em</dt>
                <dd>{formatDateTime(status.data.checked_at)}</dd>
              </div>
              <div>
                <dt className="text-muted">Limite sem comunicação</dt>
                <dd>{status.data.offline_threshold_minutes} minutos</dd>
              </div>
            </dl>
          )}
          <p className="mt-3 text-xs text-muted">
            A comunicação é atualizada a cada 30 segundos. O intervalo
            configurado não confirma sua aplicação no datalogger.
          </p>
        </div>
      </div>
    </Card>
  );
}

function CollectionForm({
  settings,
  unavailable,
}: {
  settings: StationCollectionSettings;
  unavailable: boolean;
}) {
  const canUpdate = useCan("station-collection.update");
  const save = useSaveCollectionSettings(settings.station_id);
  const toast = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const value = draft ?? String(settings.collection_interval_seconds);
  const error = collectionIntervalError(
    value,
    settings.min_interval_seconds,
    settings.max_interval_seconds,
  );
  const missing =
    save.error instanceof Error &&
    "status" in save.error &&
    save.error.status === 404;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (error || !canUpdate || unavailable || missing || save.isPending) return;
    try {
      await save.mutateAsync(Number(value));
      setDraft(null);
      setSubmitted(false);
      toast.success("Intervalo de coleta atualizado.");
    } catch {
      // The error remains visible beside the form so the draft can be retried.
    }
  }

  if (!canUpdate) return null;
  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-3"
      aria-label="Alterar intervalo da coleta"
    >
      <Field
        label="Novo intervalo de coleta (segundos)"
        error={submitted ? error : undefined}
        hint={`Número inteiro entre ${settings.min_interval_seconds} e ${settings.max_interval_seconds} segundos.`}
      >
        {(props) => (
          <Input
            {...props}
            inputMode="numeric"
            value={value}
            disabled={unavailable || missing || save.isPending}
            onChange={(event) => {
              setDraft(event.target.value);
              save.reset();
            }}
          />
        )}
      </Field>
      {save.error && (
        <p role="alert" className="text-sm text-danger">
          {collectionErrorMessage(save.error)}
        </p>
      )}
      <Button
        type="submit"
        loading={save.isPending}
        disabled={
          unavailable ||
          missing ||
          Number(value) === settings.collection_interval_seconds
        }
      >
        Salvar intervalo
      </Button>
    </form>
  );
}
