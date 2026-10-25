import type { Metadata } from "next";

import { RolesPage } from "@/features/roles/RolesPage";

export const metadata: Metadata = { title: "Perfis e permissões" };

export default function Page() {
  return <RolesPage />;
}
