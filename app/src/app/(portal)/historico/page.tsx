import type { Metadata } from "next";

import { HistoryPage } from "@/features/history/HistoryPage";

export const metadata: Metadata = { title: "Histórico de Dados Meteorológicos" };

export default function Page() {
  return <HistoryPage />;
}
