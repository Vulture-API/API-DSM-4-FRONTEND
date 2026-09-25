import type {
  CreateStationInput,
  PaginatedStations,
  Property,
  Station,
  StationListOptions,
  UpdateStationInput,
} from "../types/station";
import {
  resolveStationListOptions,
  type StationRepository,
} from "./StationRepository";

const mockProperties: Property[] = [
  { id: 1, name: "Fazenda Santa Clara", location: "Piracicaba - SP" },
  { id: 2, name: "Sítio Boa Vista", location: "Jacareí - SP" },
  { id: 3, name: "Fazenda Santa Rita", location: "São José dos Campos - SP" },
  { id: 4, name: "Fazenda Boa Vista", location: "Taubaté - SP" },
  { id: 5, name: "Fazenda Esperança", location: "Jacareí - SP" },
  { id: 6, name: "Fazenda Água Limpa", location: "Pindamonhangaba - SP" },
];

const initialMockStations: Station[] = [
  {
    id: 1,
    name: "Estação 01",
    propertyId: 3,
    propriedade: "Fazenda Santa Rita",
    macAddress: "00:1A:2B:3C:4D:01",
    latitude: -23.1791,
    longitude: -45.8872,
    status: "ativo",
    lastCommunicationAt: "Há 2 min",
    lastCommunicationMinutesAgo: 2,
    createdAt: "15/01/2025",
    umidadeSolo: 34,
    varUmidade: "↑ 1% (24h)",
    tempSolo: 22.8,
    varTempSolo: "↑ 0,4°C (24h)",
    tempAr: 24.5,
    varTempAr: "↑ 0,9°C (24h)",
  },
  {
    id: 2,
    name: "Estação 02",
    propertyId: 3,
    propriedade: "Fazenda Santa Rita",
    macAddress: "00:1A:2B:3C:4D:02",
    latitude: -23.1755,
    longitude: -45.879,
    status: "ativo",
    lastCommunicationAt: "Há 5 min",
    lastCommunicationMinutesAgo: 5,
    createdAt: "18/01/2025",
    umidadeSolo: 29,
    varUmidade: "↓ 1% (24h)",
    tempSolo: 23.0,
    varTempSolo: "↑ 0,5°C (24h)",
    tempAr: 26.1,
    varTempAr: "↑ 1,5°C (24h)",
  },
  {
    id: 3,
    name: "Estação 03",
    propertyId: 3,
    propriedade: "Fazenda Santa Rita",
    macAddress: "00:1A:2B:3C:4D:03",
    latitude: -23.1702,
    longitude: -45.876,
    status: "ativo",
    lastCommunicationAt: "Agora mesmo",
    lastCommunicationMinutesAgo: 0,
    createdAt: "20/01/2025",
    umidadeSolo: 32,
    varUmidade: "↑ 2% (24h)",
    tempSolo: 23.4,
    varTempSolo: "↑ 0,8°C (24h)",
    tempAr: 25.6,
    varTempAr: "↑ 1,2°C (24h)",
  },
  {
    id: 4,
    name: "Estação 04",
    propertyId: 4,
    propriedade: "Fazenda Boa Vista",
    macAddress: "00:1A:2B:3C:4D:04",
    latitude: -23.1868,
    longitude: -45.8901,
    status: "inativo",
    lastCommunicationAt: "Há 1 h 15 min",
    lastCommunicationMinutesAgo: 75,
    createdAt: "02/02/2025",
    umidadeSolo: 18,
    varUmidade: "↓ 8% (24h)",
    tempSolo: 27.2,
    varTempSolo: "↑ 2,1°C (24h)",
    tempAr: 29.4,
    varTempAr: "↑ 3,0°C (24h)",
  },
];

export class MockStationRepository implements StationRepository {
  private stations: Station[] = [...initialMockStations];
  private properties: Property[] = [...mockProperties];

  async listProperties(): Promise<Property[]> {
    return [...this.properties];
  }

  async list(options?: StationListOptions): Promise<PaginatedStations> {
    const { page, limit, propertyId } = resolveStationListOptions(options);

    const filtered = propertyId
      ? this.stations.filter((s) => s.propertyId === propertyId)
      : this.stations;

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      pagination: {
        totalRecords: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
        currentPage: page,
      },
    };
  }

  async getById(id: number): Promise<Station | null> {
    return this.stations.find((s) => s.id === id) ?? null;
  }

  async create(input: CreateStationInput): Promise<Station> {
    const existing = this.stations.find(
      (s) => s.macAddress.toUpperCase() === input.mac_address.toUpperCase(),
    );
    if (existing) {
      throw new Error("Já existe uma estação cadastrada com este endereço MAC.");
    }

    const nextId =
      this.stations.length > 0
        ? Math.max(...this.stations.map((s) => s.id)) + 1
        : 1;

    const prop = this.properties.find((p) => p.id === input.property_id);

    const newStation: Station = {
      id: nextId,
      name: input.name,
      propertyId: input.property_id,
      propriedade: prop ? prop.name : `Propriedade #${input.property_id}`,
      macAddress: input.mac_address.toUpperCase(),
      latitude: input.latitude ?? -23.18,
      longitude: input.longitude ?? -45.88,
      status: "ativo",
      lastCommunicationAt: "Agora mesmo",
      lastCommunicationMinutesAgo: 0,
      createdAt: "Hoje",
      umidadeSolo: 32,
      varUmidade: "↑ 1% (24h)",
      tempSolo: 23.0,
      varTempSolo: "↑ 0,5°C (24h)",
      tempAr: 25.0,
      varTempAr: "↑ 1,0°C (24h)",
    };

    this.stations = [newStation, ...this.stations];
    return newStation;
  }

  async update(id: number, input: UpdateStationInput): Promise<Station> {
    const index = this.stations.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error("Estação não encontrada.");
    }

    const conflict = this.stations.find(
      (s) =>
        s.id !== id &&
        s.macAddress.toUpperCase() === input.mac_address.toUpperCase(),
    );
    if (conflict) {
      throw new Error("Já existe uma estação cadastrada com este endereço MAC.");
    }

    const prop = this.properties.find((p) => p.id === input.property_id);
    const existing = this.stations[index];

    const updated: Station = {
      ...existing,
      name: input.name,
      propertyId: input.property_id,
      propriedade: prop ? prop.name : existing.propriedade,
      macAddress: input.mac_address.toUpperCase(),
      latitude: input.latitude ?? existing.latitude,
      longitude: input.longitude ?? existing.longitude,
    };

    this.stations[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.stations = this.stations.filter((s) => s.id !== id);
  }
}
