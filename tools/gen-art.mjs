// Genera el ícono de los packs y las imágenes de la publicación renderizando el modelo real del vagón
// (packs/RP/models + texturas) en vista isométrica. Se corre a mano después de `gen-metro.mjs`:
//   node tools/gen-art.mjs
// Salida versionada: packs/BP/pack_icon.png, packs/RP/pack_icon.png, publish/avatar.png, publish/cover.png.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// ---------- PNG ----------
function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function encodePng(width, height, rgba) {
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

/** Lee un PNG RGBA o RGB de 8 bits sin entrelazar (lo que producen gen-metro.mjs y los editores comunes). */
function decodePng(path) {
  const buf = readFileSync(path);
  let pos = 8;
  let width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error(`${path}: solo PNG de 8 bits sin entrelazar`);
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const bpp = { 6: 4, 2: 3 }[colorType];
  if (!bpp) throw new Error(`${path}: tipo de color ${colorType} no soportado`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? pixels[y * stride + x - bpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[(y - 1) * stride + x - bpp] : 0;
      let v = cur;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[y * stride + x] = v & 255;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba.set(pixels.subarray(i * bpp, i * bpp + 3), i * 4);
    rgba[i * 4 + 3] = bpp === 4 ? pixels[i * bpp + 3] : 255;
  }
  return { width, height, rgba };
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`✓ ${path}`);
}

// ---------- Texturas ----------
const metroTex = decodePng(join(ROOT, "packs/RP/textures/entity/eleytren_metro_car.png"));
const blockTex = decodePng(join(ROOT, "packs/RP/textures/blocks/eleytren_elevator_block.png"));

/** Textura procedural de 16 × 16 con ruido fijo (sin usar assets vanilla). */
function noiseTexture(colors, seed) {
  const rgba = new Uint8Array(16 * 16 * 4);
  let s = seed;
  for (let i = 0; i < 256; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const hex = colors[s % colors.length];
    rgba.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], i * 4);
  }
  return { width: 16, height: 16, rgba };
}
const grassTop = noiseTexture(["#5d9b3a", "#6aab45", "#558f34", "#64a240"], 7);
const dirt = noiseTexture(["#866043", "#79553a", "#96704f", "#6c4b33"], 11);
const grassSide = (() => {
  const t = noiseTexture(["#866043", "#79553a", "#96704f", "#6c4b33"], 13);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) if (y < 3 || (x * 7) % 5 < 2) t.rgba.set(grassTop.rgba.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 4), (y * 16 + x) * 4);
  return t;
})();
const plain = (hex) => ({ width: 1, height: 1, rgba: Uint8Array.from([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255]) });
const sleeper = plain("#6b4a2b");
const steel = plain("#9aa0a6");
const glass = { width: 1, height: 1, rgba: Uint8Array.from([190, 225, 240, 110]) };

// ---------- Escena ----------
const FACES = ["north", "south", "east", "west", "up", "down"];
const whole = (tex) => ({ tex, uv: [0, 0], size: [tex.width, tex.height] });

/** Caras de un cubo como paralelogramos: esquina en uv (0,0), eje U y eje V (unidades de 1/16 de bloque). */
function faceGeometry(o, s, face) {
  const [x0, y0, z0] = o;
  const [x1, y1, z1] = [o[0] + s[0], o[1] + s[1], o[2] + s[2]];
  const [dx, dy, dz] = s;
  switch (face) {
    case "north": return { p: [x1, y1, z0], u: [-dx, 0, 0], v: [0, -dy, 0], n: [0, 0, -1] };
    case "south": return { p: [x0, y1, z1], u: [dx, 0, 0], v: [0, -dy, 0], n: [0, 0, 1] };
    case "west": return { p: [x0, y1, z0], u: [0, 0, dz], v: [0, -dy, 0], n: [-1, 0, 0] };
    case "east": return { p: [x1, y1, z1], u: [0, 0, -dz], v: [0, -dy, 0], n: [1, 0, 0] };
    case "up": return { p: [x0, y1, z0], u: [dx, 0, 0], v: [0, 0, dz], n: [0, 1, 0] };
    case "down": return { p: [x0, y0, z1], u: [dx, 0, 0], v: [0, 0, -dz], n: [0, -1, 0] };
  }
}

/** Cubo de la escena: `skin` es una región de textura para todas las caras o un objeto por cara. */
function box(origin, size, skin) {
  return { origin, size, skin: (face) => (skin.tex ? skin : skin[face]) };
}

const geo = JSON.parse(readFileSync(join(ROOT, "packs/RP/models/entity/eleytren_metro_car.geo.json"), "utf8"));
const carCubes = geo["minecraft:geometry"][0].bones.flatMap((b) => b.cubes ?? []);

/** Vagón con su centro de vía en (x, z) y las ruedas sobre `y` (unidades de 1/16). */
function metroCar(x, y, z) {
  return carCubes.map((c) =>
    box([c.origin[0] + x, c.origin[1] + y, c.origin[2] + z], c.size, Object.fromEntries(FACES.map((f) => [f, { tex: metroTex, uv: c.uv[f].uv, size: c.uv[f].uv_size }]))),
  );
}

/** Vía recta sobre el eje Z, de z0 a z1, apoyada en `y`. */
function track(x, y, z0, z1) {
  const out = [];
  for (let z = z0 + 1; z < z1; z += 4) out.push(box([x - 7, y, z], [14, 1, 2], whole(sleeper)));
  for (const rx of [-5, 4]) out.push(box([x + rx, y + 1, z0], [1, 1, z1 - z0], whole(steel)));
  return out;
}

/** Suelo de pasto de `w` × `l` bloques con su esquina en (x0, z0); la superficie queda en y = 0. */
function ground(x0, z0, w, l) {
  const out = [];
  for (let i = 0; i < w; i++)
    for (let j = 0; j < l; j++)
      out.push(box([x0 + i * 16, -16, z0 + j * 16], [16, 16, 16], { up: whole(grassTop), down: whole(dirt), north: whole(grassSide), south: whole(grassSide), east: whole(grassSide), west: whole(grassSide) }));
  return out;
}

const elevatorBlock = (x, y, z) => box([x, y, z], [16, 16, 16], whole(blockTex));

/** Cubo de elevador: bloque de inicio abajo, de límite arriba y columna de vidrio entre los dos. */
function elevatorShaft(x, z, floors) {
  const out = [elevatorBlock(x, 0, z), elevatorBlock(x, floors * 16, z)];
  for (let i = 1; i < floors; i++) out.push(box([x, i * 16, z], [16, 16, 16], whole(glass)));
  return out;
}

// ---------- Render ----------
const LIGHT = { up: 1, down: 0.5, north: 0.8, south: 0.8, east: 0.62, west: 0.62 };

/**
 * Proyección ortográfica: gira la escena `yaw` grados sobre Y y luego `pitch` sobre X. El render es
 * `ss` veces más grande y se reduce al final (antialias). `zoom` = píxeles finales por unidad de modelo.
 */
function render(scene, { width, height, yaw, pitch, zoom, center, background, ss = 4 }) {
  const W = width * ss, H = height * ss;
  const color = new Float32Array(W * H * 3);
  const depth = new Float32Array(W * H).fill(-Infinity);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) color.set(background(x / W, y / H), (y * W + x) * 3);

  const cy = Math.cos((yaw * Math.PI) / 180), sy = Math.sin((yaw * Math.PI) / 180);
  const cp = Math.cos((pitch * Math.PI) / 180), sp = Math.sin((pitch * Math.PI) / 180);
  const rot = ([x, y, z]) => {
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; // [pantalla x, pantalla y (arriba), profundidad (hacia la cámara)]
  };
  const k = zoom * ss;
  const c = rot(center);
  const project = (p) => {
    const r = rot(p);
    return [W / 2 + (r[0] - c[0]) * k, H / 2 - (r[1] - c[1]) * k, r[2]];
  };

  // Primero lo opaco y después lo translúcido, de atrás hacia adelante.
  const faces = [];
  for (const b of scene) {
    for (const face of FACES) {
      const g = faceGeometry(b.origin, b.size, face);
      if (rot(g.n)[2] <= 0) continue; // cara de espaldas
      const skin = b.skin(face);
      const translucent = skin.tex.rgba.some((v, i) => i % 4 === 3 && v > 0 && v < 255);
      faces.push({ g, skin, face, translucent, z: rot(g.p)[2] });
    }
  }
  faces.sort((a, b) => a.translucent - b.translucent || (a.translucent ? a.z - b.z : 0));

  for (const { g, skin, face, translucent } of faces) {
    const p0 = project(g.p);
    const pu = project([g.p[0] + g.u[0], g.p[1] + g.u[1], g.p[2] + g.u[2]]);
    const pv = project([g.p[0] + g.v[0], g.p[1] + g.v[1], g.p[2] + g.v[2]]);
    const ux = pu[0] - p0[0], uy = pu[1] - p0[1], vx = pv[0] - p0[0], vy = pv[1] - p0[1];
    const det = ux * vy - uy * vx;
    if (Math.abs(det) < 1e-6) continue;
    const xs = [p0[0], pu[0], pv[0], pu[0] + vx], ys = [p0[1], pu[1], pv[1], pu[1] + vy];
    const minX = Math.max(0, Math.floor(Math.min(...xs))), maxX = Math.min(W - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys))), maxY = Math.min(H - 1, Math.ceil(Math.max(...ys)));
    const shade = LIGHT[face];
    const { tex, uv, size } = skin;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x + 0.5 - p0[0], dy = y + 0.5 - p0[1];
        const s = (dx * vy - dy * vx) / det;
        const t = (ux * dy - uy * dx) / det;
        if (s < 0 || s >= 1 || t < 0 || t >= 1) continue;
        const z = p0[2] + s * (pu[2] - p0[2]) + t * (pv[2] - p0[2]);
        const i = y * W + x;
        if (z <= depth[i]) continue;
        const tu = Math.min(uv[0] + Math.floor(s * size[0]), tex.width - 1);
        const tv = Math.min(uv[1] + Math.floor(t * size[1]), tex.height - 1);
        const ti = (tv * tex.width + tu) * 4;
        const a = tex.rgba[ti + 3] / 255;
        if (a === 0) continue;
        for (let ch = 0; ch < 3; ch++) {
          const src = (tex.rgba[ti + ch] / 255) * shade;
          color[i * 3 + ch] = a === 1 ? src : color[i * 3 + ch] * (1 - a) + src * a;
        }
        if (!translucent) depth[i] = z;
      }
    }
  }

  // Reducción con promedio de bloques ss × ss.
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const acc = [0, 0, 0];
      for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) for (let ch = 0; ch < 3; ch++) acc[ch] += color[((y * ss + j) * W + x * ss + i) * 3 + ch];
      out.set([...acc.map((v) => Math.round(Math.min(1, v / (ss * ss)) * 255)), 255], (y * width + x) * 4);
    }
  }
  return out;
}

/** Cielo: degradado vertical entre dos colores. */
function sky(topHex, bottomHex) {
  const a = [1, 3, 5].map((i) => parseInt(topHex.slice(i, i + 2), 16) / 255);
  const b = [1, 3, 5].map((i) => parseInt(bottomHex.slice(i, i + 2), 16) / 255);
  return (_x, y) => a.map((v, i) => v + (b[i] - v) * y);
}

// ---------- Ícono de los packs (256 × 256) y avatar de la publicación (400 × 400) ----------
// Un vagón sobre su vía, visto de tres cuartos desde la cabina, con el cubo del elevador detrás.
const iconScene = [...ground(-40, -56, 4, 7), ...track(0, 0, -56, 56), ...metroCar(0, 2, 0), ...elevatorShaft(-40, 24, 4)];
const iconView = { yaw: 215, pitch: 28, center: [-6, 26, 0], background: sky("#7fb8e6", "#d9ecf7") };
const icon = render(iconScene, { ...iconView, width: 256, height: 256, zoom: 1.85 });
write(join(ROOT, "packs/BP/pack_icon.png"), encodePng(256, 256, icon));
write(join(ROOT, "packs/RP/pack_icon.png"), encodePng(256, 256, icon));
write(join(ROOT, "publish/avatar.png"), encodePng(400, 400, render(iconScene, { ...iconView, width: 400, height: 400, zoom: 1.85 * (400 / 256) })));

// ---------- Portada de la publicación (1280 × 720) ----------
// Tren de tres vagones unidos y un elevador de cinco pisos a un lado de la vía.
const coverScene = [
  ...ground(-56, -168, 7, 21),
  ...track(0, 0, -168, 168),
  ...metroCar(0, 2, -100),
  ...metroCar(0, 2, 0),
  ...metroCar(0, 2, 100),
  ...elevatorShaft(-52, 150, 4),
];
write(
  join(ROOT, "publish/cover.png"),
  encodePng(1280, 720, render(coverScene, { width: 1280, height: 720, yaw: 235, pitch: 24, zoom: 3.1, center: [-10, 34, 10], background: sky("#6fb0e3", "#e3f1f9") })),
);
