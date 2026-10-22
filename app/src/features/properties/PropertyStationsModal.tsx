"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useStations } from "@/features/stations/hooks";

import type { Property } from "./api";
import { useAssociateStation } from "./hooks";

export function PropertyStationsModal({
  open,
  property,
  onClose,
}: {
  open: boolean;
  property: Property | undefined;
  onClose: () => void;
}) {
  const stationsQuery = useStations();
  const associate = useAssociateStation();
  const toast = useToast();

  const stations = useMemo(() => stationsQuery.data ?? [], [stationsQuery.data]);

  const { linkedStations, availableStations } = useMemo(() => {
    if (!property) return { linkedStations: [], availableStations: [] };
    const linked = stations.filter((s) => s.property_id === property.id);
    const available = stations.filter((s) => s.property_id !== property.id);
    return { linkedStations: linked, availableStations: available };
  }, [stations, property]);

  async function handleLink(stationId: number, stationName: string) {
    if (!property) return;
    try {
      await associate.mutateAsync({ stationId, propertyId: property.id });
      toast.success(`Estação "${stationName}" vinculada a "${property.name}".`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  if (!property) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Associar estações · ${property.name}`}
      description="Gerencie as estações meteorológicas vinculadas a esta propriedade agrícola."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Concluir
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Estações já vinculadas */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Estações vinculadas atualmente ({linkedStations.length})
          </h4>
          {linkedStations.length === 0 ? (
            <p className="mt-1 text-xs text-faint">
              Nenhuma estação vinculada a esta propriedade ainda.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {linkedStations.map((st) => (
                <span
                  key={st.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle/50 px-2.5 py-1 text-xs font-medium text-ink"
                >
                  <span className="size-1.5 rounded-full bg-brand-500" />
                  {st.name} <span className="font-mono text-faint">({st.mac_address})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Estações disponíveis para associação */}
        <div className="border-t border-line pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Estações disponíveis na rede ({availableStations.length})
          </h4>
          {stationsQuery.isLoading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : availableStations.length === 0 ? (
            <p className="mt-2 text-xs text-faint">
              Todas as estações já estão vinculadas a esta propriedade.
            </p>
          ) : (
            <div className="mt-2 max-h-60 divide-y divide-line overflow-y-auto rounded-xl border border-line bg-surface">
              {availableStations.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-subtle/40"
                >
                  <div>
                    <span className="font-medium text-ink">{st.name}</span>
                    <span className="ml-2 font-mono text-faint">{st.mac_address}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={associate.isPending}
                    onClick={() => handleLink(st.id, st.name)}
                  >
                    Associar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
