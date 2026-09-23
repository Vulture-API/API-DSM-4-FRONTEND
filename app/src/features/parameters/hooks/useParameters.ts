"use client";

import { useEffect, useState } from "react";
import { parameterRepository } from "../repositories";
import type { ParameterRepository } from "../repositories/ParameterRepository";
import type { Parameter, ParameterValues } from "../types/parameter";

type State =
  | { status: "loading" | "error"; items: Parameter[] }
  | { status: "success"; items: Parameter[] };

export function useParameters(
  repository: ParameterRepository = parameterRepository,
) {
  const [state, setState] = useState<State>({ status: "loading", items: [] });
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    repository.list().then(
      (items) => {
        if (active) setState({ status: "success", items });
      },
      () => {
        if (active) setState({ status: "error", items: [] });
      },
    );
    return () => {
      active = false;
    };
  }, [repository]);

  async function save(values: ParameterValues, id?: number) {
    setPending(true);
    try {
      const item =
        id === undefined
          ? await repository.create(values)
          : await repository.update(id, values);
      setState((previous) => ({
        status: "success",
        items:
          id === undefined
            ? [...previous.items, item]
            : previous.items.map((old) => (old.id === id ? item : old)),
      }));
    } finally {
      setPending(false);
    }
  }
  async function remove(id: number) {
    setPending(true);
    try {
      await repository.remove(id);
      setState((previous) => ({
        status: "success",
        items: previous.items.filter((item) => item.id !== id),
      }));
    } finally {
      setPending(false);
    }
  }
  return { ...state, pending, save, remove };
}
