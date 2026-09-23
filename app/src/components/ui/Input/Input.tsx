import { useId, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, required, ...props }: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
      />
      {error ? (
        <p id={`${fieldId}-error`} className={styles.error}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId}-hint`} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
