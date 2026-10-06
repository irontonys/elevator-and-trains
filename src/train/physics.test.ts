// Física del tren. Correr con `npm run test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BOOST_MAX_SPEED, MAX_REVERSE_SPEED, MAX_SPEED } from "./config";
import { nextMotion, rollSound, type Motion, type RailEffect } from "./physics";

/** Velocidad del carrito vanilla en recta: ~8 bloques/s. */
const MINECART_SPEED = 8 / 20;

function hold(start: number | Motion, input: number | undefined, ticks: number, rail: RailEffect = "normal"): Motion {
  let motion = typeof start === "number" ? { speed: start, departing: false } : start;
  for (let i = 0; i < ticks; i++) motion = nextMotion(motion, input, rail);
  return motion;
}

test("adelante acelera hasta 12 b/s, más que un carrito vanilla", () => {
  const { speed } = hold(0, 1, 1000);
  assert.equal(speed, MAX_SPEED);
  near(speed * 20, 12);
  assert.ok(speed > MINECART_SPEED);
});

test("atrás frena, se detiene y luego acelera en reversa hasta su máximo", () => {
  let motion: Motion = { speed: MAX_SPEED, departing: false };
  let ticks = 0;
  while (motion.speed > 0) {
    motion = nextMotion(motion, -1, "normal");
    ticks++;
  }
  assert.equal(motion.speed, 0);
  assert.ok(ticks < 30, `frenó en ${ticks} ticks`);
  assert.equal(hold(0, -1, 1000).speed, -MAX_REVERSE_SPEED);
});

test("sin input pierde velocidad poco a poco", () => {
  const after = nextMotion({ speed: MAX_SPEED, departing: false }, 0, "normal").speed;
  assert.ok(after < MAX_SPEED && after > MAX_SPEED - 0.01);
  assert.equal(hold(MAX_SPEED, 0, 1000).speed, 0);
});

test("sin conductor frena hasta detenerse y se queda quieto", () => {
  assert.equal(hold(MAX_SPEED, undefined, 100).speed, 0);
  assert.equal(hold(-MAX_REVERSE_SPEED, undefined, 100).speed, 0);
  assert.equal(hold(0, undefined, 10).speed, 0);
});

test("joystick casi en el centro no mueve el tren", () => {
  assert.equal(hold(0, 0.2, 1).speed, 0);
  assert.equal(hold(0, -0.2, 1).speed, 0);
});

test("propulsor encendido: acelera solo hasta 20 b/s y al salir baja a 12 con adelante", () => {
  const boosted = hold(0, undefined, 200, "boost");
  assert.equal(boosted.speed, BOOST_MAX_SPEED);
  near(boosted.speed * 20, 20);
  // Ignora "atrás" del conductor mientras está sobre el propulsor.
  assert.equal(hold(MAX_SPEED, -1, 200, "boost").speed, BOOST_MAX_SPEED);
  // Ya fuera del tramo, con "adelante" sostenido, baja poco a poco hasta el máximo del conductor.
  const first = nextMotion(boosted, 1, "normal").speed;
  assert.ok(first < BOOST_MAX_SPEED && first > BOOST_MAX_SPEED - 0.01);
  assert.equal(hold(boosted, 1, 1000).speed, MAX_SPEED);
});

test("propulsor encendido en reversa empuja hacia atrás", () => {
  assert.equal(hold(-0.05, undefined, 200, "boost").speed, -BOOST_MAX_SPEED);
});

test("arranca solo hacia el frente si está detenido sobre un propulsor encendido", () => {
  assert.ok(nextMotion({ speed: 0, departing: false }, undefined, "boost").speed > 0);
});

test("propulsor apagado: frena aunque el conductor mantenga adelante y luego deja salir", () => {
  const stopped = untilStopped({ speed: MAX_SPEED, departing: false }, 1, "brake");
  assert.equal(stopped.departing, true);
  // Detenido sobre la estación, "adelante" lo hace arrancar y no lo vuelve a frenar ahí.
  const leaving = hold(stopped, 1, 20, "brake");
  assert.ok(leaving.speed > 0.1, `sale a ${leaving.speed}`);
  // Al dejar el tramo apagado se olvida la salida: la siguiente estación vuelve a frenarlo.
  const away = hold(leaving, 1, 1, "normal");
  assert.equal(away.departing, false);
  assert.equal(untilStopped(away, 1, "brake").speed, 0);
});

/** Avanza hasta que el tren se detiene (falla si no se detiene en 200 ticks). */
function untilStopped(start: Motion, input: number | undefined, rail: RailEffect): Motion {
  let motion = start;
  for (let i = 0; i < 200; i++) {
    motion = nextMotion(motion, input, rail);
    if (motion.speed === 0) return motion;
  }
  assert.fail(`no se detuvo: ${motion.speed}`);
}

function near(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);
}

test("sonido de rieles: callado detenido, más fuerte y agudo con más velocidad", () => {
  assert.equal(rollSound(0), undefined);
  assert.equal(rollSound(0.01), undefined);
  const slow = rollSound(0.1)!;
  const fast = rollSound(BOOST_MAX_SPEED)!;
  assert.ok(fast.volume > slow.volume && fast.pitch > slow.pitch);
  assert.equal(fast.volume, 0.7);
  assert.deepEqual(rollSound(-0.1), slow); // en reversa suena igual
});
