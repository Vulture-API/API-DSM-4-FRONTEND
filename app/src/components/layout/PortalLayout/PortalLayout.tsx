import type { ReactNode } from "react";
import { Sidebar } from "../Sidebar/Sidebar";
import { Header } from "../Header/Header";
import styles from "./PortalLayout.module.css";

export function PortalLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.portal} lang="pt-BR">
      <a className={styles.skip} href="#conteudo">
        Pular para o conteúdo
      </a>
      <Sidebar />
      <div className={styles.content}>
        <Header title={title} />
        <main id="conteudo" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
