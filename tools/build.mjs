// Build del add-on: typecheck → copiar packs → estampar versión → bundle → .mcaddon
// Uso: node tools/build.mjs [--release]
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { zipSync } from "fflate";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const PACKS = { BP: "eleytren_BP", RP: "eleytren_RP" };
const MCADDON = join(DIST, "elevadores-trenes.mcaddon");
const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db"]);

const release = process.argv.includes("--release");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

// package.json es la única fuente de la versión. Manifest format_version 2 → [major, minor, patch].
const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
if (!match) fail(`La versión "${version}" de package.json debe ser x.y.z sin sufijos.`);
const versionArray = match.slice(1, 4).map(Number);

// 1. Typecheck. Si falla, dist/ (y el .mcaddon anterior) no se tocan.
const tsc = spawnSync(join(ROOT, "node_modules", ".bin", "tsc"), ["--noEmit", "-p", ROOT], { stdio: "inherit" });
if (tsc.status !== 0) fail("Errores de TypeScript: no se generó el .mcaddon.");

// 2. Copiar packs/ a dist/ desde cero.
rmSync(DIST, { recursive: true, force: true });
for (const [src, out] of Object.entries(PACKS)) {
  cpSync(join(ROOT, "packs", src), join(DIST, out), {
    recursive: true,
    filter: (path) => !IGNORED_FILES.has(basename(path)),
  });
}

// 3. Estampar la versión en header, módulos y dependencias entre packs (las de module_name se respetan).
const packUuids = new Set();
const manifests = Object.values(PACKS).map((out) => {
  const path = join(DIST, out, "manifest.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  packUuids.add(manifest.header.uuid);
  return { path, manifest };
});
for (const { path, manifest } of manifests) {
  manifest.header.version = versionArray;
  for (const module of manifest.modules) module.version = versionArray;
  for (const dep of manifest.dependencies ?? []) {
    if (dep.uuid && packUuids.has(dep.uuid)) dep.version = versionArray;
  }
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
}

// 4. Bundle del script. Los módulos @minecraft/* los provee el juego.
try {
  await build({
    entryPoints: [join(ROOT, "src", "main.ts")],
    outfile: join(DIST, PACKS.BP, "scripts", "main.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    external: ["@minecraft/server", "@minecraft/server-ui"],
    define: {
      __DEV__: JSON.stringify(!release),
      __VERSION__: JSON.stringify(version),
    },
    minify: release,
    legalComments: "none",
    logLevel: "warning",
  });
} catch {
  fail("esbuild falló: no se generó el .mcaddon.");
}

// 5. Empaquetar ambos packs en un .mcaddon (zip). Se escribe a un temporal y se renombra al final.
function collect(dir, files = {}) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) collect(path, files);
    else files[relative(DIST, path).split(sep).join("/")] = readFileSync(path);
  }
  return files;
}
const files = {};
for (const out of Object.values(PACKS)) collect(join(DIST, out), files);
const tmp = `${MCADDON}.tmp`;
writeFileSync(tmp, zipSync(files, { level: 9 }));
renameSync(tmp, MCADDON);

if (!existsSync(MCADDON)) fail("No se encontró el .mcaddon generado.");
console.log(`✓ ${relative(ROOT, MCADDON)} v${version} (${release ? "release" : "dev"}, ${Object.keys(files).length} archivos)`);
