import type { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { AlertsManagement } from "@/features/alerts/components/AlertsManagement";

export const metadata: Metadata = {
  title: "Alertas | AgroVulture",
  description:
    "Acompanhe e gerencie os alertas de sua propriedade. Fique por dentro de possíveis riscos e tome decisões mais rápidas.",
};

export default function AlertasPage() {
  return (
    <PortalLayout title="Alertas">
      <AlertsManagement />
    </PortalLayout>
  );
}
