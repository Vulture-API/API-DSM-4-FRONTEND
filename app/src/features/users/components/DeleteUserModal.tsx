"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";

import styles from "./DeleteUserModal.module.css";

type DeleteUserModalProps = {
  open: boolean;
  userName: string;
  busy?: boolean;
  returnFocus?: HTMLElement | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function DeleteUserModal({
  open,
  userName,
  busy = false,
  returnFocus,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const submitting = busy || pending;

  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError("");
    try { await onConfirm(); } catch {
      setError("Não foi possível excluir o usuário. A exclusão pode estar bloqueada por vínculos existentes. Tente novamente.");
    } finally { lock.current = false; setPending(false); }
  }

  if (!open) {
    return null;
  }

  return (
    <Modal
      title="Excluir usuário"
      onClose={onClose}
      busy={submitting}
      returnFocus={returnFocus ? () => returnFocus : undefined}
    >
      <div className={styles.content}>
        <p>
          Tem certeza que deseja excluir <strong>{userName}</strong>?
        </p>

        <p className={styles.warning}>
          Esta ação não pode ser desfeita.
        </p>

        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            className={styles.dangerButton}
            onClick={confirm}
            disabled={submitting}
          >
            {submitting ? "Excluindo..." : "Excluir usuário"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
