// Pruebas de la lógica pura: bundlea src/**/*.test.ts con esbuild y las corre con `node --test`.
// Uso: node tools/test.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");

const entryPoints = readdirSync(SRC, { recursive: true })
  .filter((path) => path.endsWith(".test.ts"))
  .map((path) => join(SRC, path));
if (entryPoints.length === 0) {
  console.error("✗ No hay archivos *.test.ts en src/.");
  process.exit(1);
}

const out = mkdtempSync(join(tmpdir(), "eleytren-test-"));
try {
  // Las pruebas no deben depender de @minecraft/*: si un import lo pide, esbuild falla aquí.
  await build({ entryPoints, outdir: out, outbase: SRC, bundle: true, format: "esm", platform: "node", outExtension: { ".js": ".mjs" }, logLevel: "warning" });
  const files = readdirSync(out, { recursive: true }).filter((path) => path.endsWith(".mjs")).map((path) => join(out, path));
  console.log(`Corriendo ${files.map((f) => relative(out, f)).join(", ")}`);
  const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
