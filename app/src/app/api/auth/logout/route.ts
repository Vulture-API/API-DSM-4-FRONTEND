import { NextResponse } from "next/server";

import { clearSession, errorResponse, sameOrigin } from "@/lib/auth/session.server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse(403, "Origem da requisição não permitida.");
  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  clearSession(response);
  return response;
}
