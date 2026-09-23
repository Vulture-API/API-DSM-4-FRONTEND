import type { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { UserDetailsScreen } from "@/features/users/components/UserDetailsScreen";

export const metadata: Metadata = { title: "Detalhes do Usuário | Agrovulture" };

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PortalLayout title="Detalhes do Usuário">
      <UserDetailsScreen id={/^\d+$/.test(id) ? Number(id) : NaN} />
    </PortalLayout>
  );
}
