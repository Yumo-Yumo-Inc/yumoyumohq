import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const overridePlugins = {
  ...nextVitals[0]?.plugins,
  ...nextTs[0]?.plugins,
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy/one-off scripts (some contain non-UTF8 chars)
    "scripts/add-indexes-quick.mjs",
    // Scratchpad/design exports — not application code, must not be linted.
    "outputs/**",
  ]),
  // Repo baseline: allow legacy patterns as warnings (keep lint green).
  // We still surface issues, but don't fail CI/dev loop on existing debt.
  {
    plugins: overridePlugins,
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      "react/no-children-prop": "warn",
      "prefer-const": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
