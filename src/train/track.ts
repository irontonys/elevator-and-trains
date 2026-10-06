// Geometría de la vía a partir de los rieles vanilla. Lógica pura (no importa @minecraft/server).
// Coordenadas de Minecraft: norte = −Z, sur = +Z, este = +X, oeste = −X.

/** `rail_direction` del riel en ese bloque, o undefined si no hay riel (o no está cargado). */
export type RailAt = (x: number, y: number, z: number) => number | undefined;

export type Side = "N" | "S" | "E" | "W";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Posición sobre la vía: bloque del riel, lado por el que se entró y avance dentro del bloque. */
export interface Cursor {
  x: number;
  y: number;
  z: number;
  dir: number;
  from: Side;
  s: number;
}

interface RailShape {
  sides: [Side, Side];
  /** Lado alto de una pendiente (está una Y más arriba). */
  high?: Side;
}

/** Tabla de `rail_direction` de Bedrock (minecraft.wiki, ver decisiones.md). */
const SHAPES: Record<number, RailShape> = {
  0: { sides: ["N", "S"] },
  1: { sides: ["E", "W"] },
  2: { sides: ["W", "E"], high: "E" },
  3: { sides: ["E", "W"], high: "W" },
  4: { sides: ["S", "N"], high: "N" },
  5: { sides: ["N", "S"], high: "S" },
  6: { sides: ["S", "E"] },
  7: { sides: ["S", "W"] },
  8: { sides: ["N", "W"] },
  9: { sides: ["N", "E"] },
};

const OFFSET: Record<Side, { dx: number; dz: number }> = {
  N: { dx: 0, dz: -1 },
  S: { dx: 0, dz: 1 },
  E: { dx: 1, dz: 0 },
  W: { dx: -1, dz: 0 },
};

/** Punto medio de cada lado, en coordenadas locales del bloque (0..1). */
const MID: Record<Side, { x: number; z: number }> = {
  N: { x: 0.5, z: 0 },
  S: { x: 0.5, z: 1 },
  E: { x: 1, z: 0.5 },
  W: { x: 0, z: 0.5 },
};

const OPPOSITE: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };

export function shapeOf(dir: number | undefined): RailShape | undefined {
  return dir === undefined ? undefined : SHAPES[dir];
}

function isCurve(shape: RailShape): boolean {
  const [a, b] = shape.sides;
  return OPPOSITE[a] !== b;
}

function heightAt(shape: RailShape, side: Side): number {
  return shape.high === side ? 1 : 0;
}

function exitSide(shape: RailShape, from: Side): Side {
  return shape.sides[0] === from ? shape.sides[1] : shape.sides[0];
}

/** Largo del recorrido dentro del bloque: 1 en recta, √2 en pendiente y π/4 en curva. */
export function lengthOf(dir: number): number {
  const shape = SHAPES[dir];
  if (!shape) return 0;
  if (isCurve(shape)) return Math.PI / 4;
  return shape.high ? Math.SQRT2 : 1;
}

/** Cursor en el centro del riel de ese bloque, entrando por el primer lado de su forma. */
export function cursorAt(railAt: RailAt, x: number, y: number, z: number): Cursor | undefined {
  const dir = railAt(x, y, z);
  const shape = shapeOf(dir);
  if (dir === undefined || !shape) return undefined;
  return { x, y, z, dir, from: shape.sides[0], s: lengthOf(dir) / 2 };
}

/** El mismo punto viendo hacia el otro lado. */
export function reverse(cursor: Cursor): Cursor {
  const shape = SHAPES[cursor.dir]!;
  return { ...cursor, from: exitSide(shape, cursor.from), s: lengthOf(cursor.dir) - cursor.s };
}

/** Posición 3D del cursor (Y = altura del bloque del riel, más la pendiente). */
export function pointAt(cursor: Cursor): Vec3 {
  const shape = SHAPES[cursor.dir]!;
  const to = exitSide(shape, cursor.from);
  const t = cursor.s / lengthOf(cursor.dir);
  const a = MID[cursor.from];
  const b = MID[to];
  let lx: number;
  let lz: number;
  if (isCurve(shape)) {
    // Cuarto de círculo de radio 0.5 alrededor de la esquina que comparten los dos lados.
    const cx = a.x === 0.5 ? b.x : a.x;
    const cz = a.z === 0.5 ? b.z : a.z;
    const angle = (t * Math.PI) / 2;
    lx = cx + Math.cos(angle) * (a.x - cx) + Math.sin(angle) * (b.x - cx);
    lz = cz + Math.cos(angle) * (a.z - cz) + Math.sin(angle) * (b.z - cz);
  } else {
    lx = a.x + (b.x - a.x) * t;
    lz = a.z + (b.z - a.z) * t;
  }
  const h = heightAt(shape, cursor.from) + (heightAt(shape, to) - heightAt(shape, cursor.from)) * t;
  return { x: cursor.x + lx, y: cursor.y + h, z: cursor.z + lz };
}

/** Siguiente pieza de vía al salir del bloque del cursor, o undefined si ahí se acaba la vía. */
function nextPiece(railAt: RailAt, cursor: Cursor): Cursor | undefined {
  const shape = SHAPES[cursor.dir]!;
  const to = exitSide(shape, cursor.from);
  const exitHeight = cursor.y + heightAt(shape, to);
  const entry = OPPOSITE[to];
  const { dx, dz } = OFFSET[to];
  // Misma altura, una arriba (salió por el lado alto) o una abajo (entra a una pendiente que baja).
  for (const y of [cursor.y + 1, cursor.y, cursor.y - 1]) {
    const dir = railAt(cursor.x + dx, y, cursor.z + dz);
    const next = shapeOf(dir);
    if (dir === undefined || !next || !next.sides.includes(entry)) continue;
    if (y + heightAt(next, entry) !== exitHeight) continue;
    return { x: cursor.x + dx, y, z: cursor.z + dz, dir, from: entry, s: 0 };
  }
  return undefined;
}

/**
 * Avanza `distance` sobre la vía (negativo = hacia atrás). Regresa el nuevo cursor y cuánto avanzó de
 * verdad: menos que `distance` si la vía se acabó antes.
 */
export function advance(railAt: RailAt, cursor: Cursor, distance: number): { cursor: Cursor; moved: number } {
  if (distance < 0) {
    const result = advance(railAt, reverse(cursor), -distance);
    return { cursor: reverse(result.cursor), moved: -result.moved };
  }
  let current = cursor;
  let left = distance;
  for (;;) {
    const room = lengthOf(current.dir) - current.s;
    if (left <= room) return { cursor: { ...current, s: current.s + left }, moved: distance };
    left -= room;
    const next = nextPiece(railAt, current);
    if (!next) return { cursor: { ...current, s: lengthOf(current.dir) }, moved: distance - left };
    current = next;
  }
}

/** Dirección de avance del cursor en el plano (vector unitario X/Z). */
export function headingOf(cursor: Cursor): { x: number; z: number } {
  const len = lengthOf(cursor.dir);
  const e = Math.min(0.05, len / 4);
  const s0 = Math.max(0, cursor.s - e);
  const s1 = Math.min(len, cursor.s + e);
  const a = pointAt({ ...cursor, s: s0 });
  const b = pointAt({ ...cursor, s: s1 });
  const h = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return { x: (b.x - a.x) / h, z: (b.z - a.z) / h };
}

/** El cursor del bloque más cercano a `point`, buscando a lo largo del riel. */
export function nearestOnBlock(cursor: Cursor, point: Vec3): Cursor {
  const len = lengthOf(cursor.dir);
  let best = cursor;
  let bestDistance = Infinity;
  for (let i = 0; i <= 16; i++) {
    const candidate = { ...cursor, s: (len * i) / 16 };
    const p = pointAt(candidate);
    const d = (p.x - point.x) ** 2 + (p.z - point.z) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return best;
}
