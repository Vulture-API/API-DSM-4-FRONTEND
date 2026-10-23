import { redirect } from "next/navigation";

import { sessionToken } from "@/lib/auth/session.server";
import { AuthGate } from "@/features/auth/AuthGate";

import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  if (!(await sessionToken())) redirect("/login");
  return <AuthGate><AppShell>{children}</AppShell></AuthGate>;
}
