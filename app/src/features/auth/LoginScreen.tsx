"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { safeDestination } from "@/lib/auth/policy";

import { useAuth } from "./AuthProvider";
import { LoginPage } from "./LoginPage";

export function LoginScreen() {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.user) router.replace(safeDestination(new URLSearchParams(window.location.search).get("next"), auth.user.permissions));
  }, [auth.user, router]);
  return <LoginPage onLogin={async (credentials) => {
    const user = await auth.login(credentials);
    router.replace(safeDestination(new URLSearchParams(window.location.search).get("next"), user.permissions));
    router.refresh();
  }} />;
}
