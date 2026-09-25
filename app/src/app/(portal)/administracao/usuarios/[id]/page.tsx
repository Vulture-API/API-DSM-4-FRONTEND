import { redirect } from "next/navigation";

// A edição de usuário agora é feita no modal da listagem.
export default function LegacyUserDetailPage() {
  redirect("/administracao/usuarios");
}
