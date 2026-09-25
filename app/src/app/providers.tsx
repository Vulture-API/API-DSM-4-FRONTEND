"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { ToastProvider } from "@/components/ui/Toast";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Voltar a uma tela já visitada mostra o cache na hora e atualiza em
        // segundo plano, em vez de piscar "carregando".
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
