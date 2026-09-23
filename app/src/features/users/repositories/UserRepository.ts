import type { CreateUserFormValues } from "../schemas/createUserSchema";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

export interface UserRepository {
  list(): Promise<UserListItem[]>;
  listCargos(): Promise<Cargo[]>;
  create(values: CreateUserFormValues): Promise<UserListItem>;
  getById(id: number): Promise<UserListItem | null>;
  update(id: number, input: EditUserFormValues): Promise<UserListItem>;
  delete(id: number): Promise<void>;
}
