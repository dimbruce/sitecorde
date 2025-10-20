import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
// import googleConfig from "eslint-config-google";
import { defineConfig } from "eslint/config";

export default defineConfig([
  tseslint.configs.recommended,
  // googleConfig,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    languageOptions: { globals: globals.node },
  },
]);
