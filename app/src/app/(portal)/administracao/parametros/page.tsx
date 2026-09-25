import type { Metadata } from "next";

import { ParametersPage } from "@/features/parameters/ParametersPage";

export const metadata: Metadata = { title: "Parâmetros" };

export default function Page() {
  return <ParametersPage />;
}
