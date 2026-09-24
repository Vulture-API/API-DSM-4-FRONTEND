import { describe, expect, it, vi } from "vitest";

import type { ApiRoleDto, ApiUserDto } from "../dtos/userApiDto";
import type { HttpClient } from "@/lib/http/HttpClient";
import { ApiUserRepository } from "./ApiUserRepository";

const role: ApiRoleDto = {
  id: 2,
  name: "Gerente Agrícola",
  description: "Responsável pela operação agrícola.",
  created_at: "2026-09-18T12:00:00.000Z",
};

const user: ApiUserDto = {
  id: 7,
  role_id: 2,
  name: "Maria Silva",
  email: "maria@example.com",
  active: true,
  created_at: "2026-09-18T12:00:00.000Z",
};

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function emptyResponse(status = 204): Response {
  return new Response(null, { status });
}

function createHttpMock(
  resolver: (url: URL, options?: RequestInit) => Promise<Response>,
) {
  const request = vi.fn(resolver);

  const client: HttpClient = {
    request(url: URL, options?: RequestInit): Promise<Response> {
      return request(url, options);
    },
  };

  return { client, request };
}

function getRequestPath(url: URL): string {
  return `${url.pathname}${url.search}`;
}

function resolverWithRoles(
  resolveUserRequest: (
    url: URL,
    options?: RequestInit,
  ) => Promise<Response>,
) {
  return async (url: URL, options?: RequestInit): Promise<Response> => {
    if (url.pathname.endsWith("/roles")) {
      return jsonResponse([role]);
    }

    return resolveUserRequest(url, options);
  };
}

describe("ApiUserRepository", () => {
  it("lista uma página, preserva meta e combina role_id com o cargo", async () => {
    const { client, request } = createHttpMock(
      resolverWithRoles(async () =>
        jsonResponse({
          data: [user],
          meta: {
            total_records: 21,
            total_pages: 3,
            current_page: 2,
          },
        }),
      ),
    );

    const result = await new ApiUserRepository(client).list({
      page: 2,
      limit: 10,
    });

    expect(result).toEqual({
      items: [
        {
          id: 7,
          cargo_id: 2,
          nome: "Maria Silva",
          email: "maria@example.com",
          ativo: true,
          criado_em: "2026-09-18T12:00:00.000Z",
          cargo: {
            id: 2,
            nome: "Gerente Agrícola",
          },
        },
      ],
      pagination: {
        totalRecords: 21,
        totalPages: 3,
        currentPage: 2,
      },
    });

    expect(request).toHaveBeenCalledTimes(2);

    const userCall = request.mock.calls.find(([url]) =>
      (url as URL).pathname.endsWith("/users"),
    );

    expect(userCall).toBeDefined();

    expect(getRequestPath(userCall![0] as URL)).toBe(
      "/api/backend/users?page=2&limit=10",
    );

    expect(userCall![1]).toEqual({
      method: "GET",
    });

    const rolesCall = request.mock.calls.find(([url]) =>
      (url as URL).pathname.endsWith("/roles"),
    );

    expect(rolesCall).toBeDefined();
    expect(getRequestPath(rolesCall![0] as URL)).toBe(
      "/api/backend/roles",
    );
  });

  it("lista cargos e consulta usuário por ID", async () => {
    const { client } = createHttpMock(
      resolverWithRoles(async (url) => {
        expect(getRequestPath(url)).toBe(
          "/api/backend/users/7",
        );

        return jsonResponse(user);
      }),
    );

    const repository = new ApiUserRepository(client);

    await expect(repository.listCargos()).resolves.toEqual([
      {
        id: 2,
        nome: "Gerente Agrícola",
        descricao: "Responsável pela operação agrícola.",
        criado_em: "2026-09-18T12:00:00.000Z",
      },
    ]);

    await expect(repository.getById(7)).resolves.toMatchObject({
      id: 7,
      cargo_id: 2,
      cargo: {
        id: 2,
        nome: "Gerente Agrícola",
      },
    });
  });

  it("cria usuário com o payload esperado pela API", async () => {
    const { client, request } = createHttpMock(
      resolverWithRoles(async () => jsonResponse(user, 201)),
    );

    const repository = new ApiUserRepository(client);

    await repository.create({
      cargo_id: 2,
      nome: "Maria Silva",
      email: "maria@example.com",
      senha: "password123",
      ativo: true,
    });

    const userCall = request.mock.calls.find(
      ([url, options]) =>
        (url as URL).pathname.endsWith("/users") &&
        options?.method === "POST",
    );

    expect(userCall).toBeDefined();

    expect(getRequestPath(userCall![0] as URL)).toBe(
      "/api/backend/users",
    );

    expect(userCall![1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        role_id: 2,
        name: "Maria Silva",
        email: "maria@example.com",
        password: "password123",
        active: true,
      }),
    });
  });

  it("atualiza somente nome, cargo e status", async () => {
    const updatedUser: ApiUserDto = {
      ...user,
      name: "Maria Souza",
      active: false,
    };

    const { client, request } = createHttpMock(
      resolverWithRoles(async () => jsonResponse(updatedUser)),
    );

    await new ApiUserRepository(client).update(7, {
      cargo_id: 2,
      nome: "Maria Souza",
      ativo: false,
    });

    const updateCall = request.mock.calls.find(
      ([url, options]) =>
        (url as URL).pathname.endsWith("/users/7") &&
        options?.method === "PUT",
    );

    expect(updateCall).toBeDefined();

    expect(getRequestPath(updateCall![0] as URL)).toBe(
      "/api/backend/users/7",
    );

    expect(updateCall![1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({
        role_id: 2,
        name: "Maria Souza",
        active: false,
      }),
    });
  });

  it("exclui usuário e aceita resposta 204 sem body", async () => {
    const { client, request } = createHttpMock(async () =>
      emptyResponse(204),
    );

    await expect(
      new ApiUserRepository(client).delete(7),
    ).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledTimes(1);

    const [url, options] = request.mock.calls[0];

    expect(getRequestPath(url as URL)).toBe(
      "/api/backend/users/7",
    );

    expect(options).toEqual({
      method: "DELETE",
    });
  });

  it("converte 404 da consulta em usuário ausente", async () => {
    const { client } = createHttpMock(
      resolverWithRoles(async () =>
        jsonResponse(
          {
            code: 404,
            message: "User not found.",
            details: [],
          },
          404,
        ),
      ),
    );

    await expect(
      new ApiUserRepository(client).getById(99),
    ).resolves.toBeNull();
  });

  it.each([
    [400, "Erro ao criar usuário: HTTP 400"],
    [409, "Erro ao criar usuário: HTTP 409"],
  ])(
    "propaga erro HTTP %i ao criar usuário",
    async (status, expectedMessage) => {
      const { client } = createHttpMock(
        resolverWithRoles(async () =>
          jsonResponse(
            {
              code: status,
              message: "Erro da API",
              details: [],
            },
            status,
          ),
        ),
      );

      const repository = new ApiUserRepository(client);

      await expect(
        repository.create({
          cargo_id: 2,
          nome: "Maria",
          email: "maria@example.com",
          senha: "password123",
          ativo: true,
        }),
      ).rejects.toThrow(expectedMessage);
    },
  );

  it("propaga erro 500 ao listar usuários", async () => {
    const { client } = createHttpMock(
      resolverWithRoles(async () =>
        jsonResponse(
          {
            code: 500,
            message: "Internal server error",
            details: [],
          },
          500,
        ),
      ),
    );

    await expect(
      new ApiUserRepository(client).list(),
    ).rejects.toThrow("Erro ao buscar usuários: HTTP 500");
  });

  it("propaga 409 de exclusão como erro", async () => {
    const { client } = createHttpMock(async () =>
      jsonResponse(
        {
          code: 409,
          message:
            "The user cannot be deleted because it is referenced by another resource.",
          details: [],
        },
        409,
      ),
    );

    await expect(
      new ApiUserRepository(client).delete(7),
    ).rejects.toThrow("Erro ao excluir usuário: HTTP 409");
  });

  it("propaga erro de rede", async () => {
    const networkError = new Error("offline");

    const { client } = createHttpMock(async () => {
      throw networkError;
    });

    await expect(
      new ApiUserRepository(client).list(),
    ).rejects.toBe(networkError);
  });
});