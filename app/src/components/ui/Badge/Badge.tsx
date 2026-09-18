import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "positive" | "neutral";
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span aria-hidden="true" className={styles.dot} />
      {children}
    </span>
  );
}
