import { type Paginated, request } from "@/lib/api/http";

export type Property = {
  id: number;
  name: string;
  location: string | null;
  owner?: string | null;
  owner_id?: number | null;
  created_at?: string;
};

export type PropertyInput = {
  name: string;
  location?: string | null;
  owner?: string | null;
  owner_id?: number | null;
};

export const propertiesApi = {
  list: async (): Promise<Property[]> => {
    try {
      const res = await request<Property[] | Paginated<Property>>("/api/properties");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as Paginated<Property>).data)) {
        return (res as Paginated<Property>).data;
      }
      return [];
    } catch {
      // Fallback para endpoint legado /api/stations/properties se /api/properties falhar
      const fallback = await request<Property[]>("/api/stations/properties");
      return Array.isArray(fallback) ? fallback : [];
    }
  },
  get: (id: number) => request<Property>(`/api/properties/${id}`),
  create: (data: PropertyInput) =>
    request<Property>("/api/properties", {
      method: "POST",
      json: data,
    }),
  update: (id: number, data: PropertyInput) =>
    request<Property>(`/api/properties/${id}`, {
      method: "PUT",
      json: data,
    }),
  delete: (id: number) =>
    request<{ ok: boolean }>(`/api/properties/${id}`, {
      method: "DELETE",
    }),
  associateStation: (stationId: number, propertyId: number) =>
    request<{ ok: boolean }>(`/api/stations/${stationId}`, {
      method: "PUT",
      json: { property_id: propertyId },
    }),
};
