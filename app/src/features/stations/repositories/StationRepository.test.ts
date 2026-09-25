import { describe, expect, it, vi } from "vitest";
import {
  mapApiProperty,
  mapApiStation,
  mapCreateStationInput,
  mapUpdateStationInput,
} from "../mappers/stationApiMapper";
import type { StationFormValues } from "../types/station";
import { ApiStationRepository } from "./ApiStationRepository";
import { MockStationRepository } from "./MockStationRepository";

describe("Station Mappers", () => {
  const propertyMock = {
    id: 1,
    name: "Fazenda Santa Clara",
    location: "Piracicaba - SP",
  };

  it("mapeia propriedade da API para o domínio", () => {
    const prop = mapApiProperty({
      id: 1,
      name: "Fazenda Santa Clara",
      location: "Piracicaba - SP",
    });
    expect(prop).toEqual({
      id: 1,
      name: "Fazenda Santa Clara",
      location: "Piracicaba - SP",
    });
  });

  it("mapeia estação da API com propriedade associada e status ativo se recente", () => {
    const nowIso = new Date().toISOString();
    const station = mapApiStation(
      {
        id: 1,
        property_id: 1,
        mac_address: "AA:BB:CC:DD:EE:01",
        name: "Estação Teste",
        latitude: -23.18,
        longitude: -45.88,
        last_communication_at: nowIso,
        created_at: "2026-01-15T10:00:00.000Z",
      },
      [propertyMock],
    );

    expect(station.id).toBe(1);
    expect(station.name).toBe("Estação Teste");
    expect(station.propriedade).toBe("Fazenda Santa Clara");
    expect(station.status).toBe("ativo");
    expect(station.macAddress).toBe("AA:BB:CC:DD:EE:01");
    expect(station.lastCommunicationMinutesAgo).toBe(0);
  });

  it("mapeia status inativo se última comunicação for nula ou antiga", () => {
    const station = mapApiStation(
      {
        id: 2,
        property_id: 99,
        mac_address: "AA:BB:CC:DD:EE:02",
        name: "Estação Inativa",
        latitude: null,
        longitude: null,
        last_communication_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      [],
    );

    expect(station.status).toBe("inativo");
    expect(station.propriedade).toBe("Propriedade #99");
    expect(station.lastCommunicationAt).toBe("Sem comunicação");
    expect(station.lastCommunicationMinutesAgo).toBeNull();
  });

  it("mapeia inputs de criação e edição normalizando mac e campos", () => {
    const form: StationFormValues = {
      name: " Estação Norte ",
      propertyId: "1",
      macAddress: "aa:bb:cc:dd:ee:ff",
      latitude: "-23.50",
      longitude: "-46.60",
      status: "ativo",
    };

    const input = mapCreateStationInput(form);
    expect(input).toEqual({
      name: "Estação Norte",
      property_id: 1,
      mac_address: "AA:BB:CC:DD:EE:FF",
      latitude: -23.5,
      longitude: -46.6,
    });

    const updateInput = mapUpdateStationInput(form);
    expect(updateInput).toEqual(input);
  });
});

describe("MockStationRepository", () => {
  it("lista estações mock com paginação", async () => {
    const repo = new MockStationRepository();
    const result = await repo.list({ page: 1, limit: 2 });
    expect(result.items.length).toBe(2);
    expect(result.pagination.totalRecords).toBeGreaterThanOrEqual(4);
    expect(result.pagination.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("cria estação no mock e impede MAC duplicado", async () => {
    const repo = new MockStationRepository();
    const created = await repo.create({
      name: "Nova Estação",
      property_id: 1,
      mac_address: "11:22:33:44:55:66",
      latitude: -23.18,
      longitude: -45.88,
    });

    expect(created.name).toBe("Nova Estação");
    expect(created.macAddress).toBe("11:22:33:44:55:66");

    await expect(
      repo.create({
        name: "Outra",
        property_id: 1,
        mac_address: "11:22:33:44:55:66",
        latitude: null,
        longitude: null,
      }),
    ).rejects.toThrow("Já existe uma estação cadastrada com este endereço MAC.");
  });

  it("atualiza e remove estação no mock", async () => {
    const repo = new MockStationRepository();
    const updated = await repo.update(1, {
      name: "Estação 01 Editada",
      property_id: 1,
      mac_address: "00:1A:2B:3C:4D:01",
      latitude: -23.2,
      longitude: -45.9,
    });
    expect(updated.name).toBe("Estação 01 Editada");

    await repo.delete(1);
    const deleted = await repo.getById(1);
    expect(deleted).toBeNull();
  });
});

describe("ApiStationRepository", () => {
  const stationDto = {
    id: 1,
    property_id: 1,
    mac_address: "AA:BB:CC:DD:EE:01",
    name: "Estação 1",
    latitude: -23.18,
    longitude: -45.88,
    last_communication_at: new Date().toISOString(),
    created_at: "2026-01-01T00:00:00.000Z",
  };

  const paginatedResponse = {
    data: [stationDto],
    meta: {
      total_records: 1,
      total_pages: 1,
      current_page: 1,
    },
  };

  it("lista estações mapeando resposta da API e propriedades", async () => {
    const client = {
      request: vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(paginatedResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([{ id: 1, name: "Fazenda Santa Clara", location: "SP" }]),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    const result = await repo.list();

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe("Estação 1");
    expect(result.pagination.totalRecords).toBe(1);
  });

  it("busca estação por id", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(stationDto), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    const station = await repo.getById(1);

    expect(station?.id).toBe(1);
    expect(station?.name).toBe("Estação 1");
  });

  it("retorna null quando estação não é encontrada (404)", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    const station = await repo.getById(999);
    expect(station).toBeNull();
  });

  it("cria estação com sucesso", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(stationDto), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    const created = await repo.create({
      name: "Estação 1",
      property_id: 1,
      mac_address: "AA:BB:CC:DD:EE:01",
      latitude: -23.18,
      longitude: -45.88,
    });

    expect(created.id).toBe(1);
  });

  it("atualiza estação com sucesso", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(stationDto), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    const updated = await repo.update(1, {
      name: "Estação 1",
      property_id: 1,
      mac_address: "AA:BB:CC:DD:EE:01",
      latitude: -23.18,
      longitude: -45.88,
    });

    expect(updated.id).toBe(1);
  });

  it("exclui estação com sucesso (204)", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    await expect(repo.delete(1)).resolves.toBeUndefined();
  });

  it("trata erro de MAC duplicado (409)", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: "DUPLICATE_MAC_ADDRESS", message: "Duplicate" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    await expect(
      repo.create({
        name: "Estação",
        property_id: 1,
        mac_address: "AA:BB:CC:DD:EE:01",
        latitude: null,
        longitude: null,
      }),
    ).rejects.toThrow("Já existe uma estação cadastrada com este endereço MAC.");
  });

  it("trata erro de propriedade não encontrada (409 PROPERTY_NOT_FOUND)", async () => {
    const client = {
      request: vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: "PROPERTY_NOT_FOUND", message: "Prop not found" }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    };

    const repo = new ApiStationRepository(client, "http://api.local/api/stations");
    await expect(
      repo.create({
        name: "Estação",
        property_id: 999,
        mac_address: "AA:BB:CC:DD:EE:01",
        latitude: null,
        longitude: null,
      }),
    ).rejects.toThrow("A propriedade vinculada não foi encontrada no banco.");
  });
});
