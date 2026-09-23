"use client";

import { useEffect, useRef, useState } from "react";
import { userRepository } from "../repositories";
import type { UserRepository } from "../repositories/UserRepository";
import type { EditUserFormValues } from "../schemas/editUserSchema";
import type { Cargo, UserListItem } from "../types/user";

type DetailsState =
  | { status: "loading" | "not-found" | "error" }
  | { status: "success"; user: UserListItem; cargos: Cargo[] };

export function useUserDetails(id: number, repository: UserRepository = userRepository) {
  const [state, setState] = useState<DetailsState>({ status: "loading" });
  const [operation, setOperation] = useState<"updating" | "deleting" | null>(null);
  const [notice, setNotice] = useState("");
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const user = Number.isSafeInteger(id) && id > 0 ? await repository.getById(id) : null;
        if (!user) {
          if (active) setState({ status: "not-found" });
          return;
        }
        const cargos = await repository.listCargos();
        if (active) setState({ status: "success", user, cargos });
      } catch {
        if (active) setState({ status: "error" });
      }
    }
    void load();
    return () => { active = false; };
  }, [id, repository]);

  async function update(input: EditUserFormValues) {
    if (locked.current) throw new Error("Operação em andamento.");
    locked.current = true;
    setOperation("updating");
    setNotice("");
    try {
      const user = await repository.update(id, input);
      setState((previous) => previous.status === "success" ? { ...previous, user } : previous);
      setNotice("Usuário atualizado com sucesso.");
    } finally {
      locked.current = false;
      setOperation(null);
    }
  }

  async function remove() {
    if (locked.current) throw new Error("Operação em andamento.");
    locked.current = true;
    setOperation("deleting");
    try {
      await repository.delete(id);
    } finally {
      locked.current = false;
      setOperation(null);
    }
  }

  return { state, operation, notice, update, remove };
}
