import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const integrationFiles = ["src/**/*.integration.test.{ts,tsx}"];

// No CI, cada nível roda uma vez e guarda a cobertura parcial; o mínimo de 80%
// é cobrado depois, na junção dos dois níveis (npm run test:ci:coverage).
const coberturaParcial = process.env.COBERTURA_PARCIAL === "1";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "server-only": fileURLToPath(new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/test/**",
        // Arquivos de rota do App Router: só montam a página da feature.
        "src/app/**",
        "src/features/properties/**",
        "src/features/reports/**",
      ],
      reporter: coberturaParcial ? [] : ["text", "html", "json-summary"],
      thresholds: coberturaParcial
        ? {}
        : { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: [...configDefaults.exclude, ...integrationFiles],
        },
      },
      {
        extends: true,
        test: { name: "integration", include: integrationFiles },
      },
    ],
  },
});
