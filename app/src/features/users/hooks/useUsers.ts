"use client";

import { useEffect, useState } from "react";
import { userRepository } from "../repositories";
import {
  DEFAULT_USERS_LIMIT,
  type UserPagination,
  type UserRepository,
} from "../repositories/UserRepository";
import type { Cargo, UserListItem } from "../types/user";

type UsersState =
  | { status: "loading" }
  | {
      status: "success";
      users: UserListItem[];
      cargos: Cargo[];
      pagination: UserPagination;
    }
  | { status: "error" };

export function useUsers(
  repository: UserRepository = userRepository,
) {
  const [state, setState] = useState<UsersState>({ status: "loading" });
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [result, cargos] = await Promise.all([
          repository.list({ page, limit: DEFAULT_USERS_LIMIT }),
          repository.listCargos(),
        ]);
        if (active) {
          setState({
            status: "success",
            users: result.items,
            cargos,
            pagination: result.pagination,
          });
        }
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [page, reloadKey, repository]);

  function goToPage(nextPage: number) {
    if (Number.isInteger(nextPage) && nextPage >= 1) {
      setState({ status: "loading" });
      setPage(nextPage);
    }
  }

  function refresh() {
    setState({ status: "loading" });
    setReloadKey((current) => current + 1);
  }

  return { ...state, goToPage, refresh };
}
