"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/States";

/** O Leaflet mexe no window: carrega só no navegador, fora do bundle inicial. */
export const StationsMapLazy = dynamic(() => import("./StationsMap").then((m) => m.StationsMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-60 rounded-none" />,
});
