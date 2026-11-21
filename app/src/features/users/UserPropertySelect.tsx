"use client";

import type { Property } from "@/features/properties/api";

export function UserPropertySelect({
  properties,
  selected,
  onChange,
  loading,
  error,
  disabled,
}: {
  properties: Property[];
  selected: number[];
  onChange: (ids: number[]) => void;
  loading: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <fieldset
      disabled={disabled || loading || Boolean(error)}
      className="grid gap-2 rounded-xl border border-line p-3"
    >
      <legend className="px-1 text-sm font-medium">
        Propriedades permitidas
      </legend>
      <p className="text-xs text-muted">
        Selecione as propriedades que este usuário poderá acessar. Sem vínculos,
        ele não visualizará dados de propriedades.
      </p>
      {loading ? (
        <p role="status">Carregando propriedades…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : properties.length === 0 ? (
        <p>Nenhuma propriedade cadastrada.</p>
      ) : (
        properties.map((property) => (
          <label key={property.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(property.id)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, property.id]
                    : selected.filter((id) => id !== property.id),
                )
              }
            />
            {property.name}
          </label>
        ))
      )}
    </fieldset>
  );
}
