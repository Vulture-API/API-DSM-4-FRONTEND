import "@fontsource-variable/inter";
import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "Agritech · Portal Climático", template: "%s · Agritech" },
  description: "Monitoramento de estações meteorológicas IoT",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
