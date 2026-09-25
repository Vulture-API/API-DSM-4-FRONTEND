import type { Parameter, ParameterValues } from "../types/parameter";
import type { ParameterRepository } from "./ParameterRepository";
import { type HttpClient, FetchHttpClient } from "@/lib/http/HttpClient";

export interface SensorTypeDto {
  id: number;
  name: string;
  unit_of_measure: string;
  factor?: number | null;
  gain?: number | null;
}

export interface SensorTypeInputDto {
  name: string;
  unit_of_measure: string;
  factor?: number | null;
  gain?: number | null;
}

export function toSensorTypeDto(values: ParameterValues): SensorTypeInputDto {
  return {
    name: values.nome,
    unit_of_measure: values.unidade_medida,
    factor: values.fator,
    gain: values.ganho,
  };
}

export function toParameterDomain(dto: SensorTypeDto): Parameter {
  return {
    id: dto.id,
    nome: dto.name,
    unidade_medida: dto.unit_of_measure,
    fator: dto.factor ?? null,
    ganho: dto.gain ?? null,
  };
}

export class ApiParameterRepository implements ParameterRepository {
  private readonly baseUrl: string;
  private readonly client: HttpClient;

  constructor(
    baseUrl = process.env.NEXT_PUBLIC_PARAMETERS_API_URL || "http://localhost:3004",
    client: HttpClient = new FetchHttpClient(),
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.client = client;
  }

  private buildUrl(path: string): URL {
    if (this.baseUrl.startsWith("http://") || this.baseUrl.startsWith("https://")) {
      return new URL(path, this.baseUrl);
    }
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000";
    return new URL(`${this.baseUrl}${path}`, origin);
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `Erro na requisição (${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof data === "object" && "message" in data) {
        errorMessage = String(data.message);
      }
    } catch {
      // Ignora falha de deserialização caso o corpo não seja JSON
    }

    if (response.status === 409) {
      throw new Error(`Conflito: ${errorMessage}`);
    }
    if (response.status === 404) {
      throw new Error(`Registro não encontrado: ${errorMessage}`);
    }
    throw new Error(errorMessage);
  }

  async list(): Promise<Parameter[]> {
    const url = this.buildUrl("/sensor-types");
    const response = await this.client.request(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as SensorTypeDto[];
    return data.map(toParameterDomain);
  }

  async create(values: ParameterValues): Promise<Parameter> {
    const url = this.buildUrl("/sensor-types");
    const response = await this.client.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(toSensorTypeDto(values)),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as SensorTypeDto;
    return toParameterDomain(data);
  }

  async update(id: number, values: ParameterValues): Promise<Parameter> {
    const url = this.buildUrl(`/sensor-types/${id}`);
    const response = await this.client.request(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(toSensorTypeDto(values)),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = (await response.json()) as SensorTypeDto;
    return toParameterDomain(data);
  }

  async remove(id: number): Promise<void> {
    const url = this.buildUrl(`/sensor-types/${id}`);
    const response = await this.client.request(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
  }
}
