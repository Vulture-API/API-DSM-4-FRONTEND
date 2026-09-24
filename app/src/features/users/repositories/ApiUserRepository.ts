import type {
  ApiPaginatedUsersDto,
  ApiRoleDto,
  ApiUserDto,
} from "../dtos/userApiDto";

import {
  mapApiRole,
  mapApiUser,
  mapCreateUserInput,
  mapUpdateUserInput,
} from "../mappers/userApiMapper";

import type { CreateUserFormValues } from "../schemas/createUserSchema";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

import {
  FetchHttpClient,
  type HttpClient,
} from "@/lib/http/HttpClient";

import {
  resolveUserListOptions,
  type PaginatedUsers,
  type UserListOptions,
  type UserRepository,
} from "./UserRepository";

export class ApiUserRepository implements UserRepository {
  private cargosRequest?: Promise<Cargo[]>;

  constructor(private readonly http: HttpClient = new FetchHttpClient()) {}

  async list(options?: UserListOptions): Promise<PaginatedUsers> {
    const { page, limit } = resolveUserListOptions(options);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const [response, cargos] = await Promise.all([
      this.http.request(
        this.buildUrl(`/users?${query.toString()}`),
        {
          method: "GET",
        },
      ),
      this.listCargos(),
    ]);

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários: HTTP ${response.status}`);
    }

    const data = (await response.json()) as ApiPaginatedUsersDto;

    return {
      items: data.data.map((user) => mapApiUser(user, cargos)),
      pagination: {
        totalRecords: data.meta.total_records,
        totalPages: data.meta.total_pages,
        currentPage: data.meta.current_page,
      },
    };
  }

  async listCargos(): Promise<Cargo[]> {
    if (!this.cargosRequest) {
      this.cargosRequest = this.fetchCargos().catch((error) => {
        this.cargosRequest = undefined;
        throw error;
      });
    }

    return (await this.cargosRequest).map((cargo) => ({ ...cargo }));
  }

  private async fetchCargos(): Promise<Cargo[]> {
    const response = await this.http.request(
      this.buildUrl("/roles"),
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar cargos: HTTP ${response.status}`);
    }

    const roles = (await response.json()) as ApiRoleDto[];

    return roles.map(mapApiRole);
  }

  async create(values: CreateUserFormValues): Promise<UserListItem> {
    const [response, cargos] = await Promise.all([
      this.http.request(
        this.buildUrl("/users"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(mapCreateUserInput(values)),
        },
      ),
      this.listCargos(),
    ]);

    if (!response.ok) {
      throw new Error(`Erro ao criar usuário: HTTP ${response.status}`);
    }

    const user = (await response.json()) as ApiUserDto;

    return mapApiUser(user, cargos);
  }

  async getById(id: number): Promise<UserListItem | null> {
    const response = await this.http.request(
      this.buildUrl(`/users/${id}`),
      {
        method: "GET",
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuário: HTTP ${response.status}`);
    }

    const [user, cargos] = await Promise.all([
      response.json() as Promise<ApiUserDto>,
      this.listCargos(),
    ]);

    return mapApiUser(user, cargos);
  }

  async update(
    id: number,
    input: EditUserFormValues,
  ): Promise<UserListItem> {
    const [response, cargos] = await Promise.all([
      this.http.request(
        this.buildUrl(`/users/${id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(mapUpdateUserInput(input)),
        },
      ),
      this.listCargos(),
    ]);

    if (!response.ok) {
      throw new Error(`Erro ao atualizar usuário: HTTP ${response.status}`);
    }

    const user = (await response.json()) as ApiUserDto;

    return mapApiUser(user, cargos);
  }

  async delete(id: number): Promise<void> {
    const response = await this.http.request(
      this.buildUrl(`/users/${id}`),
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ao excluir usuário: HTTP ${response.status}`);
    }
  }

  private buildUrl(path: string): URL {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

    return new URL(
      `${baseUrl.replace(/\/$/, "")}${path}`,
      window.location.origin,
    );
  }
}