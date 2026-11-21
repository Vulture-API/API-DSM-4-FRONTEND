import type { Metadata } from "next";

import { ReportsPage } from "@/features/reports/ReportsPage";

export const metadata: Metadata = { title: "Relatórios Meteorológicos" };

export default function Page() {
  return <ReportsPage />;
}
