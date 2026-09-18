import type { ButtonHTMLAttributes } from "react";
import styles from "./IconButton.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "ghost" | "outline";
};

export function IconButton({
  label,
  variant = "ghost",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
