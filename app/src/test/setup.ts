import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Recharts mede o container com ResizeObserver, que o jsdom não tem.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// O mapa (Leaflet) tem teste próprio; nas telas ele vira uma região vazia.
vi.mock("@/features/stations/StationsMapLazy", async () => {
  const { createElement } = await import("react");
  return {
    StationsMapLazy: ({ label = "Mapa das estações" }: { label?: string }) =>
      createElement("div", { role: "region", "aria-label": label }),
  };
});
