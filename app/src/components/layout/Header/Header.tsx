import { Icon } from "@/components/ui/Icon/Icon";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import styles from "./Header.module.css";

export function Header({ title }: { title: string }) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
      <div className={styles.tools}>
        <IconButton
          disabled
          label="Notificações indisponíveis"
          variant="outline"
        >
          <Icon name="bell" />
        </IconButton>
        <span className={styles.environment}>Demonstração</span>
      </div>
    </header>
  );
}
