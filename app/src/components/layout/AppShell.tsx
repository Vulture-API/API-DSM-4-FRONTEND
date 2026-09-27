import type { ReactNode } from "react";

import { TopNav } from "./TopNav";

/**
 * Faixa escura no topo (menu + cabeçalho da página) e o conteúdo subindo por
 * cima dela. O PageHeader de cada página é desenhado sobre a faixa.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <div className="hero-band on-dark pointer-events-none absolute inset-x-0 top-0 -z-10 h-[304px]" aria-hidden />
      <TopNav />
      <main id="conteudo" className="relative mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-12 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-faint sm:flex-row sm:justify-between sm:px-6">
          <span>Agritech · Portal Climático</span>
          <span>Monitoramento de estações meteorológicas IoT</span>
        </div>
      </footer>
    </div>
  );
}
