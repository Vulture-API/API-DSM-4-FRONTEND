import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agritech | Portal Climático",
  description: "Sistema de Monitoramento IoT",
};

export default function RootLayout({
  children,
}: {
  
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
