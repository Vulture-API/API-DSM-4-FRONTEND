"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./Sidebar.module.css";

export function Sidebar({ currentPath }: { currentPath?: string }) {
  const pathnameHook = usePathname();
  const pathname = currentPath ?? pathnameHook ?? "/administracao/usuarios";

  const isEstacoesActive = pathname?.startsWith("/estacoes");
  const isAlertasActive = pathname?.startsWith("/alertas");
  const isAdmActive =
    pathname?.startsWith("/administracao") && !isEstacoesActive && !isAlertasActive;

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
        <Link
          href="/estacoes"
          aria-current={isEstacoesActive ? "page" : undefined}
          className={`${styles.item} ${isEstacoesActive ? styles.active : ""}`}
        >
          <Icon name="pin" />
          Estações
        </Link>
        <Link
          href="/alertas"
          aria-current={isAlertasActive ? "page" : undefined}
          className={`${styles.item} ${isAlertasActive ? styles.active : ""}`}
        >
          <Icon name="document" />
          Relatórios &amp; Alertas
        </Link>
        <Link
          href="/administracao/usuarios"
          aria-current={isAdmActive ? "page" : undefined}
          className={`${styles.item} ${isAdmActive ? styles.active : ""}`}
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
