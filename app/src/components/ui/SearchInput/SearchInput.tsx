"use client";

import { useId, useRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import styles from "./SearchInput.module.css";

export function SearchInput({
  label,
  onClear,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  onClear?: () => void;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.field}>
      <Icon name="search" />
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        ref={input}
        type="search"
        suppressHydrationWarning
        {...props}
      />
      {onClear && props.value && (
        <IconButton
          label="Limpar busca"
          disabled={props.disabled}
          onClick={() => {
            onClear();
            input.current?.focus();
          }}
        >
          <Icon name="close" />
        </IconButton>
      )}
    </div>
  );
}
