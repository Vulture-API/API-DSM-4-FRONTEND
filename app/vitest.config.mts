import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/features/users/**/*.{ts,tsx}",
        "src/features/parameters/**/*.{ts,tsx}",
        "src/features/dashboard/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/lib/http/**/*.ts",
        "src/app/administracao/usuarios/page.tsx",
        "src/app/administracao/parametros/page.tsx",
        "src/app/dashboard/page.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/types/**",
        "**/UserRepository.ts",
        "**/ParameterRepository.ts",
      ],
      reporter: ["text", "html", "json-summary"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
