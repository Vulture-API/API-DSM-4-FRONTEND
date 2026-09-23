"use client";

import { useMemo, useState } from "react";
import {
  getFilteredDashboardData,
  propertiesList,
} from "../mocks/dashboardData";
import type { DashboardPeriod } from "../types/dashboard";

export function useDashboardData(initialProperty = "all", initialPeriod: DashboardPeriod = "24h") {
  const [selectedProperty, setSelectedProperty] = useState<string>(initialProperty);
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(initialPeriod);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("Agora mesmo");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = useMemo(() => {
    return getFilteredDashboardData(selectedProperty, selectedPeriod);
  }, [selectedProperty, selectedPeriod]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setLastRefreshedAt(`Hoje às ${timeStr}`);
      setIsRefreshing(false);
    }, 400);
  };

  return {
    selectedProperty,
    setSelectedProperty,
    selectedPeriod,
    setSelectedPeriod,
    lastRefreshedAt,
    isRefreshing,
    handleRefresh,
    properties: propertiesList,
    ...data,
  };
}
