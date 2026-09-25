import type { Metadata } from "next";

import { AlertsPage } from "@/features/alerts/AlertsPage";

export const metadata: Metadata = { title: "Alertas" };

export default function Page() {
  return <AlertsPage />;
}
