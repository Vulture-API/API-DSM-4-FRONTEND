"use client";

import { Bell, ChevronDown, Leaf, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { usePendingAlertCount } from "@/features/alerts/hooks";
import { cn } from "@/lib/cn";

import { activeItem, NAV_GROUPS, type NavGroup } from "./nav";

const CLOSE_DELAY_MS = 140;

function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

export function TopNav() {
  const pathname = usePathname() ?? "";
  const current = activeItem(pathname);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Como o menu atual foi aberto: com mouse, o hover abre e o clique que vem
  // logo depois não pode fechar; no toque (sem hover) o clique alterna.
  const openedBy = useRef<"hover" | "click" | null>(null);
  const header = useRef<HTMLElement>(null);
  const pending = usePendingAlertCount();
  // Sobre a faixa o menu é transparente; ao rolar ganha fundo para não
  // sumir em cima do conteúdo claro.
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 8, () => false);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS);
  };
  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => cancelClose, []);

  // Menu aberto por clique fecha ao clicar fora.
  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpenId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openId]);

  return (
    <header
      ref={header}
      className={cn(
        "on-dark sticky top-0 z-40 border-b transition-colors duration-200",
        scrolled || mobileOpen
          ? "border-forest-line bg-forest/95 shadow-[0_8px_24px_-16px_rgb(0_0_0/0.6)] backdrop-blur-md"
          : "border-white/10 bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg" aria-label="Agritech, ir para o dashboard">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand-300 text-forest shadow-sm ring-1 ring-white/20">
            <Leaf className="size-[18px]" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-white">Agritech</span>
            <span className="block text-[11px] text-white/70">Portal Climático</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden h-full items-center gap-1 md:flex">
          {NAV_GROUPS.map((group) => (
            <MegaMenu
              key={group.id}
              group={group}
              open={openId === group.id}
              active={group.items.some((item) => item === current)}
              currentHref={current?.href}
              onOpen={() => {
                cancelClose();
                if (openId !== group.id) openedBy.current = "hover";
                setOpenId(group.id);
              }}
              onToggle={() => {
                if (openId === group.id && openedBy.current === "hover") {
                  openedBy.current = "click";
                  return;
                }
                openedBy.current = "click";
                setOpenId(openId === group.id ? null : group.id);
              }}
              onLeave={scheduleClose}
              onClose={close}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/alertas"
            aria-label={pending ? `${pending} alertas pendentes` : "Alertas"}
            className="relative inline-flex size-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell className="size-[18px]" />
            {pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-forest">
                {pending > 99 ? "99+" : pending}
              </span>
            )}
          </Link>
          <span className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 ring-1 ring-white/15 sm:inline-flex">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-300 text-[11px] font-semibold text-forest">
              DM
            </span>
            <span className="text-[13px] text-white/85">Demonstração</span>
          </span>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 md:hidden"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            aria-controls="menu-mobile"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="menu-mobile" aria-label="Menu" className="animate-fade-in border-t border-forest-line bg-forest px-4 pt-2 pb-4 md:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="py-2">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item === current ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2 text-sm",
                    item === current ? "bg-white/10 font-medium text-white" : "text-white/85 hover:bg-white/5",
                  )}
                >
                  <item.icon className="size-4 text-brand-300" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}

function MegaMenu({
  group,
  open,
  active,
  currentHref,
  onOpen,
  onToggle,
  onLeave,
  onClose,
}: {
  group: NavGroup;
  open: boolean;
  active: boolean;
  currentHref: string | undefined;
  onOpen: () => void;
  onToggle: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = `menu-${group.id}`;

  const focusItem = (index: number) => {
    const links = panel.current?.querySelectorAll<HTMLAnchorElement>("a");
    if (!links?.length) return;
    links[(index + links.length) % links.length]?.focus();
  };

  return (
    <div
      className="relative flex h-full items-center"
      onMouseEnter={onOpen}
      onMouseLeave={onLeave}
      // Tab para fora do menu (teclado) fecha o painel: senão ele fica aberto
      // cobrindo a página enquanto o foco já está em outro lugar.
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) onClose();
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onOpen();
            requestAnimationFrame(() => focusItem(0));
          }
          if (event.key === "Escape") onClose();
        }}
        className={cn(
          "relative inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors",
          open || active ? "text-white" : "text-white/75 hover:text-white",
          open && "bg-white/10",
        )}
      >
        {group.label}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-300" aria-hidden />}
      </button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          className="absolute top-full left-0 z-50 w-[540px] animate-pop-in pt-2 [&_:focus-visible]:outline-brand-500"
          onKeyDown={(event) => {
            const links = Array.from(panel.current?.querySelectorAll("a") ?? []);
            const index = links.indexOf(document.activeElement as HTMLAnchorElement);
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
              event.preventDefault();
              focusItem(index + 1);
            }
            if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
              event.preventDefault();
              focusItem(index - 1);
            }
            if (event.key === "Escape") {
              onClose();
              trigger.current?.focus();
            }
          }}
        >
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-2 text-ink shadow-[var(--shadow-pop)]">
            {group.items.map((item) => {
              const isCurrent = item.href === currentHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={onClose}
                  className={cn(
                    "group flex gap-3 rounded-xl p-3 transition-colors",
                    isCurrent ? "bg-brand-50" : "hover:bg-subtle focus-visible:bg-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isCurrent
                        ? "bg-brand-600 text-white"
                        : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
                    )}
                  >
                    <item.icon className="size-[18px]" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
