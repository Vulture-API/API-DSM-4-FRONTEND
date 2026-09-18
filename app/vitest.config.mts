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
        "src/components/**/*.{ts,tsx}",
        "src/lib/http/**/*.ts",
        "src/app/administracao/usuarios/page.tsx",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/types/**", "**/UserRepository.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
