import { Icon } from "../Icon/Icon";
import styles from "./FeedbackState.module.css";

type Props = {
  kind: "loading" | "empty" | "error";
  title: string;
  description?: string;
};

export function FeedbackState({ kind, title, description }: Props) {
  return (
    <div className={styles.state} role={kind === "error" ? "alert" : "status"}>
      <span className={`${styles.symbol} ${styles[kind]}`} aria-hidden="true">
        {kind === "loading" ? (
          <span className={styles.spinner} />
        ) : (
          <Icon name={kind === "error" ? "alert" : "search"} />
        )}
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
