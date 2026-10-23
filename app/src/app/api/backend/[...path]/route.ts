import { NextResponse } from "next/server";

import { apiPermission } from "@/lib/auth/policy";

import { apiDestination, clearSession, errorResponse, fetchIdentity, isAuthUser, sameOrigin, sessionToken } from "@/lib/auth/session.server";

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path.length || !path.every((part) => /^[a-zA-Z0-9_-]+$/.test(part)) || path[0] === "auth") {
    return errorResponse(404, "Recurso não encontrado.");
  }
  const destination = apiDestination(path[0]!);
  if (!destination) return errorResponse(404, "Recurso não encontrado.");
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) {
    return errorResponse(403, "Origem da requisição não permitida.");
  }
  const token = await sessionToken();
  if (!token) return errorResponse(401, "Entre para acessar a plataforma.");
  try {
    const identity = await fetchIdentity(token);
    if (!identity.ok) {
      const response = errorResponse(identity.status, identity.status === 401 ? "Sua sessão expirou. Entre novamente." : "Não foi possível validar seu acesso.");
      if (identity.status === 401) clearSession(response);
      return response;
    }
    const user = await identity.json();
    if (!isAuthUser(user)) return errorResponse(502, "Resposta de autenticação inválida.");
    const permission = apiPermission(path, request.method);
    if (!permission || !user.permissions.includes(permission)) return errorResponse(403, "Seu perfil não possui permissão para esta operação.");
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
    if (body && body.byteLength > 1_048_576) return errorResponse(413, "Requisição muito grande.");
    const backend = await fetch(`${destination}/api/${path.join("/")}${new URL(request.url).search}`, {
      method: request.method, headers: {
        Authorization: `Bearer ${token}`,
        ...(body?.byteLength ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}),
      }, body: body?.byteLength ? body : undefined, cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "retry-after"]) {
      const value = backend.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new NextResponse(
      backend.status === 204 || backend.status === 304 || request.method === "HEAD" ? null : await backend.arrayBuffer(),
      { status: backend.status, headers },
    );
    if (backend.status === 401) clearSession(response);
    return response;
  } catch { return errorResponse(503, "Serviço indisponível. Tente novamente."); }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD };
