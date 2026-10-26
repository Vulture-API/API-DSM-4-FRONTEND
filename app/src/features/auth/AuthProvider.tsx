"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef } from "react";

import { SESSION_EXPIRED } from "@/lib/auth/policy";

import { authApi } from "./api";
import type { LoginCredentials } from "./LoginPage";
import type { AuthUser } from "./types";

type Auth = {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  can: (permission: string) => boolean;
  refresh: () => void;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);

export function AuthProvider({ children, initialUser, validateSession = true }: {
  children: ReactNode;
  initialUser?: AuthUser;
  validateSession?: boolean;
}) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["auth", "me"], queryFn: authApi.me,
    enabled: validateSession, retry: false, staleTime: 30_000,
    refetchInterval: validateSession ? 60_000 : false, refetchOnWindowFocus: true,
    initialData: initialUser,
  });
  const identity = useRef<string | null>(null);
  const refetchSession = session.refetch;
  const refresh = useCallback(() => { void refetchSession(); }, [refetchSession]);
  useEffect(() => {
    const next = session.data ? JSON.stringify([session.data.id, session.data.role_id, session.data.permissions]) : null;
    if (identity.current !== null && identity.current !== next) {
      void client.cancelQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
    }
    identity.current = next;
  }, [session.data, client]);
  const clear = useCallback(async () => {
    await client.cancelQueries();
    client.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
    client.setQueryData(["auth", "me"], null);
  }, [client]);

  useEffect(() => {
    const expire = () => { void clear(); };
    window.addEventListener(SESSION_EXPIRED, expire);
    window.addEventListener("agritech:permissions-changed", refresh);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("agritech:auth");
    if (channel) channel.onmessage = refresh;
    return () => { window.removeEventListener(SESSION_EXPIRED, expire); window.removeEventListener("agritech:permissions-changed", refresh); channel?.close(); };
  }, [clear, refresh]);

  const user = session.data ?? null;
  // O fim da sessão desmonta as páginas protegidas e fecha seus WebSockets.
  useEffect(() => {
    if (session.data === null) {
      void client.cancelQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
    }
  }, [client, session.data]);

  return (
    <Context.Provider value={{
      user, loading: session.isLoading || (validateSession && session.data === undefined && session.isFetching),
      error: session.error, can: (permission) => user?.permissions.includes(permission) ?? false,
      refresh,
      login: async (credentials) => {
        const authenticated = await authApi.login(credentials);
        await client.cancelQueries();
        client.clear();
        client.setQueryData(["auth", "me"], authenticated);
        notifyOtherTabs();
        return authenticated;
      },
      logout: async () => { await authApi.logout(); await clear(); notifyOtherTabs(); },
    }}>{children}</Context.Provider>
  );
}

export function useAuth(): Auth {
  const auth = useContext(Context);
  if (!auth) throw new Error("AuthProvider não encontrado.");
  return auth;
}

export function useCan(permission: string) {
  return useAuth().can(permission);
}

function notifyOtherTabs() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("agritech:auth");
  channel.postMessage("changed");
  channel.close();
}
