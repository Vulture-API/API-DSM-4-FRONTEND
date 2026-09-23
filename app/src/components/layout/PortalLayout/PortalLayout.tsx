import type { ReactNode } from "react";
import { Sidebar } from "../Sidebar/Sidebar";
import { Header } from "../Header/Header";
import styles from "./PortalLayout.module.css";

export function PortalLayout({
  title,
  children,
  section,
}: {
  title: string;
  children: ReactNode;
  section?: "users" | "parameters";
}) {
  return (
    <div className={styles.portal} lang="pt-BR">
      <a className={styles.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <Sidebar section={section} />
      <div className={styles.content}>
        <Header title={title} />
        <main id="conteudo" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
