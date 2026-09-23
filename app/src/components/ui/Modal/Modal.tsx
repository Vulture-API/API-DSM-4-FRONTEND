"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "../IconButton/IconButton";
import { Icon } from "../Icon/Icon";
import styles from "./Modal.module.css";

export function Modal({
  title,
  children,
  onClose,
  busy = false,
  returnFocus,
  size = "default",
  closeLabel,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  returnFocus?: () => HTMLElement | null;
  size?: "default" | "form";
  closeLabel?: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const fallbackFocus = useRef(returnFocus);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    const restoreFallback = fallbackFocus.current;
    element.showModal();
    return () => {
      element.close();
      queueMicrotask(() => {
        if (trigger?.isConnected) trigger.focus();
        else restoreFallback?.()?.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      aria-busy={busy}
      className={`${styles.modal} ${size === "form" ? styles.formSize : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {closeLabel && (
        <div className={styles.close}>
          <IconButton label={closeLabel} disabled={busy} onClick={onClose}>
            <Icon name="close" />
          </IconButton>
        </div>
      )}
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
