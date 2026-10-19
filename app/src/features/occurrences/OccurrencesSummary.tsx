"use client";

import { ChevronRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import type { StationOverview } from "@/features/stations/api";
import { formatDate, formatHour, formatNumber } from "@/lib/format";

import type { Occurrence } from "./api";
import { useOpenOccurrences, useResolveOccurrence } from "./hooks";

const PAGE_SIZE = 8;

export function OccurrencesSummary({
  stationId, propertyId, stations,
}: {
  stationId?: number;
  propertyId?: number;
  stations: StationOverview[];
}) {
  const occurrences = useOpenOccurrences(stationId);
  const resolve = useResolveOccurrence();
  const [selected, setSelected] = useState<Occurrence | null>(null);
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const stationIds = new Set(stations.map((s) => s.id));
  // A API filtra estação, mas ainda não recebe property_id.
  const rows = (occurrences.data ?? [])
    .filter((o) => o.status === "OPEN" &&
      (stationId === undefined || o.station_id === stationId) &&
      (propertyId === undefined || stationIds.has(o.station_id)))
    .sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at) || b.id - a.id);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const scope = stationId !== undefined
    ? stations.find((s) => s.id === stationId)?.name ?? `Estação #${stationId}`
    : propertyId !== undefined ? "Estações da propriedade selecionada" : "Todas as estações";
  const unavailable = occurrences.isError && !occurrences.data;

  function selectOccurrence(occurrence: Occurrence) {
    resolve.reset();
    setSelected(occurrence);
  }

  function closeModal() {
    if (resolve.isPending) return;
    setSelected(null);
    setOpen(false);
  }

  async function confirmResolve() {
    if (!selected || resolve.isPending) return;
    try {
      await resolve.mutateAsync(selected.id);
      setNotice(`Ocorrência #${selected.id} marcada como resolvida.`);
      setSelected(null);
    } catch {
      // A confirmação permanece aberta e apresenta a mensagem da API.
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Falhas em aberto"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setPage(1); setNotice(""); setOpen(true); }}
        className="group min-w-0 p-5 text-left transition-colors hover:bg-canvas/70 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-muted">
          <span className="inline-flex items-center gap-1.5">
            <TriangleAlert className="size-3.5 text-danger" aria-hidden />
            Falhas em aberto
          </span>
          <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
        {occurrences.isLoading ? (
          <span className="mt-1.5 block" role="status" aria-label="Carregando falhas">
            <Skeleton className="h-9 w-12" />
          </span>
        ) : (
          <span className="mt-1.5 block text-3xl font-semibold tabular-nums">
            {unavailable ? "—" : rows.length}
          </span>
        )}
        <span className="mt-1 block text-xs text-faint">
          {occurrences.isError ? "Falha na atualização · ver detalhes" : "Ocorrências de manutenção"}
        </span>
      </button>

      <Modal open={open} onClose={closeModal} title={selected ? "Resolver ocorrência" : "Falhas em aberto"} size="lg"
        description={`${scope}. Falhas de comunicação e leituras fora dos limites configurados.`}
        footer={selected ? (
          <>
            <Button variant="secondary" disabled={resolve.isPending} onClick={() => setSelected(null)}>Cancelar</Button>
            <Button loading={resolve.isPending} onClick={() => void confirmResolve()}>Confirmar resolução</Button>
          </>
        ) : <Button variant="secondary" onClick={closeModal}>Fechar detalhes</Button>}
      >
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              Marcar a ocorrência #{selected.id} de {selected.station_name} como resolvida?
              Ela sairá da lista de falhas em aberto.
            </p>
            <p className="break-words text-sm text-muted">{selected.description}</p>
            {selected.type === "COMMUNICATION_FAILURE" && (
              <p className="rounded-lg bg-warn-soft p-3 text-sm text-ink">
                Se a estação continuar sem comunicar, uma nova ocorrência poderá ser aberta automaticamente.
              </p>
            )}
            {resolve.error && <p role="alert" className="text-sm text-danger">{resolve.error.message}</p>}
          </div>
        ) : occurrences.isLoading ? (
          <div role="status" aria-label="Carregando ocorrências" className="space-y-3">
            <Skeleton className="h-24" /><Skeleton className="h-24" />
          </div>
        ) : unavailable ? (
          <ErrorState message={occurrences.error.message} onRetry={() => void occurrences.refetch()} />
        ) : (
          <div className="space-y-4">
            {notice && <p role="status" className="rounded-lg bg-ok-soft p-3 text-sm text-ink">{notice}</p>}
            {occurrences.isError && (
              <div role="alert" className="rounded-lg bg-warn-soft p-3 text-sm text-ink">
                Não foi possível atualizar. Exibindo as últimas ocorrências carregadas.
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => void occurrences.refetch()}>Tentar de novo</Button>
              </div>
            )}
            <p className="text-[13px] text-muted">
              {rows.length} {rows.length === 1 ? "ocorrência aberta" : "ocorrências abertas"}.
              Uma estação ou sensor pode ter mais de uma ocorrência.
              A lista atualiza automaticamente a cada 30 s.
            </p>
            {rows.length === 0 ? (
              <EmptyState title="Nenhuma falha em aberto" description="Não há ocorrências abertas para os filtros selecionados." />
            ) : (
              <ul aria-label="Ocorrências em aberto" className="space-y-3">
                {visible.map((occurrence) => <OccurrenceDetails key={occurrence.id} occurrence={occurrence} onResolve={() => selectOccurrence(occurrence)} />)}
              </ul>
            )}
            {pages > 1 && (
              <nav aria-label="Paginação das ocorrências" className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
                <span className="text-xs text-muted">Página {currentPage} de {pages}</span>
                <Button variant="secondary" size="sm" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
              </nav>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function OccurrenceDetails({ occurrence: o, onResolve }: { occurrence: Occurrence; onResolve: () => void }) {
  const communication = o.type === "COMMUNICATION_FAILURE";
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-ink">
          {communication ? "Falha de comunicação" : "Leitura fora dos limites"}
        </h3>
        <Badge tone="danger" dot>Em aberto</Badge>
      </div>
      <div className="mt-3 rounded-lg bg-subtle/60 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink">Descrição da falha</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{o.description}</p>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Estação</dt>
          <dd className="mt-1 text-ink"><Link className="font-medium text-brand-700 hover:underline" href={`/estacoes/${o.station_id}`}>{o.station_name}</Link> <span className="text-xs text-faint">#{o.station_id}</span></dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Detectada em · Brasília</dt>
          <dd className="mt-1 text-ink"><time dateTime={o.detected_at}>{formatDate(o.detected_at)} · {formatHour(o.detected_at)}</time></dd>
        </div>
        {o.sensor_id !== null && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Sensor</dt>
            <dd className="mt-1 break-words text-ink">{o.sensor_identifier ?? `Sensor #${o.sensor_id}`} · #{o.sensor_id}{o.sensor_type ? ` · ${o.sensor_type}` : ""}</dd>
          </div>
        )}
        {o.value !== null && (
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Valor registrado</dt><dd className="mt-1 font-semibold tabular-nums text-ink">{formatNumber(o.value)}</dd></div>
        )}
        {o.reading_id !== null && (
          <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Leitura</dt><dd className="mt-1 text-ink">#{o.reading_id}</dd></div>
        )}
        <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-ink">Ocorrência</dt><dd className="mt-1 text-ink">#{o.id}</dd></div>
      </dl>
      <div className="mt-4 flex justify-end border-t border-line pt-3">
        <Button variant="secondary" size="sm" aria-label={`Marcar como resolvida ocorrência #${o.id}`} onClick={onResolve}>
          Marcar como resolvida
        </Button>
      </div>
    </li>
  );
}
