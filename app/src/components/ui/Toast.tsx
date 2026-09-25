"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/cn";

type Toast = { id: number; message: string; tone: "success" | "error" };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

/** Mensagens rápidas de sucesso/erro (CA6: "exibir mensagem de sucesso"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  // Objeto estável: consumidores de useToast não re-renderizam a cada toast.
  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex animate-pop-in items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm shadow-[var(--shadow-pop)]",
              toast.tone === "success" ? "border-ok/20" : "border-danger/20",
            )}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="size-4 text-ok" aria-hidden />
            ) : (
              <XCircle className="size-4 text-danger" aria-hidden />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast precisa de <ToastProvider>");
  return context;
}
