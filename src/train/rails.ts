// Puente entre el mundo y la lógica pura de la vía: lee los rieles vanilla con una caché corta.
import { Dimension, system } from "@minecraft/server";
import type { RailEffect } from "./physics";
import type { RailAt } from "./track";

const RAIL_TYPES = new Set(["minecraft:rail", "minecraft:golden_rail", "minecraft:detector_rail", "minecraft:activator_rail"]);
const GOLDEN_RAIL = "minecraft:golden_rail";
/** Cada cuánto se olvidan las lecturas: así se notan rieles rotos o propulsores encendidos en ≤1 s. */
const CACHE_TICKS = 20;

interface RailInfo {
  dir: number;
  effect: RailEffect;
}

/** Lecturas por dimensión: "x,y,z" → riel, o null si no hay riel (o no está cargado). */
const caches = new Map<string, Map<string, RailInfo | null>>();
let cacheTick = -CACHE_TICKS;

function read(dimension: Dimension, x: number, y: number, z: number): RailInfo | null {
  let block;
  try {
    block = dimension.getBlock({ x, y, z });
  } catch {
    return null; // fuera del mundo
  }
  // Sin bloque = chunk sin cargar: cuenta como fin de vía.
  if (!block || !RAIL_TYPES.has(block.typeId)) return null;
  const permutation = block.permutation;
  const dir = permutation.getState("rail_direction");
  if (typeof dir !== "number") return null;
  if (block.typeId !== GOLDEN_RAIL) return { dir, effect: "normal" };
  return { dir, effect: permutation.getState("rail_data_bit") === true ? "boost" : "brake" };
}

function lookup(dimension: Dimension, x: number, y: number, z: number): RailInfo | null {
  const now = system.currentTick;
  if (now - cacheTick >= CACHE_TICKS) {
    caches.clear();
    cacheTick = now;
  }
  let cache = caches.get(dimension.id);
  if (!cache) caches.set(dimension.id, (cache = new Map()));
  const key = `${x},${y},${z}`;
  let info = cache.get(key);
  if (info === undefined) cache.set(key, (info = read(dimension, x, y, z)));
  return info;
}

/** `rail_direction` de los rieles vanilla (todos cuentan para el trazo de la vía). */
export function railAtFor(dimension: Dimension): RailAt {
  return (x, y, z) => lookup(dimension, x, y, z)?.dir;
}

/** Efecto del riel en ese bloque: propulsor encendido (`boost`), apagado (`brake`) o ninguno. */
export function railEffectAt(dimension: Dimension, x: number, y: number, z: number): RailEffect {
  return lookup(dimension, x, y, z)?.effect ?? "normal";
}
