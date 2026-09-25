import { FetchHttpClient, type HttpClient } from "@/lib/http/HttpClient";
import type {
  PaginatedStationsApiDto,
  PropertyApiDto,
  StationApiDto,
} from "../dtos/stationApiDto";
import {
  mapApiProperty,
  mapApiStation,
} from "../mappers/stationApiMapper";
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

const fallbackProperties: Property[] = [
  { id: 1, name: "Fazenda Santa Clara", location: "Piracicaba - SP" },
  { id: 2, name: "Sítio Boa Vista", location: "Jacareí - SP" },
  { id: 3, name: "Fazenda Santa Rita", location: "São José dos Campos - SP" },
  { id: 4, name: "Fazenda Boa Vista", location: "Taubaté - SP" },
  { id: 5, name: "Fazenda Esperança", location: "Jacareí - SP" },
  { id: 6, name: "Fazenda Água Limpa", location: "Pindamonhangaba - SP" },
];

export class ApiStationRepository implements StationRepository {
  private propertiesRequest?: Promise<Property[]>;

  constructor(
    private readonly client: HttpClient = new FetchHttpClient(),
    private readonly baseUrl =
      process.env.NEXT_PUBLIC_STATIONS_API_URL || "/api/stations",
  ) {}

  private buildUrl(path: string): URL {
    const cleanedBase = this.baseUrl.replace(/\/$/, "");

    if (cleanedBase.startsWith("http://") || cleanedBase.startsWith("https://")) {
      const fullPath = cleanedBase.endsWith("/api/stations")
        ? `${cleanedBase}${path.replace(/^\/stations/, "")}`
        : `${cleanedBase}${path}`;
      return new URL(fullPath);
    }

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3010";

    const relativePath = cleanedBase.endsWith("/stations")
      ? `${cleanedBase}${path.replace(/^\/stations/, "")}`
      : `${cleanedBase}${path}`;

    return new URL(relativePath, origin);
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `Erro na requisição (HTTP ${response.status})`;
    let errorCode = "";

    try {
      const data = (await response.json()) as { message?: string; code?: string };
      if (data && typeof data === "object") {
        if (data.code) errorCode = data.code;
        if (data.message) errorMessage = data.message;
      }
    } catch {
      // Ignora falha se não for JSON
    }

    if (errorCode === "DUPLICATE_MAC_ADDRESS" || response.status === 409) {
      if (errorCode === "PROPERTY_NOT_FOUND") {
        throw new Error("A propriedade vinculada não foi encontrada no banco.");
      }
      throw new Error("Já existe uma estação cadastrada com este endereço MAC.");
    }

    if (response.status === 404) {
      throw new Error(`Estação não encontrada: ${errorMessage}`);
    }

    if (response.status === 400) {
      throw new Error(`Dados inválidos: ${errorMessage}`);
    }

    throw new Error(errorMessage);
  }

  async listProperties(): Promise<Property[]> {
    if (!this.propertiesRequest) {
      this.propertiesRequest = this.fetchProperties().catch(() => {
        return fallbackProperties;
      });
    }

    return (await this.propertiesRequest).map((prop) => ({ ...prop }));
  }

  private async fetchProperties(): Promise<Property[]> {
    try {
      const url = this.buildUrl("/properties");
      const response = await this.client.request(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return fallbackProperties;
      }

      const data = (await response.json()) as PropertyApiDto[];
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapApiProperty);
      }
      return fallbackProperties;
    } catch {
      return fallbackProperties;
    }
  }

  async list(options?: StationListOptions): Promise<PaginatedStations> {
    const { page, limit, propertyId } = resolveStationListOptions(options);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (propertyId) {
      query.set("property_id", String(propertyId));
    }

    const [response, properties] = await Promise.all([
      this.client.request(this.buildUrl(`?${query.toString()}`), {
        method: "GET",
        headers: { Accept: "application/json" },
      }),
      this.listProperties(),
    ]);

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as PaginatedStationsApiDto;

    return {
      items: data.data.map((station) => mapApiStation(station, properties)),
      pagination: {
        totalRecords: data.meta.total_records,
        totalPages: data.meta.total_pages,
        currentPage: data.meta.current_page,
      },
    };
  }

  async getById(id: number): Promise<Station | null> {
    const [response, properties] = await Promise.all([
      this.client.request(this.buildUrl(`/${id}`), {
        method: "GET",
        headers: { Accept: "application/json" },
      }),
      this.listProperties(),
    ]);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as StationApiDto;
    return mapApiStation(data, properties);
  }

  async create(input: CreateStationInput): Promise<Station> {
    const [response, properties] = await Promise.all([
      this.client.request(this.buildUrl(""), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(input),
      }),
      this.listProperties(),
    ]);

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as StationApiDto;
    return mapApiStation(data, properties);
  }

  async update(id: number, input: UpdateStationInput): Promise<Station> {
    const [response, properties] = await Promise.all([
      this.client.request(this.buildUrl(`/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(input),
      }),
      this.listProperties(),
    ]);

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as StationApiDto;
    return mapApiStation(data, properties);
  }

  async delete(id: number): Promise<void> {
    const response = await this.client.request(this.buildUrl(`/${id}`), {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });

    if (!response.ok && response.status !== 404) {
      await this.handleErrorResponse(response);
    }
  }
}
