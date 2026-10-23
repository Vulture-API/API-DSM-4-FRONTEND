import { NextResponse } from "next/server";

import { clearSession, errorResponse, fetchIdentity, isAuthUser, sessionToken } from "@/lib/auth/session.server";

export async function GET() {
  const token = await sessionToken();
  if (!token) return errorResponse(401, "Sessão não encontrada.");
  try {
    const backend = await fetchIdentity(token);
    if (!backend.ok) {
      const response = errorResponse(backend.status, backend.status === 401 ? "Sessão expirada. Entre novamente." : "Não foi possível verificar sua sessão.");
      if (backend.status === 401) clearSession(response);
      return response;
    }
    const user = await backend.json();
    if (!isAuthUser(user)) return errorResponse(502, "Resposta de autenticação inválida.");
    return NextResponse.json(user, { headers: { "Cache-Control": "no-store" } });
  } catch { return errorResponse(503, "Não foi possível verificar sua sessão. Tente novamente."); }
}
