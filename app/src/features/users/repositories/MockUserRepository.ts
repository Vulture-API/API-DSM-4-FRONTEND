import { ZodError } from "zod";
import { cargos, publicCredentials, users } from "../mocks/users";
import { createUserSchema, type CreateUserFormValues } from "../schemas/createUserSchema";
import { editUserSchema, type EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";
import {
  resolveUserListOptions,
  type PaginatedUsers,
  type UserListOptions,
  type UserRepository,
} from "./UserRepository";

const copyUser = (user: UserListItem): UserListItem => ({ ...user, cargo: { ...user.cargo } });

/** Cadastro em memória; não persiste senha nem altera as fixtures. */
export class MockUserRepository implements UserRepository {
  private items: UserListItem[];
  private nextId: number;

  constructor(seed?: UserListItem[]) {
    this.items = (seed ?? users.map((user) => {
      const cargo = cargos.find(({ id }) => id === user.cargo_id)!;
      return {
        ...user,
        cargo: { id: cargo.id, nome: cargo.nome },
        email: publicCredentials.find(({ usuario_id }) => usuario_id === user.id)?.email ?? null,
      };
    })).map(copyUser);
    this.nextId = Math.max(0, ...this.items.map(({ id }) => id)) + 1;
  }

  async list(options?: UserListOptions): Promise<PaginatedUsers> {
    const { page, limit } = resolveUserListOptions(options);
    const start = (page - 1) * limit;

    return {
      items: this.items.slice(start, start + limit).map(copyUser),
      pagination: {
        totalRecords: this.items.length,
        totalPages: Math.ceil(this.items.length / limit),
        currentPage: page,
      },
    };
  }

  async getById(id: number): Promise<UserListItem | null> {
    const user = this.items.find((item) => item.id === id);
    return user ? copyUser(user) : null;
  }

  async update(id: number, input: EditUserFormValues): Promise<UserListItem> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Usuário não encontrado.");
    const parsed = editUserSchema.parse(input);
    const cargo = cargos.find((item) => item.id === parsed.cargo_id);
    if (!cargo) {
      throw new ZodError([{ code: "custom", path: ["cargo_id"], message: "Selecione um cargo existente." }]);
    }
    this.items[index] = { ...this.items[index], ...parsed, cargo: { id: cargo.id, nome: cargo.nome } };
    return copyUser(this.items[index]);
  }

  async delete(id: number): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Usuário não encontrado.");
    // Remove somente a projeção em memória, sem simular relacionamentos/cascade.
    this.items.splice(index, 1);
  }

  async listCargos(): Promise<Cargo[]> {
    return cargos.map((cargo) => ({ ...cargo }));
  }

  async create(values: CreateUserFormValues): Promise<UserListItem> {
    const parsed = createUserSchema.parse(values);
    const cargo = cargos.find(({ id }) => id === parsed.cargo_id);
    if (!cargo) {
      throw new ZodError([{ code: "custom", path: ["cargo_id"], message: "Selecione um cargo existente." }]);
    }
    if (this.items.some(({ email }) => email?.trim().toLowerCase() === parsed.email)) {
      throw new ZodError([{ code: "custom", path: ["email"], message: "Já existe um usuário com esse e-mail." }]);
    }
    const user: UserListItem = {
      id: this.nextId++, nome: parsed.nome, email: parsed.email,
      cargo_id: cargo.id, cargo: { id: cargo.id, nome: cargo.nome },
      ativo: parsed.ativo, criado_em: new Date().toISOString(),
    };
    this.items.push(user);
    return copyUser(user);
  }
}
