import type { Metadata } from "next";

import { PropertiesPage } from "@/features/properties/PropertiesPage";

export const metadata: Metadata = { title: "Propriedades" };

export default function Page() {
  return <PropertiesPage />;
}
