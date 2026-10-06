// Genera el modelo, la textura y el ícono del vagón de metro, más vistas previas para revisarlo.
// Se corre a mano (`node tools/gen-metro.mjs`) y su salida en packs/RP se versiona; el build no lo usa.
// Vistas previas: node tools/gen-metro.mjs --preview <carpeta>
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const GEO_OUT = join(ROOT, "packs/RP/models/entity/eleytren_metro_car.geo.json");
const TEX_OUT = join(ROOT, "packs/RP/textures/entity/eleytren_metro_car.png");
const ICON_OUT = join(ROOT, "packs/RP/textures/items/eleytren_metro_car.png");

// Paleta (PLACEHOLDER hasta tener fotos de referencia de los vagones de Metrorrey). Sin logos ni texto.
const PALETTE = {
  body: "#e9e9e4", // carrocería
  stripe: "#2f8f4e", // franja
  stripeAccent: "#f2c230", // filete sobre la franja
  door: "#d6d6d0",
  skirt: "#3b3e43", // faldón y bajos
  roof: "#a9adb2",
  frame: "#4a4f57", // marcos de ventanas y puertas
  light: "#fff3b0", // faros
  sign: "#1d1f22", // letrero de destino (vacío)
  interior: "#c9cbc6",
  floor: "#6d7177",
  seat: "#2c5a9e",
  console: "#2b2d31",
};

// ---------- Textura ----------
const TW = 256;
const TH = 128;
const tex = new Uint8Array(TW * TH * 4); // RGBA, transparente por defecto

function rgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
}
const CLEAR = [0, 0, 0, 0];

function set(img, w, x, y, color) {
  const i = (y * w + x) * 4;
  img[i] = color[0];
  img[i + 1] = color[1];
  img[i + 2] = color[2];
  img[i + 3] = color[3];
}
function fill(x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(tex, TW, x, y, color);
}

/** Región de la textura y la función que la pinta en coordenadas locales (u, v). */
function region(x0, y0, w, h, paint) {
  for (let v = 0; v < h; v++) for (let u = 0; u < w; u++) set(tex, TW, x0 + u, y0 + v, paint(u, v));
  return { uv: [x0, y0], size: [w, h] };
}

const C = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, rgb(v)]));

/** Ventana con marco de 1 px: el interior es transparente. */
function windowPixel(u, v, u0, v0, w, h) {
  if (u < u0 || u >= u0 + w || v < v0 || v >= v0 + h) return undefined;
  const edge = u === u0 || u === u0 + w - 1 || v === v0 || v === v0 + h - 1;
  return edge ? C.frame : CLEAR;
}

// Costado (96 × 38): u recorre el largo (z −48..48), v baja desde el techo (y 44) hasta el piso (y 6).
// Simétrico de punta a punta: hay cabina en los dos extremos, como un vagón real.
const SIDE_SECTIONS = [
  ["cab", 0, 14], ["win", 14, 10], ["door", 24, 14], ["win", 38, 20], ["door", 58, 14], ["win", 72, 10], ["cab", 82, 14],
];
function sidePixel(u, v) {
  const [kind, start, width] = SIDE_SECTIONS.find(([, s, w]) => u >= s && u < s + w);
  const local = u - start;
  let color = C.body;
  if (v < 2) color = C.roof;
  if (v >= 23 && v < 26) color = C.stripe;
  if (v === 22) color = C.stripeAccent;
  if (v >= 34) color = C.skirt;
  if (kind === "win") color = windowPixel(local, v, 1, 6, width - 2, 14) ?? color;
  if (kind === "cab") {
    const cabWin = start === 0 ? windowPixel(local, v, 5, 6, 8, 11) : windowPixel(local, v, 1, 6, 8, 11);
    color = cabWin ?? color;
  }
  if (kind === "door" && v >= 3 && v < 34) {
    color = local === 0 || local === width - 1 || v === 3 ? C.frame : local === width / 2 - 1 || local === width / 2 ? C.frame : C.door;
    if (v >= 23 && v < 26) color = C.stripe;
    const pane = windowPixel(local, v, 2, 6, width / 2 - 3, 15) ?? windowPixel(local, v, width / 2 + 1, 6, width / 2 - 3, 15);
    if (pane) color = pane;
  }
  return color;
}

// Frente (32 × 38): parabrisas, letrero de destino vacío, faros y franja.
function frontPixel(u, v) {
  let color = C.body;
  if (v < 2) color = C.roof;
  if (v >= 2 && v < 5 && u >= 8 && u < 24) color = C.sign;
  if (v >= 23 && v < 26) color = C.stripe;
  if (v === 22) color = C.stripeAccent;
  if (v >= 33) color = C.skirt;
  if (v >= 28 && v < 30 && ((u >= 3 && u < 7) || (u >= 25 && u < 29))) color = C.light;
  const glass = windowPixel(u, v, 3, 6, 26, 14);
  if (glass) color = u === 15 || u === 16 ? C.frame : glass;
  return color;
}

// Mampara de la cabina (30 × 38), vista desde el salón: ventana al centro.
function partitionPixel(u, v) {
  return windowPixel(u, v, 7, 8, 16, 12) ?? (v >= 34 ? C.floor : C.interior);
}

const R = {
  side: region(0, 0, 96, 38, sidePixel),
  front: region(0, 40, 32, 38, frontPixel),
  partition: region(34, 40, 30, 38, partitionPixel),
  roof: region(100, 0, 8, 8, () => C.roof),
  dark: region(110, 0, 8, 8, () => C.skirt),
  floor: region(120, 0, 8, 8, () => C.floor),
  seat: region(130, 0, 8, 8, () => C.seat),
  console: region(140, 0, 8, 8, () => C.console),
  interior: region(150, 0, 8, 8, () => C.interior),
};

// ---------- Geometría (unidades de 1/16 de bloque; el frente del modelo es −Z, como en vanilla) ----------
const FACES = ["north", "south", "east", "west", "up", "down"];

/** Cubo con la misma región en todas sus caras, o una región por cara (`faces`). */
function cube(origin, size, all, faces = {}) {
  const uv = {};
  for (const face of FACES) {
    const r = faces[face] ?? all;
    uv[face] = { uv: r.uv, uv_size: r.size };
  }
  return { origin, size, uv };
}

const shell = [
  cube([-16, 4, -48], [32, 3, 96], R.dark, { up: R.floor }),
  cube([-16, 6, -48], [1, 38, 96], R.interior, { west: R.side, east: R.side }),
  cube([15, 6, -48], [1, 38, 96], R.interior, { east: R.side, west: R.side }),
  cube([-16, 6, -48], [32, 38, 1], R.interior, { north: R.front, south: R.partition }),
  cube([-16, 6, 47], [32, 38, 1], R.interior, { south: R.front, north: R.partition }),
  cube([-16, 44, -48], [32, 2, 96], R.roof),
  cube([-13, 46, -45], [26, 1, 90], R.roof),
  cube([-14, 2, -40], [28, 2, 80], R.dark),
];
// Cabina idéntica en los dos extremos (mampara, tablero y asiento): el vagón se ve igual de frente y
// de atrás, así que no importa hacia qué lado quede el frente del modelo en el juego.
const cabin = [
  cube([-15, 6, -35], [30, 38, 1], R.interior, { south: R.partition, north: R.partition }),
  cube([-15, 6, 34], [30, 38, 1], R.interior, { north: R.partition, south: R.partition }),
  cube([-9, 7, -47], [18, 9, 4], R.console),
  cube([-3, 7, -43], [6, 7, 5], R.seat),
  cube([-9, 7, 43], [18, 9, 4], R.console),
  cube([-3, 7, 38], [6, 7, 5], R.seat),
];
const seats = [];
for (const z of [-33, -9, 25]) {
  const length = z === -9 ? 18 : 8;
  seats.push(cube([-15, 7, z], [6, 6, length], R.seat), cube([9, 7, z], [6, 6, length], R.seat));
}
const bogies = [];
for (const z of [-32, 32]) {
  bogies.push(cube([-12, 1, z - 10], [24, 3, 20], R.dark));
  for (const dz of [-6, 6]) for (const x of [-13, 11]) bogies.push(cube([x, 0, z + dz - 3], [2, 6, 6], R.dark));
}

const geometry = {
  format_version: "1.16.0",
  "minecraft:geometry": [
    {
      description: {
        identifier: "geometry.eleytren.metro_car",
        texture_width: TW,
        texture_height: TH,
        visible_bounds_width: 8,
        visible_bounds_height: 4,
        visible_bounds_offset: [0, 1.5, 0],
      },
      bones: [
        { name: "root", pivot: [0, 0, 0] },
        { name: "body", parent: "root", pivot: [0, 6, 0] },
        { name: "shell", parent: "body", pivot: [0, 6, 0], cubes: shell },
        { name: "cabin", parent: "body", pivot: [0, 6, 0], cubes: cabin },
        { name: "seats", parent: "body", pivot: [0, 6, 0], cubes: seats },
        { name: "bogies", parent: "root", pivot: [0, 0, 0], cubes: bogies },
      ],
    },
  ],
};

// ---------- Ícono del item (16 × 16): el vagón de lado ----------
const icon = new Uint8Array(16 * 16 * 4);
for (let y = 0; y < 16; y++) {
  for (let x = 0; x < 16; x++) {
    let color = CLEAR;
    if (y >= 4 && y < 13 && x >= 1 && x < 15) {
      color = C.body;
      if (y === 4) color = C.roof;
      if (y >= 6 && y < 8 && x % 3 !== 1) color = [140, 190, 220, 255];
      if (y === 9) color = C.stripe;
      if (y === 12) color = C.skirt;
      if ((x === 1 || x === 14) && y >= 6 && y < 8) color = C.frame;
    }
    if (y >= 13 && y < 15 && [3, 5, 10, 12].includes(x)) color = C.skirt;
    set(icon, 16, x, y, color);
  }
}

// ---------- PNG ----------
function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function png(width, height, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

write(GEO_OUT, JSON.stringify(geometry, null, 2) + "\n");
write(TEX_OUT, png(TW, TH, tex));
write(ICON_OUT, png(16, 16, icon));
console.log(`✓ ${GEO_OUT}\n✓ ${TEX_OUT}\n✓ ${ICON_OUT}`);

// ---------- Vistas previas (ortográficas, solo para revisar la forma) ----------
const previewDir = process.argv.includes("--preview") ? process.argv[process.argv.indexOf("--preview") + 1] : undefined;
if (previewDir) {
  const cubes = geometry["minecraft:geometry"][0].bones.flatMap((b) => b.cubes ?? []);
  // Cada vista: cara visible, ejes de pantalla (h, v) y eje de profundidad (más cerca = mayor `toward`).
  const views = {
    side: { face: "west", h: 2, v: 1, d: 0, toward: -1, flipH: false },
    front: { face: "north", h: 0, v: 1, d: 2, toward: -1, flipH: true },
    top: { face: "up", h: 2, v: 0, d: 1, toward: 1, flipH: false },
  };
  const SCALE = 4;
  for (const [name, view] of Object.entries(views)) {
    const minH = Math.min(...cubes.map((c) => c.origin[view.h]));
    const maxH = Math.max(...cubes.map((c) => c.origin[view.h] + c.size[view.h]));
    const minV = Math.min(...cubes.map((c) => c.origin[view.v]));
    const maxV = Math.max(...cubes.map((c) => c.origin[view.v] + c.size[view.v]));
    const w = (maxH - minH + 4) * SCALE;
    const h = (maxV - minV + 4) * SCALE;
    const img = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) img.set([235, 240, 245, 255], i * 4);
    const depth = new Float32Array(w * h).fill(-Infinity);
    for (const c of cubes) {
      const near = view.toward > 0 ? c.origin[view.d] + c.size[view.d] : c.origin[view.d];
      const score = view.toward * near;
      const { uv, uv_size } = c.uv[view.face];
      for (let py = 0; py < c.size[view.v] * SCALE; py++) {
        for (let px = 0; px < c.size[view.h] * SCALE; px++) {
          const fu = px / (c.size[view.h] * SCALE);
          const fv = py / (c.size[view.v] * SCALE);
          const tu = Math.min(uv[0] + Math.floor((view.flipH ? 1 - fu : fu) * uv_size[0]), TW - 1);
          const tv = Math.min(uv[1] + Math.floor(fv * uv_size[1]), TH - 1);
          const ti = (tv * TW + tu) * 4;
          if (tex[ti + 3] === 0) continue;
          const sx = (c.origin[view.h] - minH + 2) * SCALE + px;
          // En pantalla, v crece hacia abajo; en el modelo, Y crece hacia arriba (salvo en la vista superior).
          const top = view.v === 1 ? maxV - (c.origin[view.v] + c.size[view.v]) : c.origin[view.v] - minV;
          const sy = (top + 2) * SCALE + py;
          const si = sy * w + sx;
          if (score < depth[si]) continue;
          depth[si] = score;
          img.set(tex.subarray(ti, ti + 4), si * 4);
        }
      }
    }
    write(join(previewDir, `metro_${name}.png`), png(w, h, img));
  }
  console.log(`✓ vistas previas en ${previewDir}`);
}
