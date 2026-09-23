"use client";

import { useEffect, useState } from "react";
import { userRepository } from "../repositories";
import type { UserRepository } from "../repositories/UserRepository";
import type { Cargo, UserListItem } from "../types/user";

type UsersState =
  | { status: "loading" }
  | { status: "success"; users: UserListItem[]; cargos: Cargo[] }
  | { status: "error" };

export function useUsers(
  repository: UserRepository = userRepository,
) {
  const [state, setState] = useState<UsersState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [users, cargos] = await Promise.all([repository.list(), repository.listCargos()]);
        if (active) setState({ status: "success", users, cargos });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [repository]);

  function addUser(user: UserListItem) {
    setState((previous) => previous.status === "success"
      ? { ...previous, users: [...previous.users, user] }
      : previous);
  }

  return { ...state, addUser };
}
