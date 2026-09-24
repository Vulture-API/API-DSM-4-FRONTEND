import type { CreateUserFormValues } from "../schemas/createUserSchema";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

export type UserListOptions = {
  page?: number;
  limit?: number;
};

export type UserPagination = {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
};

export type PaginatedUsers = {
  items: UserListItem[];
  pagination: UserPagination;
};

export const DEFAULT_USERS_PAGE = 1;
export const DEFAULT_USERS_LIMIT = 20;

export function resolveUserListOptions(
  options: UserListOptions = {},
): Required<UserListOptions> {
  const page = options.page ?? DEFAULT_USERS_PAGE;
  const limit = options.limit ?? DEFAULT_USERS_LIMIT;

  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("A página deve ser um inteiro maior ou igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("O limite deve ser um inteiro entre 1 e 100.");
  }

  return { page, limit };
}

export interface UserRepository {
  list(options?: UserListOptions): Promise<PaginatedUsers>;
  listCargos(): Promise<Cargo[]>;
  create(values: CreateUserFormValues): Promise<UserListItem>;
  getById(id: number): Promise<UserListItem | null>;
  update(id: number, input: EditUserFormValues): Promise<UserListItem>;
  delete(id: number): Promise<void>;
}
