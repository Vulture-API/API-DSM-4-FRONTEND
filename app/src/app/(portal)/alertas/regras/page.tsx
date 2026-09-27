import type { Metadata } from "next";

import { RulesPage } from "@/features/alerts/RulesPage";

export const metadata: Metadata = { title: "Regras de alerta" };

export default function Page() {
  return <RulesPage />;
}
