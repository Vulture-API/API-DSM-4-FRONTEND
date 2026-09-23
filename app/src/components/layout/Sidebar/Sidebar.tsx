"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./Sidebar.module.css";

export function Sidebar({
  section = "users",
}: {
  section?: "users" | "parameters";
}) {
  const pathname =
    usePathname() ??
    `/administracao/${section === "parameters" ? "parametros" : "usuarios"}`;
  const administrationLinks = [
    { href: "/administracao/usuarios", label: "Usuários" },
    { href: "/administracao/parametros", label: "Parâmetros meteorológicos" },
  ];
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const administrationActive = administrationLinks.some(({ href }) => isActive(href));
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
        <div className={styles.group} role="group" aria-label="Administração">
          <div className={`${styles.item} ${administrationActive ? styles.active : ""}`}>
            <Icon name="users" />
            Administração
          </div>
          <ul className={styles.submenu}>
            {administrationLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`${styles.subitem} ${isActive(href) ? styles.selected : ""}`}
                >
                  {label}
                </Link>
              </li>
            ))}
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
      </div> */}
    </aside>
  );
}
