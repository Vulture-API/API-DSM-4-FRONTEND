import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

/* Pares fundo/texto com contraste AA (texto pequeno, negrito). */
const PALETTE = [
  "bg-brand-100 text-brand-800",
  "bg-info-soft text-info",
  "bg-warn-soft text-warn",
  "bg-[#efe7f7] text-[#5b3a86]",
  "bg-[#e3f1f1] text-[#23605f]",
  "bg-[#f7e6ea] text-[#8a2f45]",
];

/** Cor estável por pessoa: o mesmo nome sempre cai na mesma cor. */
export function avatarTone(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-6 text-[10px]" : "size-9 text-xs",
        avatarTone(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
