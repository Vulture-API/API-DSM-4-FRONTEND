"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { pagePermission } from "@/lib/auth/policy";

import { useAuth } from "./AuthProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !error && !user) router.replace(`/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
  }, [user, loading, error, pathname, router]);
  if (loading) return <div role="status" aria-label="Verificando sessão" className="mx-auto max-w-7xl p-8"><Skeleton className="h-24" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  if (!user) return null;
  const permission = pagePermission(pathname ?? "");
  if (permission && !user.permissions.includes(permission)) return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Acesso não permitido</h1>
      <p className="text-sm text-muted">Seu perfil não possui permissão para acessar esta página.</p>
      <Button onClick={() => router.replace("/acesso-negado")}>Ver meu acesso</Button>
      <Button variant="secondary" onClick={() => void logout().catch(refresh)}>Sair da conta</Button>
    </main>
  );
  return children;
}
