import { NextResponse } from "next/server";

import { apiDestination, errorResponse, fetchIdentity, isAuthUser, sameOrigin, setSession } from "@/lib/auth/session.server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse(403, "Origem da requisição não permitida.");
  let credentials: { email?: unknown; password?: unknown };
  try { credentials = await request.json(); } catch { return errorResponse(400, "Dados de login inválidos."); }
  if (!credentials || typeof credentials.email !== "string" || typeof credentials.password !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email.trim()) ||
    credentials.email.length > 150 || !credentials.password || credentials.password.length > 1024) {
    return errorResponse(400, "Informe um e-mail e uma senha válidos.");
  }
  try {
    const backend = await fetch(`${apiDestination("auth")}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ email: credentials.email.trim().toLowerCase(), password: credentials.password }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!backend.ok) {
      const message = backend.status === 401 ? "E-mail ou senha inválidos."
        : backend.status === 429 ? "Muitas tentativas. Aguarde um momento antes de tentar novamente."
          : "Não foi possível entrar. Tente novamente mais tarde.";
      const result = errorResponse(backend.status, message);
      const retry = backend.headers.get("retry-after");
      if (retry) result.headers.set("Retry-After", retry);
      return result;
    }
    const token = await backend.json();
    if (typeof token.access_token !== "string" || !token.access_token ||
        !Number.isFinite(token.expires_in) || token.expires_in <= 0) return errorResponse(502, "Resposta de autenticação inválida.");
    const identity = await fetchIdentity(token.access_token);
    if (!identity.ok) return errorResponse(identity.status, "Não foi possível validar seu acesso.");
    const user = await identity.json();
    if (!isAuthUser(user)) return errorResponse(502, "Resposta de autenticação inválida.");
    const response = NextResponse.json(user, { headers: { "Cache-Control": "no-store" } });
    setSession(response, token.access_token, token.expires_in);
    return response;
  } catch { return errorResponse(503, "Serviço de autenticação indisponível. Tente novamente."); }
}
