"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import styles from "./SidePanel.module.css";

export function SidePanel({
  title,
  description,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const focusCycle = useRef({ generation: 0 });
  useEffect(() => {
    opener.current ??= document.activeElement as HTMLElement | null;
    const trigger = opener.current;
    const focusState = focusCycle.current;
    const cycle = ++focusState.generation;
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      queueMicrotask(() => {
        if (focusState.generation === cycle) trigger?.focus();
      });
    };
  }, []);
  return (
    <section
      ref={panel}
      role="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={busy}
      className={styles.panel}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={styles.close}>
        <IconButton label="Fechar painel" disabled={busy} onClick={onClose}>
          <Icon name="close" />
        </IconButton>
      </div>
      <header>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
      </header>
      {children}
    </section>
  );
}
