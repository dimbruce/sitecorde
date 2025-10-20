import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",

  platform: "node",

  format: ["cjs"],

  bundle: true,

  minify: false,

  external: ["firebase-admin", "firebase-functions"],

  splitting: false,
  sourcemap: true,
  clean: true,
});
