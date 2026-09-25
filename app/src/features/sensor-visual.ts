import {
  CloudRain,
  Droplets,
  Gauge,
  type LucideIcon,
  Sprout,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";

type Visual = { icon: LucideIcon; color: string; soft: string };

const normalize = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Ícone e cor de cada tipo de medição, pelo nome do tipo de sensor. */
export function sensorVisual(typeName: string): Visual {
  const name = normalize(typeName);
  if (name.includes("solo") && name.includes("umid")) return { icon: Sprout, color: "#7c5b2e", soft: "#f5ede1" };
  if (name.includes("solo")) return { icon: Waves, color: "#b45309", soft: "#fdf1e2" };
  if (name.includes("temperatura")) return { icon: Thermometer, color: "#d9582b", soft: "#fdeee7" };
  if (name.includes("umid")) return { icon: Droplets, color: "#2f6fb3", soft: "#e8f1fb" };
  if (name.includes("vento")) return { icon: Wind, color: "#4b8a8a", soft: "#e6f3f3" };
  if (name.includes("pluv") || name.includes("chuva")) return { icon: CloudRain, color: "#5b61c9", soft: "#eeeffc" };
  return { icon: Gauge, color: "#58605a", soft: "#efeee7" };
}

const ORDER = ["temperatura", "umidade", "vento", "pluv", "pressao", "temperatura do solo", "umidade do solo"];

/** Ordem de exibição: ar primeiro, solo por último. */
export function sensorOrder(typeName: string): number {
  const name = normalize(typeName);
  const exact = ORDER.indexOf(name);
  if (exact >= 0) return exact;
  const partial = ORDER.findIndex((key) => name.includes(key));
  return partial >= 0 ? partial : ORDER.length;
}
