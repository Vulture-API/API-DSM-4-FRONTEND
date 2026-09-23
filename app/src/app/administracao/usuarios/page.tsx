import type { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout/PortalLayout";
import { UsersList } from "@/features/users/components/UsersList";

export const metadata: Metadata = {
  title: "Administração de Usuários | Agrovulture",
};

export default function UsersPage() {
  return (
    <PortalLayout title="Administração de Usuários" section="users">
      <UsersList />
    </PortalLayout>
  );
}
