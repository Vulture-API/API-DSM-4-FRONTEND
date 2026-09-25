import type {
  CreateStationInput,
  PaginatedStations,
  Property,
  Station,
  StationListOptions,
  UpdateStationInput,
} from "../types/station";

export function resolveStationListOptions(options?: StationListOptions): {
  page: number;
  limit: number;
  propertyId?: number;
} {
  return {
    page: options?.page && options.page > 0 ? options.page : 1,
    limit: options?.limit && options.limit > 0 ? options.limit : 10,
    propertyId: options?.propertyId,
  };
}

export interface StationRepository {
  list(options?: StationListOptions): Promise<PaginatedStations>;
  listProperties(): Promise<Property[]>;
  getById(id: number): Promise<Station | null>;
  create(input: CreateStationInput): Promise<Station>;
  update(id: number, input: UpdateStationInput): Promise<Station>;
  delete(id: number): Promise<void>;
}
