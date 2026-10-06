// Vía y bogies con rieles simulados. Correr con `npm run test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BOGIE_OFFSET, fits, moveAlong, poseOf } from "./bogies";
import { advance, cursorAt, lengthOf, pointAt, reverse, type Cursor, type RailAt, type Side, type Vec3 } from "./track";

type Rail = [x: number, y: number, z: number, dir: number];

function rails(list: Rail[]): RailAt {
  const map = new Map(list.map(([x, y, z, dir]) => [`${x},${y},${z}`, dir]));
  return (x, y, z) => map.get(`${x},${y},${z}`);
}

const EPS = 1e-6;
function near(actual: number, expected: number, message?: string): void {
  assert.ok(Math.abs(actual - expected) < EPS, `${message ?? ""} ${actual} ≠ ${expected}`);
}
function nearPoint(actual: Vec3, expected: Vec3): void {
  near(actual.x, expected.x, "x");
  near(actual.y, expected.y, "y");
  near(actual.z, expected.z, "z");
}

/** Cursor en el centro de un bloque, viendo hacia el lado contrario de `from`. */
function at(x: number, y: number, z: number, dir: number, from: Side): Cursor {
  return { x, y, z, dir, from, s: lengthOf(dir) / 2 };
}

const STEP: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };
const STRAIGHT: Record<Side, number> = { N: 0, S: 0, E: 1, W: 1 };

test("recta N–S: avanza hacia el sur y se detiene al final", () => {
  const railAt = rails(Array.from({ length: 10 }, (_, z): Rail => [0, 64, z, 0]));
  const c = cursorAt(railAt, 0, 64, 5)!;
  nearPoint(pointAt(c), { x: 0.5, y: 64, z: 5.5 });
  nearPoint(pointAt(advance(railAt, c, 2).cursor), { x: 0.5, y: 64, z: 7.5 });
  const end = advance(railAt, c, 100);
  near(end.moved, 4.5);
  nearPoint(pointAt(end.cursor), { x: 0.5, y: 64, z: 10 });
  const back = advance(railAt, c, -100);
  near(back.moved, -5.5);
  nearPoint(pointAt(back.cursor), { x: 0.5, y: 64, z: 0 });
});

test("recta E–O", () => {
  const railAt = rails(Array.from({ length: 6 }, (_, x): Rail => [x, 64, 0, 1]));
  const c = at(0, 64, 0, 1, "W");
  const end = advance(railAt, c, 100);
  near(end.moved, 5.5);
  nearPoint(pointAt(end.cursor), { x: 6, y: 64, z: 0.5 });
});

for (const [dir, a, b] of [[6, "S", "E"], [7, "S", "W"], [8, "N", "W"], [9, "N", "E"]] as const) {
  test(`curva ${dir} (${a}–${b}): se cruza completa en ambos sentidos`, () => {
    const list: Rail[] = [[0, 64, 0, dir]];
    for (const side of [a, b]) {
      const [dx, dz] = STEP[side];
      for (let i = 1; i <= 3; i++) list.push([dx * i, 64, dz * i, STRAIGHT[side]]);
    }
    const railAt = rails(list);
    for (const [start, finish] of [[a, b], [b, a]] as const) {
      const [sx, sz] = STEP[start];
      const [fx, fz] = STEP[finish];
      // Desde el bloque más lejano del brazo `start`, entrando por su lado exterior.
      const c = at(sx * 3, 64, sz * 3, STRAIGHT[start], start);
      const end = advance(railAt, c, 100);
      near(end.moved, 0.5 + 2 + Math.PI / 4 + 3);
      nearPoint(pointAt(end.cursor), { x: fx * 3 + 0.5 + fx * 0.5, y: 64, z: fz * 3 + 0.5 + fz * 0.5 });
    }
  });
}

for (const [dir, high] of [[2, "E"], [3, "W"], [4, "N"], [5, "S"]] as const) {
  test(`pendiente ${dir} (sube hacia ${high}): de subida y de bajada`, () => {
    const low = OPP[high];
    const [hx, hz] = STEP[high];
    const [lx, lz] = STEP[low];
    const list: Rail[] = [[0, 64, 0, dir]];
    for (let i = 1; i <= 2; i++) {
      list.push([lx * i, 64, lz * i, STRAIGHT[high]]);
      list.push([hx * i, 65, hz * i, STRAIGHT[high]]);
    }
    const railAt = rails(list);
    const up = advance(railAt, at(lx * 2, 64, lz * 2, STRAIGHT[high], low), 100);
    near(up.moved, 0.5 + 1 + Math.SQRT2 + 2);
    nearPoint(pointAt(up.cursor), { x: hx * 2 + 0.5 + hx * 0.5, y: 65, z: hz * 2 + 0.5 + hz * 0.5 });
    // A media pendiente la altura va a la mitad.
    nearPoint(pointAt(at(0, 64, 0, dir, low)), { x: 0.5, y: 64.5, z: 0.5 });
    const down = advance(railAt, reverse(up.cursor), 100);
    near(down.moved, 0.5 + 1 + Math.SQRT2 + 2 + 0.5);
    nearPoint(pointAt(down.cursor), { x: lx * 2 + 0.5 + lx * 0.5, y: 64, z: lz * 2 + 0.5 + lz * 0.5 });
  });
}

/** Recta al este, escalera diagonal de curvas hacia el noreste y recta al norte. */
function staircase(): RailAt {
  const list: Rail[] = [];
  for (let x = -4; x <= 0; x++) list.push([x, 64, 0, 1]);
  for (let i = 0; i < 6; i++) {
    list.push([1 + i, 64, -i, 8]); // entra por el oeste, sale al norte
    list.push([1 + i, 64, -i - 1, 6]); // entra por el sur, sale al este
  }
  list.push([7, 64, -6, 8]);
  for (let z = -7; z >= -12; z--) list.push([7, 64, z, 0]);
  return rails(list);
}

test("escalera diagonal: el yaw cambia de forma gradual", () => {
  const railAt = staircase();
  let center: Cursor = at(-2, 64, 0, 1, "W");
  let previous = poseOf(railAt, center).yaw;
  near(previous, -90); // viendo al este
  let total = 0;
  for (;;) {
    const step = moveAlong(railAt, center, 0.1);
    if (step.moved === 0) break;
    center = step.center;
    total += step.moved;
    const { yaw } = poseOf(railAt, center);
    const change = Math.abs(((yaw - previous + 540) % 360) - 180);
    assert.ok(change <= 15, `cambio de ${change}° tras ${total.toFixed(1)} bloques`);
    previous = yaw;
  }
  near(Math.abs(previous), 180, "termina viendo al norte"); // ±180 = norte
  near(total, 2.5 + 13 * (Math.PI / 4) + 6 - BOGIE_OFFSET, "recorre toda la vía hasta que el frente llega al final");
});

test("S de curvas: este → norte → este", () => {
  const railAt = rails([
    [0, 64, 0, 1], [1, 64, 0, 1], [2, 64, 0, 8],
    [2, 64, -1, 0], [2, 64, -2, 0],
    [2, 64, -3, 6], [3, 64, -3, 1], [4, 64, -3, 1],
  ]);
  const end = advance(railAt, at(0, 64, 0, 1, "W"), 100);
  near(end.moved, 0.5 + 1 + Math.PI / 4 + 2 + Math.PI / 4 + 2);
  nearPoint(pointAt(end.cursor), { x: 5, y: 64, z: -2.5 });
});

test("óvalo cerrado: da la vuelta completa y regresa al inicio", () => {
  const list: Rail[] = [[0, 64, 0, 6], [5, 64, 0, 7], [5, 64, 3, 8], [0, 64, 3, 9]];
  for (let x = 1; x <= 4; x++) list.push([x, 64, 0, 1], [x, 64, 3, 1]);
  for (let z = 1; z <= 2; z++) list.push([0, 64, z, 0], [5, 64, z, 0]);
  const railAt = rails(list);
  const start = at(2, 64, 0, 1, "W");
  const perimeter = 12 + Math.PI;
  for (const distance of [perimeter, -perimeter, 3 * perimeter]) {
    const lap = advance(railAt, start, distance);
    near(lap.moved, distance);
    nearPoint(pointAt(lap.cursor), pointAt(start));
  }
});

test("riel vecino que no conecta y bloque sin cargar = fin de vía", () => {
  // Un riel N–S pegado al final de una vía E–O no la continúa.
  const railAt = rails([[0, 64, 0, 1], [1, 64, 0, 1], [2, 64, 0, 0]]);
  const end = advance(railAt, at(0, 64, 0, 1, "W"), 100);
  nearPoint(pointAt(end.cursor), { x: 2, y: 64, z: 0.5 });
  // Sin cargar: railAt regresa undefined, igual que sin riel.
  const unloaded: RailAt = (x, y, z) => (x >= 2 ? undefined : railAt(x, y, z));
  nearPoint(pointAt(advance(unloaded, at(0, 64, 0, 1, "W"), 100).cursor), { x: 2, y: 64, z: 0.5 });
});

test("bogies: caben solo con vía suficiente y el frente no se sale al final", () => {
  const line = (n: number) => rails(Array.from({ length: n }, (_, z): Rail => [0, 64, z, 0]));
  assert.equal(fits(line(2), cursorAt(line(2), 0, 64, 1)!), false);
  assert.equal(fits(line(5), cursorAt(line(5), 0, 64, 2)!), true);
  const railAt = line(10);
  const center = cursorAt(railAt, 0, 64, 5)!;
  const step = moveAlong(railAt, center, 10);
  assert.equal(step.blocked, true);
  nearPoint(pointAt(step.center), { x: 0.5, y: 64, z: 10 - BOGIE_OFFSET });
  const reverseStep = moveAlong(railAt, center, -10);
  assert.equal(reverseStep.blocked, true);
  nearPoint(pointAt(reverseStep.center), { x: 0.5, y: 64, z: BOGIE_OFFSET });
});

test("pose: yaw según el sentido y pitch en pendiente", () => {
  const railAt = rails(Array.from({ length: 10 }, (_, z): Rail => [0, 64, z, 0]));
  const south = cursorAt(railAt, 0, 64, 5)!;
  near(poseOf(railAt, south).yaw, 0);
  near(Math.abs(poseOf(railAt, reverse(south)).yaw), 180);
  // Rampa larga hacia el este: 4 pendientes seguidas.
  const ramp = rails([[0, 64, 0, 1], [1, 64, 0, 2], [2, 65, 0, 2], [3, 66, 0, 2], [4, 67, 0, 2], [5, 68, 0, 1]]);
  const pose = poseOf(ramp, at(2, 65, 0, 2, "W"));
  near(pose.yaw, -90);
  near(pose.pitch, 45);
});
