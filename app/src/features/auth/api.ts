import type { LoginCredentials } from "./LoginPage";
import type { AuthUser } from "./types";

async function authRequest(path: string, init?: RequestInit): Promise<Response> {
  try { return await fetch(`/api/auth/${path}`, {
    ...init, cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(25_000),
  }); } catch { throw new Error("Não foi possível comunicar com o servidor. Verifique sua conexão e tente novamente."); }
}

async function checked(response: Response) {
  if (response.ok) return;
  const body = await response.json().catch(() => null);
  throw new Error(body?.message ?? "Não foi possível acessar a plataforma.");
}

export const authApi = {
  me: async (): Promise<AuthUser | null> => {
    const response = await authRequest("me");
    if (response.status === 401) return null;
    await checked(response);
    return response.json();
  },
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await authRequest("login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials),
    });
    await checked(response);
    return response.json();
  },
  logout: async () => {
    const response = await authRequest("logout", { method: "POST" });
    await checked(response);
  },
};
