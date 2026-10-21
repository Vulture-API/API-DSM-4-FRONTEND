"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { landingPage } from "@/lib/auth/policy";

export default function AccessDenied() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const destination = user ? landingPage(user.permissions) : "/login";
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold text-ink">Acesso não permitido</h1>
      <p className="text-muted">Peça ao administrador para verificar as permissões do seu perfil.</p>
      {destination !== "/acesso-negado" && <Link href={destination} className="text-brand-700 underline">Ir para uma página disponível</Link>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {user ? <Button onClick={() => void logout().then(() => { router.replace("/login"); router.refresh(); }).catch((failure: Error) => setError(failure.message))}>Sair da conta</Button> : <Link href="/login">Entrar</Link>}
    </main>
  );
}
