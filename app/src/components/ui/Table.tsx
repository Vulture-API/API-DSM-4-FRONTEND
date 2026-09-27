import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    // relative: o texto sr-only (absoluto) dos cabeçalhos fica preso aqui
    // dentro; sem isso ele escapa do recorte e cria rolagem lateral na página.
    <div className="relative overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-subtle/60 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted first:pl-5 last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("group/row border-b border-line last:border-0 transition-colors hover:bg-canvas/70", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}

/** Ações da linha (editar, excluir...), alinhadas à direita. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-0.5">
      {children}
    </div>
  );
}
