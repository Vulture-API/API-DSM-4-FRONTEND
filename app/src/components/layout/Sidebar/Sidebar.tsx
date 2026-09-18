import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Menu do portal">
      <div className={styles.brand}>
        <span className={styles.logo}>
          <Icon name="leaf" />
        </span>
        <div>
          <strong>AGRITECH</strong>
          <span>PORTAL CLIMÁTICO</span>
        </div>
      </div>
      <nav aria-label="Navegação principal" className={styles.nav}>
        <span aria-disabled="true" className={styles.item}>
          <Icon name="chart" />
          Dashboard Climático
        </span>
        <span aria-disabled="true" className={styles.item}>
          <Icon name="pin" />
          Estações no Mapa
        </span>
        <span aria-disabled="true" className={styles.item}>
          <Icon name="document" />
          Relatórios &amp; Alertas
        </span>
        <Link
          href="/administracao/usuarios"
          aria-current="page"
          className={`${styles.item} ${styles.active}`}
        >
          <Icon name="users" />
          Administração
        </Link>
      </nav>
      <div className={styles.profile}>
        <span className={styles.avatar}>
          <Icon name="users" />
        </span>
        <div>
          <strong>Ambiente de demonstração</strong>
          <span>Dados mockados</span>
        </div>
      </div>
    </aside>
  );
}
