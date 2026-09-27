import { redirect } from "next/navigation";

// Rota antiga: a tela de regras agora vive dentro de Alertas.
export default function LegacyRulesPage() {
  redirect("/alertas/regras");
}
