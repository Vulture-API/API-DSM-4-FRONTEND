import type { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { ParametersManagement } from "@/features/parameters/components/ParametersManagement";

export const metadata: Metadata = {
  title: "Parâmetros Meteorológicos | Vulture",
};

export default function ParametersPage() {
  return (
    <PortalLayout
      title="Administração de Parâmetros Meteorológicos"
      section="parameters"
    >
      <ParametersManagement />
    </PortalLayout>
  );
}
