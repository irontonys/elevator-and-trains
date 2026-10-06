// Detección de pisos de un elevador. Lógica pura (no importa @minecraft/server) para probarla con mocks.

/** Lo único que importa de cada bloque de la columna. */
export type BlockKind = "air" | "liquid" | "elevator" | "other";

/** Una columna X/Z del mundo. `maxY` es exclusivo, igual que `Dimension.heightRange`. */
export interface Column {
  kindAt(y: number): BlockKind;
  minY: number;
  maxY: number;
}

/**
 * Bloques que el elevador trata como aire: alfombras, carteles (de pie, de pared y colgantes) y
 * antorchas de cualquier tipo. `torchflower` es una flor y no cuenta.
 */
export function isPassable(typeId: string): boolean {
  const name = typeId.startsWith("minecraft:") ? typeId.slice("minecraft:".length) : typeId;
  if (name.endsWith("carpet")) return true;
  if (name.endsWith("_sign") || name === "standing_sign" || name === "wall_sign") return true;
  return name === "torch" || name.endsWith("_torch") || name.startsWith("colored_torch_");
}

/** Fuera del mundo cuenta como aire, para que se pueda estar de pie en el bloque más alto. */
function kind(column: Column, y: number): BlockKind {
  return y < column.minY || y >= column.maxY ? "air" : column.kindAt(y);
}

/** Un piso es un bloque que no es aire ni líquido, con dos bloques de aire encima. */
export function isFloor(column: Column, y: number): boolean {
  const k = kind(column, y);
  return (k === "elevator" || k === "other") && kind(column, y + 1) === "air" && kind(column, y + 2) === "air";
}

/** Primer bloque de elevador desde `from` (incluido) en dirección `step`, o undefined. */
function findElevator(column: Column, from: number, step: 1 | -1): number | undefined {
  for (let y = from; y >= column.minY && y < column.maxY; y += step) {
    if (column.kindAt(y) === "elevator") return y;
  }
  return undefined;
}

/**
 * Siguiente piso hacia `step` desde el piso `current`, sin pasar del bloque de elevador más cercano en
 * esa dirección. Exige un bloque de elevador en `current` o del lado contrario: si no, no es elevador.
 */
function nextFloor(column: Column, current: number, step: 1 | -1): number | undefined {
  if (findElevator(column, current, step === 1 ? -1 : 1) === undefined) return undefined;
  const bound = findElevator(column, current + step, step);
  if (bound === undefined) return undefined;
  for (let y = current + step; step === 1 ? y <= bound : y >= bound; y += step) {
    if (isFloor(column, y)) return y;
  }
  return undefined;
}

/** Piso de arriba al saltar, o undefined si no hay elevador o ya está en el límite. */
export function nextFloorUp(column: Column, current: number): number | undefined {
  return nextFloor(column, current, 1);
}

/** Piso de abajo al agacharse, o undefined si no hay elevador o ya está en el inicio. */
export function nextFloorDown(column: Column, current: number): number | undefined {
  return nextFloor(column, current, -1);
}

/**
 * Todos los pisos de la cadena de elevadores de la columna, de abajo hacia arriba: desde el bloque de
 * elevador más bajo hasta el más alto. El índice 0 es la planta baja. Undefined si `current` no está
 * dentro de la cadena o la columna tiene menos de dos bloques de elevador.
 */
export function elevatorFloors(column: Column, current: number): number[] | undefined {
  const bottom = findElevator(column, column.minY, 1);
  const top = findElevator(column, column.maxY - 1, -1);
  if (bottom === undefined || top === undefined || bottom === top) return undefined;
  if (current < bottom || current > top) return undefined;
  const floors: number[] = [];
  for (let y = bottom; y <= top; y++) if (isFloor(column, y)) floors.push(y);
  return floors;
}
