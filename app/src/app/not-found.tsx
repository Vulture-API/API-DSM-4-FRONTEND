import { Compass } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NotFound() {
  return (
    <AppShell>
      <PageHeader eyebrow="Erro 404" title="Página não encontrada" description="O endereço pode ter mudado ou não existe mais." />
      <Card className="shadow-[var(--shadow-lift)]">
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Compass className="size-6" aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-muted">Use o menu acima ou volte para a visão geral da rede.</p>
          <Link href="/dashboard" className={buttonClasses("primary", "md", "mt-6")}>
            Voltar para o dashboard
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
