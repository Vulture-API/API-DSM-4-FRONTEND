import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";

import { cn } from "@/lib/cn";

const control =
  "w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-sm transition-colors " +
  "placeholder:text-faint hover:border-line-strong focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 " +
  "disabled:bg-subtle disabled:text-faint aria-[invalid=true]:border-danger aria-[invalid=true]:focus:border-danger aria-[invalid=true]:focus:ring-danger";

type FieldProps = {
  label: string;
  error?: string | undefined;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  className?: string;
};

/** Rótulo + controle + dica/erro, com os ids de acessibilidade ligados. */
export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-10", className)} {...props} />;
}

const chevron = (color: string) =>
  `bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23${color}%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')]`;

/** `glass`: para a faixa escura do topo. */
export function Select({
  className,
  variant = "default",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { variant?: "default" | "glass" }) {
  return (
    <select
      className={cn(
        variant === "glass"
          ? "w-full rounded-lg bg-white/10 px-3 text-sm text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          : control,
        "h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9",
        variant === "glass" ? chevron("d5ecdc") : chevron("636a64"),
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-20 py-2", className)} {...props} />;
}

/**
 * Chave liga/desliga. Use `label` quando não há texto visível ao lado, ou
 * `labelledBy` com o id do texto visível (evita o leitor de tela ler duas vezes).
 */
export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  labelledBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        // Área de toque de 28 px de altura sem mudar o desenho (WCAG 2.5.8).
        "before:absolute before:-inset-x-1 before:-inset-y-1 before:content-['']",
        checked ? "bg-brand-500" : "bg-control",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
