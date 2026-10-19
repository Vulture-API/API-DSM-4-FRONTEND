import type { Metadata } from "next";

import { DashboardStats } from "@/features/stats/DashboardStats";

export const metadata: Metadata = { 
  title: "Estatísticas Meteorológicas · Agritech" 
};

export default function Page() {
  return <DashboardStats />;
}