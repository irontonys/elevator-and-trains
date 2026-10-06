// Escenarios del spec `elevator` con columnas simuladas. Correr con `npm run test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { elevatorFloors, isFloor, isPassable, nextFloorDown, nextFloorUp, type BlockKind, type Column } from "./floors";

/** Columna del overworld (-64..320) con aire en todo lo que no se indique. */
function column(blocks: Record<number, BlockKind>, minY = -64, maxY = 320): Column {
  return { minY, maxY, kindAt: (y) => blocks[y] ?? "air" };
}

/** Recorre el elevador subiendo y bajando desde `start` y regresa los pisos visitados. */
function walk(c: Column, start: number, next: typeof nextFloorUp): number[] {
  const floors = [start];
  for (let y = next(c, start); y !== undefined; y = next(c, y)) floors.push(y);
  return floors;
}

test("dos bloques: sube del inicio al límite y baja de regreso", () => {
  const c = column({ 64: "elevator", 80: "elevator" });
  assert.equal(nextFloorUp(c, 64), 80);
  assert.equal(nextFloorDown(c, 80), 64);
});

test("bloque suelto: no mueve al jugador", () => {
  const c = column({ 64: "elevator", 70: "other" });
  assert.equal(nextFloorUp(c, 64), undefined);
  assert.equal(nextFloorDown(c, 64), undefined);
});

test("fuera del elevador: un piso normal sin bloques de elevador no hace nada", () => {
  const c = column({ 64: "other", 70: "other" });
  assert.equal(nextFloorUp(c, 64), undefined);
  assert.equal(nextFloorDown(c, 70), undefined);
});

test("pisos irregulares 64/69/81/90, un piso por movimiento", () => {
  const c = column({ 64: "elevator", 69: "other", 81: "other", 90: "elevator" });
  assert.deepEqual(walk(c, 64, nextFloorUp), [64, 69, 81, 90]);
  assert.deepEqual(walk(c, 90, nextFloorDown), [90, 81, 69, 64]);
});

test("suelo sin espacio para el jugador no cuenta como piso", () => {
  // 70 tiene solo un bloque de aire encima (72 es sólido); 72 sí es piso.
  const c = column({ 64: "elevator", 70: "other", 72: "other", 80: "elevator" });
  assert.equal(isFloor(c, 70), false);
  assert.deepEqual(walk(c, 64, nextFloorUp), [64, 72, 80]);
});

test("ya en el límite no sube; ya en el inicio no baja", () => {
  const c = column({ 64: "elevator", 80: "elevator" });
  assert.equal(nextFloorUp(c, 80), undefined);
  assert.equal(nextFloorDown(c, 64), undefined);
});

test("límite sin espacio para la cabeza: se queda en el último piso válido", () => {
  const c = column({ 64: "elevator", 72: "other", 80: "elevator", 81: "other" });
  assert.equal(isFloor(c, 80), false);
  assert.equal(nextFloorUp(c, 64), 72);
  assert.equal(nextFloorUp(c, 72), undefined);
});

test("tres bloques: los tramos se encadenan por el bloque intermedio", () => {
  const c = column({ 64: "elevator", 72: "other", 80: "elevator", 88: "other", 96: "elevator" });
  assert.equal(nextFloorUp(c, 80), 88);
  assert.equal(nextFloorDown(c, 80), 72);
  assert.deepEqual(walk(c, 64, nextFloorUp), [64, 72, 80, 88, 96]);
  assert.deepEqual(walk(c, 96, nextFloorDown), [96, 88, 80, 72, 64]);
});

test("líquidos no son piso ni dejan espacio para la cabeza", () => {
  const c = column({ 64: "elevator", 70: "liquid", 74: "other", 75: "liquid", 78: "other", 84: "elevator" });
  assert.equal(isFloor(c, 70), false);
  assert.equal(isFloor(c, 74), false);
  assert.deepEqual(walk(c, 64, nextFloorUp), [64, 78, 84]);
});

test("el edificio cambia: se usan los bloques del momento", () => {
  const blocks: Record<number, BlockKind> = { 64: "elevator", 80: "elevator" };
  const c = column(blocks);
  assert.equal(nextFloorUp(c, 64), 80);
  blocks[72] = "other";
  assert.equal(nextFloorUp(c, 64), 72);
  delete blocks[72];
  assert.equal(nextFloorUp(c, 64), 80);
});

test("bordes de la altura del mundo", () => {
  // Límite en el bloque más alto (319): el aire fuera del mundo cuenta como espacio para la cabeza.
  const top = column({ 300: "elevator", 319: "elevator" });
  assert.equal(nextFloorUp(top, 300), 319);
  assert.equal(nextFloorDown(top, 319), 300);
  // Inicio en el bloque más bajo (-64).
  const bottom = column({ [-64]: "elevator", [-50]: "elevator" });
  assert.equal(nextFloorDown(bottom, -50), -64);
  assert.equal(nextFloorDown(bottom, -64), undefined);
  // Sin límite arriba dentro del mundo: no sube aunque haya pisos.
  const open = column({ 300: "elevator", 310: "other" });
  assert.equal(nextFloorUp(open, 300), undefined);
});

test("indicador: PB en el bloque de elevador más bajo y pisos irregulares en orden", () => {
  const c = column({ 64: "elevator", 69: "other", 81: "other", 90: "elevator" });
  assert.deepEqual(elevatorFloors(c, 69), [64, 69, 81, 90]);
});

test("indicador: la numeración cruza 3+ bloques encadenados", () => {
  const c = column({ 64: "elevator", 72: "other", 80: "elevator", 88: "other", 96: "elevator" });
  const floors = elevatorFloors(c, 88);
  assert.deepEqual(floors, [64, 72, 80, 88, 96]);
  assert.equal(floors?.indexOf(88), 3);
});

test("indicador: fuera de la cadena o con un solo bloque no hay pisos", () => {
  const c = column({ 64: "elevator", 80: "elevator", 90: "other" });
  assert.equal(elevatorFloors(c, 90), undefined);
  assert.equal(elevatorFloors(c, 60), undefined);
  assert.equal(elevatorFloors(column({ 64: "elevator" }), 64), undefined);
});

test("alfombras, carteles y antorchas cuentan como aire; torchflower no", () => {
  for (const id of ["white_carpet", "moss_carpet", "pale_moss_carpet", "standing_sign", "wall_sign", "oak_hanging_sign", "darkoak_wall_sign", "spruce_standing_sign", "torch", "soul_torch", "redstone_torch", "unlit_redstone_torch", "underwater_torch", "copper_torch", "colored_torch_red"]) {
    assert.equal(isPassable(`minecraft:${id}`), true, id);
  }
  for (const id of ["torchflower", "torchflower_crop", "stone", "oak_planks", "air"]) {
    assert.equal(isPassable(`minecraft:${id}`), false, id);
  }
});

test("alfombra sobre un piso y antorcha o cartel en el espacio de la cabeza no estorban", () => {
  // Así ve la columna elevator.ts: los bloques "pasables" ya llegan como aire.
  const kinds: Record<string, BlockKind> = { stone: "other", white_carpet: "air", torch: "air", wall_sign: "air", oak_hanging_sign: "air", torchflower: "other" };
  const build = (ids: Record<number, string>) => column(Object.fromEntries(Object.entries(ids).map(([y, id]) => [y, id === "elevator" ? "elevator" : kinds[id]!])));
  // Alfombra en 73 sobre el piso 72, antorcha en 82 y cartel de pared en 83 sobre el piso 81, cartel colgante en 77.
  const c = build({ 64: "elevator", 72: "stone", 73: "white_carpet", 77: "oak_hanging_sign", 81: "stone", 82: "torch", 83: "wall_sign", 90: "elevator" });
  assert.deepEqual(walk(c, 64, nextFloorUp), [64, 72, 81, 90]);
  // Una torchflower sí es bloque: la flor en 73 tapa la cabeza del piso 72… y ella misma es piso.
  const flower = build({ 64: "elevator", 72: "stone", 73: "torchflower", 90: "elevator" });
  assert.deepEqual(walk(flower, 64, nextFloorUp), [64, 73, 90]);
});
