import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Generated Expo output and its reset utility are not application source.
    "mobile/dist/**",
    "mobile/node_modules/**",
    "mobile/scripts/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
