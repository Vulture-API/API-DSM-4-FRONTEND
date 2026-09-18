import type { UserListItem } from "../types/user";

export interface UserRepository {
  list(): Promise<UserListItem[]>;
}
