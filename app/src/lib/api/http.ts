/**
 * Cliente HTTP do portal. O navegador sempre chama caminhos relativos
 * (/api/backend/...), autenticados pelo servidor do Next.
 */

import { SESSION_EXPIRED } from "@/lib/auth/policy";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 25_000;

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    return String((body as { message: unknown }).message);
  }
  if (status === 0) return "Serviço indisponível. Verifique se a API está no ar.";
  return `Erro ${status} na requisição.`;
}

export async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  if (!path.startsWith("/api/")) throw new ApiError(400, "Caminho de API inválido.");
  const destination = `/api/backend/${path.slice(5)}`;

  let response: Response;
  try {
    response = await fetch(destination, {
      credentials: "same-origin",
      ...rest,
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      signal: rest.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, messageFrom(null, 0));
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    if (response.status === 403 && typeof window !== "undefined") window.dispatchEvent(new Event("agritech:permissions-changed"));
    throw new ApiError(response.status, messageFrom(body, response.status));
  }
  return body as T;
}

export type Paginated<T> = {
  data: T[];
  meta: { total_records: number; total_pages: number; current_page: number };
};

/** Busca todas as páginas (limite 100 por página nos serviços). */
export async function requestAll<T>(path: string): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const first = await request<Paginated<T>>(`${path}${separator}page=1&limit=100`);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.total_pages - 1) }, (_, i) =>
      request<Paginated<T>>(`${path}${separator}page=${i + 2}&limit=100`),
    ),
  );
  return [first, ...rest].flatMap((page) => page.data);
}

export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
