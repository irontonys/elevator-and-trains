// Trenes de varios vagones con rieles simulados. Correr con `npm run test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BOGIE_OFFSET, poseOf } from "./bogies";
import { CAR_SPACING, carCenters, findContact, findNeighbor, joinOrder, MAX_CARS, moveConsist, splitAt, type CarPoint } from "./consist";
import { advance, lengthOf, pointAt, type Cursor, type RailAt, type Side } from "./track";

type Rail = [x: number, y: number, z: number, dir: number];
function rails(list: Rail[]): RailAt {
  const map = new Map(list.map(([x, y, z, dir]) => [`${x},${y},${z}`, dir]));
  return (x, y, z) => map.get(`${x},${y},${z}`);
}
function at(x: number, y: number, z: number, dir: number, from: Side): Cursor {
  return { x, y, z, dir, from, s: lengthOf(dir) / 2 };
}
function near(actual: number, expected: number, message = ""): void {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message} ${actual} ≠ ${expected}`);
}
/** Vía recta E–O de x = 0 a x = n−1 (el tren avanza hacia el este). */
const line = (n: number) => rails(Array.from({ length: n }, (_, x): Rail => [x, 64, 0, 1]));

test("tren de 3 en curva: la distancia sobre la vía entre vagones es constante y cada uno gira por su cuenta", () => {
  // Recta al este, curva al norte (escalera) y recta al norte.
  const list: Rail[] = [];
  for (let x = -30; x <= 0; x++) list.push([x, 64, 0, 1]);
  for (let i = 0; i < 4; i++) list.push([1 + i, 64, -i, 8], [1 + i, 64, -i - 1, 6]);
  list.push([5, 64, -4, 8]);
  for (let z = -5; z >= -30; z--) list.push([5, 64, z, 0]);
  const railAt = rails(list);
  let head: Cursor = at(-2, 64, 0, 1, "W");
  for (let t = 0; t < 40; t++) {
    head = moveConsist(railAt, head, 3, 0.5).center;
    const cars = carCenters(railAt, head, 3);
    for (let k = 1; k < 3; k++) near(advance(railAt, cars[k - 1]!, -CAR_SPACING).moved, -CAR_SPACING, `hueco ${k}`);
    const yaws = cars.map((c) => poseOf(railAt, c).yaw);
    // En plena curva los vagones no apuntan todos igual.
    if (t === 20) assert.ok(new Set(yaws.map((y) => Math.round(y))).size > 1, `yaws ${yaws}`);
  }
});

test("adelante limita el bogie de la cabeza; en reversa, el de la cola", () => {
  const railAt = line(40);
  const head = at(20, 64, 0, 1, "W"); // centro de la cabeza en x = 20.5
  const forward = moveConsist(railAt, head, 3, 100);
  assert.equal(forward.blocked, true);
  near(pointAt(forward.center).x, 40 - BOGIE_OFFSET);
  const back = moveConsist(railAt, head, 3, -100);
  assert.equal(back.blocked, true);
  // La cola queda con su bogie trasero en x = 0.
  near(pointAt(back.center).x, 2 * CAR_SPACING + BOGIE_OFFSET);
});

test("unir trenes: 2 + 2 sí, 4 + 1 no y vagón de en medio no", () => {
  const ahead = joinOrder(["a1", "a2"], ["b1", "b2"], 1, 1);
  assert.deepEqual(ahead, { order: ["b1", "b2", "a1", "a2"], headShift: 2 * CAR_SPACING });
  const aheadReversed = joinOrder(["a1", "a2"], ["b1", "b2"], 0, 1);
  assert.deepEqual(aheadReversed?.order, ["b2", "b1", "a1", "a2"]);
  const behind = joinOrder(["a1"], ["b1", "b2"], 0, -1);
  assert.deepEqual(behind, { order: ["a1", "b1", "b2"], headShift: 0 });
  assert.equal(joinOrder(["a1", "a2", "a3", "a4"], ["b1"], 0, 1), undefined);
  assert.equal(joinOrder(["a1"], ["b1", "b2", "b3"], 1, 1), undefined);
  assert.equal(MAX_CARS, 4);
});

test("partir un tren de 3 en 1 + 2", () => {
  const railAt = line(40);
  const head = at(30, 64, 0, 1, "W");
  const [front, rear] = splitAt(railAt, ["c1", "c2", "c3"], head, 1);
  assert.deepEqual(front.order, ["c1"]);
  assert.deepEqual(rear.order, ["c2", "c3"]);
  near(pointAt(rear.head).x, 30.5 - CAR_SPACING);
});

test("choque: el tren se detiene justo al tocar a otro vagón y no lo atraviesa", () => {
  const railAt = line(60);
  // Vagón detenido con su centro en x = 40.5; el tren llega desde el oeste a 1 bloque por tick.
  const other: CarPoint<string>[] = [{ consist: "B", index: 0, count: 1, point: pointAt(at(40, 64, 0, 1, "W")) }];
  let head: Cursor = at(10, 64, 0, 1, "W");
  let touched: string | undefined;
  for (let t = 0; t < 60 && !touched; t++) {
    const contact = findContact(railAt, head, 2, 1, 1, other);
    head = moveConsist(railAt, head, 2, contact ? contact.allowed : 1).center;
    touched = contact?.car.consist;
  }
  assert.equal(touched, "B");
  // Al tocarse, la cabeza queda a un vagón de distancia del otro (± la tolerancia).
  assert.ok(Math.abs(40.5 - CAR_SPACING - pointAt(head).x) <= 0.125 + 1e-9, `cabeza en ${pointAt(head).x}`);
});

test("choque en reversa: lo detecta detrás de la cola", () => {
  const railAt = line(60);
  const other: CarPoint<string>[] = [{ consist: "B", index: 1, count: 2, point: pointAt(at(5, 64, 0, 1, "W")) }];
  // Cabeza en x = 19.5 y cola en 13.25: un vagón más atrás quedaría en 7.0, a 1.5 del otro (5.5).
  const contact = findContact(railAt, at(19, 64, 0, 1, "W"), 2, -1, 2, other);
  assert.equal(contact?.car.consist, "B");
  near(contact!.allowed, 1.5);
});

test("sin vía más adelante no hay choque", () => {
  const railAt = line(12);
  const other: CarPoint<string>[] = [{ consist: "B", index: 0, count: 1, point: { x: 20, y: 64, z: 0.5 } }];
  assert.equal(findContact(railAt, at(5, 64, 0, 1, "W"), 1, 1, 1, other), undefined);
});

test("colocar pegado: encuentra al vecino adelante o atrás y cuánto correrse", () => {
  const railAt = line(60);
  const other: CarPoint<string>[] = [{ consist: "B", index: 0, count: 1, point: pointAt(at(30, 64, 0, 1, "W")) }];
  // Colocado 7 bloques antes (0.75 de más): se corre 0.75 hacia adelante.
  const before = findNeighbor(railAt, at(23, 64, 0, 1, "W"), other);
  assert.equal(before?.direction, 1);
  near(before!.shift, 0.75);
  // Colocado 6 bloques después, viendo al este: el vecino queda atrás y se corre 0.25 hacia atrás… en sentido −1.
  const after = findNeighbor(railAt, at(36, 64, 0, 1, "W"), other);
  assert.equal(after?.direction, -1);
  near(after!.shift, -0.25);
  // Muy lejos: no hay vecino.
  assert.equal(findNeighbor(railAt, at(45, 64, 0, 1, "W"), other), undefined);
});
