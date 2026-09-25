import { FetchHttpClient, type HttpClient } from "@/lib/http/HttpClient";
import type {
  ApiAlertConfigDto,
  ApiPaginatedAlertConfigsDto,
  ApiPaginatedTriggeredAlertsDto,
} from "../dtos/alertApiDto";
import {
  mapAlertItemToApiConfigInput,
  mapApiAlertConfigToAlertItem,
} from "../mappers/alertApiMapper";
import type { SensorCatalogItem, StationCatalogItem } from "../mocks/alertsData";
import type { AlertItem } from "../types/alert";
import {
  type AlertListOptions,
  type AlertRepository,
  type CreateAlertConfigInput,
  type PaginatedAlerts,
  resolveAlertListOptions,
  type UpdateAlertConfigInput,
} from "./AlertRepository";
import { MockAlertRepository } from "./MockAlertRepository";

export class ApiAlertRepository implements AlertRepository {
  private readonly baseUrl: string;
  private readonly client: HttpClient;
  private readonly fallbackMock: MockAlertRepository;

  constructor(
    baseUrl = process.env.NEXT_PUBLIC_ALERTS_API_URL || "/api/alerts",
    client: HttpClient = new FetchHttpClient(),
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.client = client;
    this.fallbackMock = new MockAlertRepository();
  }

  private buildUrl(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
  ): URL {
    const isAbsolute =
      this.baseUrl.startsWith("http://") || this.baseUrl.startsWith("https://");
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:3000";

    const base = isAbsolute ? this.baseUrl : `${origin}${this.baseUrl}`;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base.replace(/\/$/, "")}${cleanPath}`);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url;
  }

  async listAlerts(options?: AlertListOptions): Promise<PaginatedAlerts> {
    const { page, limit, sensorId, managerUserId } =
      resolveAlertListOptions(options);

    try {
      const queryParams: Record<string, string | number | undefined> = {
        page,
        limit,
      };
      if (sensorId > 0) queryParams.sensor_id = sensorId;
      if (managerUserId > 0) queryParams.manager_user_id = managerUserId;

      const [configsRes, triggeredRes] = await Promise.all([
        this.client.request(this.buildUrl("/config", queryParams), {
          method: "GET",
          headers: { Accept: "application/json" },
        }),
        this.client
          .request(this.buildUrl("/triggered", { limit: 100 }), {
            method: "GET",
            headers: { Accept: "application/json" },
          })
          .catch(() => null),
      ]);

      if (!configsRes.ok) {
        throw new Error(
          `Falha ao buscar alertas: HTTP ${configsRes.status} ${configsRes.statusText}`,
        );
      }

      const configsData: ApiPaginatedAlertConfigsDto =
        await configsRes.json();
      const triggeredData: ApiPaginatedTriggeredAlertsDto | null =
        triggeredRes && triggeredRes.ok ? await triggeredRes.json() : null;

      const stations = await this.listStations();
      const sensors = await this.listSensors();

      const items: AlertItem[] = configsData.data.map((config) => {
        const latestTrigger = triggeredData?.data.find(
          (t) => t.alert_config_id === config.id,
        );
        return mapApiAlertConfigToAlertItem(config, {
          sensors,
          stations,
          latestTrigger,
        });
      });

      return {
        items,
        pagination: {
          totalRecords: configsData.meta.total_records,
          totalPages: configsData.meta.total_pages,
          currentPage: configsData.meta.current_page,
        },
      };
    } catch (error) {
      console.warn(
        "[ApiAlertRepository] Backend offline ou indisponível. Usando fallback de mock.",
        error,
      );
      return this.fallbackMock.listAlerts(options);
    }
  }

  async getAlertById(id: number): Promise<AlertItem | null> {
    try {
      const response = await this.client.request(this.buildUrl(`/config/${id}`), {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Falha ao buscar alerta #${id}: HTTP ${response.status}`);
      }

      const config: ApiAlertConfigDto = await response.json();
      const stations = await this.listStations();
      const sensors = await this.listSensors();

      return mapApiAlertConfigToAlertItem(config, { sensors, stations });
    } catch (error) {
      console.warn(`[ApiAlertRepository] getAlertById fallback para #${id}:`, error);
      return this.fallbackMock.getAlertById(id);
    }
  }

  async createAlertConfig(input: CreateAlertConfigInput): Promise<AlertItem> {
    const body = mapAlertItemToApiConfigInput(input);

    try {
      const response = await this.client.request(this.buildUrl("/config"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.message || `HTTP ${response.status}`;
        throw new Error(`Erro ao criar alerta: ${msg}`);
      }

      const created: ApiAlertConfigDto = await response.json();
      const stations = await this.listStations();
      const sensors = await this.listSensors();

      return mapApiAlertConfigToAlertItem(created, { sensors, stations });
    } catch (error) {
      console.warn(
        "[ApiAlertRepository] Erro no backend ao criar alerta. Usando fallback Mock:",
        error,
      );
      return this.fallbackMock.createAlertConfig(input);
    }
  }

  async updateAlertConfig(
    id: number,
    input: UpdateAlertConfigInput,
  ): Promise<AlertItem> {
    const body = mapAlertItemToApiConfigInput(input);

    try {
      const response = await this.client.request(this.buildUrl(`/config/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.message || `HTTP ${response.status}`;
        throw new Error(`Erro ao atualizar alerta #${id}: ${msg}`);
      }

      const updated: ApiAlertConfigDto = await response.json();
      const stations = await this.listStations();
      const sensors = await this.listSensors();

      return mapApiAlertConfigToAlertItem(updated, { sensors, stations });
    } catch (error) {
      console.warn(
        `[ApiAlertRepository] Erro no backend ao atualizar #${id}. Usando fallback Mock:`,
        error,
      );
      return this.fallbackMock.updateAlertConfig(id, input);
    }
  }

  async deleteAlertConfig(id: number): Promise<void> {
    try {
      const response = await this.client.request(this.buildUrl(`/config/${id}`), {
        method: "DELETE",
      });

      if (response.status !== 204 && response.status !== 200) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.message || `HTTP ${response.status}`;
        throw new Error(`Erro ao excluir alerta #${id}: ${msg}`);
      }
    } catch (error) {
      console.warn(
        `[ApiAlertRepository] Erro no backend ao excluir #${id}. Usando fallback Mock:`,
        error,
      );
      return this.fallbackMock.deleteAlertConfig(id);
    }
  }

  async acknowledgeAlert(id: number): Promise<void> {
    try {
      const response = await this.client.request(
        this.buildUrl(`/triggered/${id}/acknowledge`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ acknowledged_by: 1 }),
        },
      );

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const msg = errorJson?.message || `HTTP ${response.status}`;
        throw new Error(`Erro ao reconhecer alerta #${id}: ${msg}`);
      }
    } catch (error) {
      console.warn(
        `[ApiAlertRepository] Erro no backend ao reconhecer #${id}. Usando fallback Mock:`,
        error,
      );
      return this.fallbackMock.acknowledgeAlert(id);
    }
  }

  async listStations(): Promise<StationCatalogItem[]> {
    return this.fallbackMock.listStations();
  }

  async listSensors(stationId?: number): Promise<SensorCatalogItem[]> {
    return this.fallbackMock.listSensors(stationId);
  }
}
