// Trenes de varios vagones (lógica pura): posiciones sobre la vía, avance, unir, partir y detectar choques.
import { BOGIE_OFFSET, moveAlong } from "./bogies";
import { advance, pointAt, type Cursor, type RailAt, type Vec3 } from "./track";

/** Distancia entre los centros de dos vagones enganchados, medida sobre la vía (6 de largo + holgura). */
export const CAR_SPACING = 6.25;
export const MAX_CARS = 4;
/** Qué tan cerca (bloques) tiene que quedar el extremo de un tren del centro de un vagón para tocarlo. */
export const CONTACT_TOLERANCE = 0.5;
/** Paso con el que se busca un choque a lo largo de la vía. */
const CONTACT_STEP = 0.25;

/** Centros de los vagones, de la cabeza hacia la cola. */
export function carCenters(railAt: RailAt, head: Cursor, count: number): Cursor[] {
  return Array.from({ length: count }, (_, k) => advance(railAt, head, -k * CAR_SPACING).cursor);
}

/** Mueve la cabeza sin que se salga el bogie delantero de la cabeza ni, en reversa, el trasero de la cola. */
export function moveConsist(railAt: RailAt, head: Cursor, count: number, distance: number) {
  return moveAlong(railAt, head, distance, BOGIE_OFFSET, (count - 1) * CAR_SPACING + BOGIE_OFFSET);
}

/** Un vagón de otro tren: a qué tren pertenece, su posición en él y dónde está. */
export interface CarPoint<T> {
  consist: T;
  index: number;
  count: number;
  point: Vec3;
}

export interface Contact<T> {
  /** Cuánto puede avanzar la cabeza (bloques, sin signo) antes de tocar al otro tren. */
  allowed: number;
  car: CarPoint<T>;
}

/**
 * Busca otro tren en el camino: revisa dónde quedaría un vagón más, delante de la cabeza (`direction`
 * 1) o detrás de la cola (−1), a lo largo de `distance` bloques más la tolerancia. Solo cuentan los
 * vagones de los extremos del otro tren.
 */
export function findContact<T>(
  railAt: RailAt,
  head: Cursor,
  count: number,
  direction: 1 | -1,
  distance: number,
  others: CarPoint<T>[],
): Contact<T> | undefined {
  const ends = others.filter((c) => c.index === 0 || c.index === c.count - 1);
  if (ends.length === 0) return undefined;
  const origin = direction > 0 ? head : advance(railAt, head, -(count - 1) * CAR_SPACING).cursor;
  const wanted = Math.abs(distance);
  const limit = wanted + CONTACT_TOLERANCE;
  let best: { s: number; d: number; car: CarPoint<T> } | undefined;
  for (let s = 0; s <= limit + 1e-9; s += CONTACT_STEP) {
    const probe = advance(railAt, origin, direction * (CAR_SPACING + s));
    if (Math.abs(probe.moved) < CAR_SPACING + s - 1e-9) break; // la vía se acaba antes
    const p = pointAt(probe.cursor);
    if (best) {
      // Ya se tocó: se sigue mientras el hueco se cierre, para quedar justo a un vagón de distancia.
      const d = distance3(best.car.point, p);
      if (d >= best.d) break;
      best = { s, d, car: best.car };
      continue;
    }
    for (const car of ends) {
      const d = distance3(car.point, p);
      if (d <= CONTACT_TOLERANCE && (!best || d < best.d)) best = { s, d, car };
    }
  }
  // El punto de contacto queda más allá de lo que avanza en este tick: todavía no chocan.
  if (!best || best.s > wanted + 1e-9) return undefined;
  return { allowed: best.s, car: best.car };
}

/** Qué tanto puede correrse un vagón recién colocado para engancharse con un vecino. */
export const PLACE_WINDOW = 1.5;

/**
 * Vecino para un vagón recién colocado: el extremo de otro tren a un vagón de distancia sobre la vía,
 * adelante (`direction` 1) o atrás (−1), aunque haya quedado hasta `PLACE_WINDOW` más cerca o más
 * lejos. `shift` es cuánto correr el vagón nuevo (en el sentido `direction`) para que quede exacto.
 */
export function findNeighbor<T>(railAt: RailAt, center: Cursor, others: CarPoint<T>[]): { direction: 1 | -1; shift: number; car: CarPoint<T> } | undefined {
  const ends = others.filter((c) => c.index === 0 || c.index === c.count - 1);
  let best: { direction: 1 | -1; shift: number; car: CarPoint<T>; d: number } | undefined;
  for (const direction of [1, -1] as const) {
    for (let s = -PLACE_WINDOW; s <= PLACE_WINDOW + 1e-9; s += CONTACT_STEP) {
      const probe = advance(railAt, center, direction * (CAR_SPACING + s));
      if (Math.abs(probe.moved) < CAR_SPACING + s - 1e-9) break;
      const p = pointAt(probe.cursor);
      for (const car of ends) {
        const d = distance3(car.point, p);
        if (d <= CONTACT_TOLERANCE && (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) <= 1e-9 && Math.abs(s) < Math.abs(best.shift)))) {
          best = { direction, shift: s, car, d };
        }
      }
    }
  }
  return best && { direction: best.direction, shift: best.shift, car: best.car };
}

/**
 * Orden del tren unido, de la cabeza a la cola, y cuánto se corre la cabeza sobre la vía (en el sentido
 * de avance de `mine`). `hitIndex` es el vagón del otro tren que se tocó (debe ser un extremo).
 * Undefined si pasaría de `MAX_CARS` o si se tocó un vagón de en medio.
 */
export function joinOrder<T>(mine: T[], other: T[], hitIndex: number, direction: 1 | -1): { order: T[]; headShift: number } | undefined {
  if (mine.length + other.length > MAX_CARS) return undefined;
  if (hitIndex !== 0 && hitIndex !== other.length - 1) return undefined;
  if (direction > 0) {
    // El otro tren queda delante: su vagón tocado es el más cercano, así que la cabeza nueva es su otro extremo.
    const ahead = hitIndex === 0 ? [...other].reverse() : other;
    return { order: [...ahead, ...mine], headShift: other.length * CAR_SPACING };
  }
  const behind = hitIndex === 0 ? other : [...other].reverse();
  return { order: [...mine, ...behind], headShift: 0 };
}

/** Parte el tren justo antes del vagón `index`: regresa los dos trenes con sus cabezas. */
export function splitAt<T>(railAt: RailAt, order: T[], head: Cursor, index: number): [{ order: T[]; head: Cursor }, { order: T[]; head: Cursor }] {
  return [
    { order: order.slice(0, index), head },
    { order: order.slice(index), head: advance(railAt, head, -index * CAR_SPACING).cursor },
  ];
}

function distance3(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
