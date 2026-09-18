"use client";

import { useEffect, useState } from "react";
import { userRepository } from "../repositories";
import type { UserRepository } from "../repositories/UserRepository";
import type { UserListItem } from "../types/user";

type UsersState =
  | { status: "loading" }
  | { status: "success"; users: UserListItem[] }
  | { status: "error" };

export function useUsers(
  repository: UserRepository = userRepository,
): UsersState {
  const [state, setState] = useState<UsersState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const users = await repository.list();
        if (active) setState({ status: "success", users });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repository]);

  return state;
}
