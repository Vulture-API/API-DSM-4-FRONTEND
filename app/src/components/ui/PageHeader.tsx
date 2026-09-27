import type { ReactNode } from "react";

/** Cabeçalho da página, desenhado sobre a faixa escura do topo. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  back,
  badge,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  /** Link de volta, acima do título (ex.: "← Estações"). */
  back?: ReactNode;
  /** Selo ao lado do título (ex.: status da estação). */
  badge?: ReactNode;
  /** Conteúdo extra na faixa, abaixo da descrição. */
  children?: ReactNode;
}) {
  return (
    <div className="on-dark relative mb-7 text-white">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">{eyebrow}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{title}</h1>
            {badge}
          </div>
          {description && <div className="mt-1.5 text-sm text-white/75">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
