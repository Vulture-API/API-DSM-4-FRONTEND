import {
  BellRing,
  Gauge,
  LayoutDashboard,
  type LucideIcon,
  RadioTower,
  SlidersHorizontal,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavGroup = { id: string; label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "monitoramento",
    label: "Monitoramento",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Status da rede e condições climáticas em tempo real",
        icon: LayoutDashboard,
      },
      {
        href: "/estacoes",
        label: "Estações",
        description: "Cadastro, sensores e última comunicação",
        icon: RadioTower,
      },
    ],
  },
  {
    id: "alertas",
    label: "Alertas",
    items: [
      {
        href: "/alertas",
        label: "Alertas disparados",
        description: "Ocorrências pendentes e histórico",
        icon: BellRing,
      },
      {
        href: "/alertas/regras",
        label: "Regras de alerta",
        description: "Limites que disparam avisos por sensor",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    items: [
      {
        href: "/administracao/usuarios",
        label: "Usuários",
        description: "Contas, cargos e acesso ao portal",
        icon: Users,
      },
      {
        href: "/administracao/parametros",
        label: "Parâmetros",
        description: "Tipos de medição e unidades dos sensores",
        icon: Gauge,
      },
    ],
  },
];

/** O item mais específico que casa com a rota ("/alertas/regras" > "/alertas"). */
export function activeItem(pathname: string): NavItem | undefined {
  return NAV_GROUPS.flatMap((g) => g.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
