import type { Metadata } from "next";

import { StationsPage } from "@/features/stations/StationsPage";

export const metadata: Metadata = { title: "Estações" };

export default function Page() {
  return <StationsPage />;
}
