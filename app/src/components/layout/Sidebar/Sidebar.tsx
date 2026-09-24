"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/Icon/Icon";

import styles from "./Sidebar.module.css";

type SidebarProps = {
  currentPath?: string;
  section?: "users" | "parameters";
};

export function Sidebar({
  currentPath,
  section,
}: SidebarProps) {
  const pathnameHook = usePathname();

  const fallbackPath =
    section === "parameters"
      ? "/administracao/parametros"
      : section === "users"
        ? "/administracao/usuarios"
        : "";

  const pathname = currentPath ?? pathnameHook ?? fallbackPath;

  const administrationLinks = [
    {
      href: "/administracao/usuarios",
      label: "Usuários",
    },
    {
      href: "/administracao/parametros",
      label: "Parâmetros meteorológicos",
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isDashboardActive = isActive("/dashboard");
  const isEstacoesActive = isActive("/estacoes");
  const isAlertasActive = isActive("/alertas");
  const isRegrasActive = isActive("/regras");

  const administrationActive = administrationLinks.some(({ href }) =>
    isActive(href),
  );

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
        <Link
          href="/dashboard"
          aria-current={isDashboardActive ? "page" : undefined}
          className={`${styles.item} ${
            isDashboardActive ? styles.active : ""
          }`}
        >
          <Icon name="chart" />
          Dashboard Climático
        </Link>

        <Link
          href="/estacoes"
          aria-current={isEstacoesActive ? "page" : undefined}
          className={`${styles.item} ${
            isEstacoesActive ? styles.active : ""
          }`}
        >
          <Icon name="pin" />
          Estações
        </Link>

        <Link
          href="/alertas"
          aria-current={isAlertasActive ? "page" : undefined}
          className={`${styles.item} ${
            isAlertasActive ? styles.active : ""
          }`}
        >
          <Icon name="document" />
          Relatórios &amp; Alertas
        </Link>

        <Link
          href="/regras"
          aria-current={isRegrasActive ? "page" : undefined}
          className={`${styles.item} ${
            isRegrasActive ? styles.active : ""
          }`}
        >
          <Icon name="bell" />
          Regras de Alerta
        </Link>

        <div
          className={styles.group}
          role="group"
          aria-label="Administração"
        >
          <div
            className={`${styles.item} ${styles.groupHeader} ${
              administrationActive ? styles.active : ""
            }`}
          >
            <div className={styles.groupTitle}>
              <Icon name="users" />
              <span>Administração</span>
            </div>
            <Icon
              name="chevron"
              className={`${styles.groupChevron} ${
                administrationActive ? styles.groupChevronOpen : ""
              }`}
            />
          </div>

          <ul className={styles.submenu}>
            {administrationLinks.map(({ href, label }) => {
              const active = isActive(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`${styles.subitem} ${
                      active ? styles.selected : ""
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/*
      <div className={styles.profile}>
        <span className={styles.avatar}>
          <Icon name="users" />
        </span>
        <div>
          <strong>Ambiente de demonstração</strong>
          <span>Dados mockados</span>
        </div>
      </div>
      */}
    </aside>
  );
}