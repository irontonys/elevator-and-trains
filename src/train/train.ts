// Trenes de metro: vagones enganchados que siguen la vía, conductor, propulsores, choques y golpes.
import { Entity, EntityInventoryComponent, EntityRideableComponent, GameMode, ItemStack, Player, system, world } from "@minecraft/server";
import { poseOf } from "./bogies";
import { HIT_WINDOW_TICKS, HITS_TO_REMOVE, METRO_CAR_ID, ROLL_SOUND, ROLL_SOUND_TICKS } from "./config";
import { CAR_SPACING, carCenters, findContact, findNeighbor, joinOrder, MAX_CARS, moveConsist, type CarPoint } from "./consist";
import { nextMotion, rollSound, type Motion, type RailEffect } from "./physics";
import { railAtFor, railEffectAt } from "./rails";
import { advance, cursorAt, headingOf, nearestOnBlock, pointAt, reverse, type Cursor, type Vec3 } from "./track";

/** Dynamic property de cada vagón: a qué tren pertenece y en qué lugar (se va con la entidad). */
const CONSIST_PROPERTY = "eleytren:consist";
/** Si un tren guardado no termina de cargar en este tiempo, se rearma con los vagones que sí están. */
const REGROUP_TICKS = 200;
/** Cada cuánto se refresca el HUD de diagnóstico del conductor (solo build de desarrollo). */
const DEV_HUD_TICKS = 5;

interface Consist {
  id: string;
  /** Vagones de la cabeza a la cola. El frente de la cabeza es el sentido "adelante" del tren. */
  cars: Entity[];
  /** Centro de la cabeza sobre la vía. */
  head: Cursor;
  /** Centros de cada vagón (se recalculan solo cuando el tren se mueve). */
  centers: Cursor[];
  points: Vec3[];
  pitches: number[];
  motion: Motion;
  /** Tick del último sonido de rieles. */
  soundTick: number;
}

interface SavedCar {
  id: string;
  index: number;
  count: number;
}

const consists = new Map<string, Consist>();
/** Vagón → tren activo. */
const carConsist = new Map<string, Consist>();
/** Trenes guardados esperando a que carguen todos sus vagones. */
const pending = new Map<string, { cars: Map<number, Entity>; count: number; since: number }>();
/** Golpes recientes por jugador y vagón: `${playerId}|${entityId}`. */
const hits = new Map<string, { count: number; tick: number }>();
let intervalId: number | undefined;

export function setupTrains(): void {
  for (const id of ["overworld", "nether", "the_end"]) {
    for (const entity of world.getDimension(id).getEntities({ type: METRO_CAR_ID })) loadCar(entity);
  }
  world.afterEvents.entityLoad.subscribe(({ entity }) => {
    if (entity.typeId === METRO_CAR_ID) loadCar(entity);
  });
  world.afterEvents.entityRemove.subscribe(({ removedEntityId, typeId }) => {
    if (typeId === METRO_CAR_ID) suspendCar(removedEntityId);
  });
  world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
    if (hitEntity.typeId === METRO_CAR_ID && damagingEntity instanceof Player) onHit(damagingEntity, hitEntity);
  });
  world.beforeEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
    if (target.typeId !== METRO_CAR_ID || !player.isSneaking) return;
    // Los before events son de solo lectura: se desengancha en el siguiente tick.
    system.run(() => uncouple(target));
  });
}

// ---------- Alta y baja de vagones ----------

/** Vagón recién colocado: se vuelve un tren de uno y se engancha con un vecino si lo hay. */
export function placeCar(entity: Entity, center: Cursor): void {
  const consist = createConsist([entity], center, newId(entity));
  const railAt = railAtFor(entity.dimension);
  const neighbor = findNeighbor(railAt, center, carPointsNear(consist));
  if (neighbor) {
    consist.head = advance(railAt, center, neighbor.direction * neighbor.shift).cursor;
    join(consist, neighbor.car, neighbor.direction);
  }
  refreshPoses(consist);
}

function loadCar(entity: Entity): void {
  if (!entity.isValid || carConsist.has(entity.id)) return;
  const saved = readSaved(entity);
  if (!saved || saved.count <= 1 || consists.has(saved.id)) {
    // Tren de un vagón (o su tren ya se rearmó sin él): queda solo.
    const head = snapToTrack(entity);
    if (head) refreshPoses(createConsist([entity], head, saved && !consists.has(saved.id) ? saved.id : newId(entity)));
    return;
  }
  let group = pending.get(saved.id);
  if (!group) pending.set(saved.id, (group = { cars: new Map(), count: saved.count, since: system.currentTick }));
  group.cars.set(saved.index, entity);
  if (group.cars.size === group.count) buildPending(saved.id);
  else ensureInterval();
}

/** Arma un tren guardado con los vagones que ya cargaron, en su orden. */
function buildPending(id: string): void {
  const group = pending.get(id);
  if (!group) return;
  pending.delete(id);
  const cars = [...group.cars.entries()].sort(([a], [b]) => a - b).map(([, e]) => e).filter((e) => e.isValid);
  const head = cars[0] && snapToTrack(cars[0]);
  if (!head) return;
  const consist = createConsist(cars, head, id);
  refreshPoses(consist);
}

/** Un vagón dejó de existir en el mundo (descargado o quitado): su tren espera a que vuelva. */
function suspendCar(entityId: string): void {
  const consist = carConsist.get(entityId);
  if (!consist) return;
  dropConsist(consist);
  const group = { cars: new Map<number, Entity>(), count: consist.cars.length, since: system.currentTick };
  consist.cars.forEach((car, index) => {
    if (car.id !== entityId && car.isValid) group.cars.set(index, car);
  });
  pending.set(consist.id, group);
}

function createConsist(cars: Entity[], head: Cursor, id: string): Consist {
  const consist: Consist = { id, cars, head, centers: [], points: [], pitches: cars.map(() => 0), motion: { speed: 0, departing: false }, soundTick: -ROLL_SOUND_TICKS };
  consists.set(id, consist);
  for (const car of cars) carConsist.set(car.id, consist);
  save(consist);
  ensureInterval();
  return consist;
}

function dropConsist(consist: Consist): void {
  consists.delete(consist.id);
  for (const car of consist.cars) if (carConsist.get(car.id) === consist) carConsist.delete(car.id);
}

function ensureInterval(): void {
  intervalId ??= system.runInterval(tick, 1);
}

function save(consist: Consist): void {
  consist.cars.forEach((car, index) => {
    if (car.isValid) car.setDynamicProperty(CONSIST_PROPERTY, JSON.stringify({ id: consist.id, index, count: consist.cars.length }));
  });
}

function readSaved(entity: Entity): SavedCar | undefined {
  const raw = entity.getDynamicProperty(CONSIST_PROPERTY);
  if (typeof raw !== "string") return undefined;
  try {
    const value = JSON.parse(raw) as SavedCar;
    return typeof value.id === "string" && Number.isInteger(value.index) && Number.isInteger(value.count) ? value : undefined;
  } catch {
    return undefined;
  }
}

function newId(entity: Entity): string {
  return `${entity.id}:${system.currentTick}`;
}

function snapToTrack(entity: Entity): Cursor | undefined {
  const railAt = railAtFor(entity.dimension);
  const { x, y, z } = entity.location;
  const bx = Math.floor(x);
  const bz = Math.floor(z);
  for (const by of [Math.floor(y), Math.floor(y) - 1]) {
    const cursor = cursorAt(railAt, bx, by, bz);
    if (!cursor) continue;
    const nearest = nearestOnBlock(cursor, entity.location);
    // Yaw de Minecraft → vector: 0 = sur (+Z), 90 = oeste (−X).
    const yaw = (entity.getRotation().y * Math.PI) / 180;
    const heading = headingOf(nearest);
    return heading.x * -Math.sin(yaw) + heading.z * Math.cos(yaw) >= 0 ? nearest : reverse(nearest);
  }
  return undefined;
}

// ---------- Movimiento ----------

function tick(): void {
  for (const consist of [...consists.values()]) {
    if (!consists.has(consist.id)) continue; // se unió con otro en este mismo tick
    if (consist.cars.some((car) => !car.isValid)) {
      const missing = consist.cars.find((car) => !car.isValid)!;
      suspendCar(missing.id);
      continue;
    }
    step(consist);
  }
  for (const [id, group] of pending) {
    if (system.currentTick - group.since >= REGROUP_TICKS && group.cars.size > 0) buildPending(id);
  }
  if (consists.size === 0 && pending.size === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}

function step(consist: Consist): void {
  const dimension = consist.cars[0]!.dimension;
  const driver = driverOf(consist.cars[0]!);
  const rail = strongestEffect(consist);
  consist.motion = nextMotion(consist.motion, driver ? driver.inputInfo.getMovementVector().y : undefined, rail);
  if (__DEV__ && driver && system.currentTick % DEV_HUD_TICKS === 0) {
    driver.onScreenDisplay.setActionBar(`v=${(Math.abs(consist.motion.speed) * 20).toFixed(1)} b/s · pitch=${consist.pitches[0]!.toFixed(0)}° · ${rail}`);
  }
  const speed = consist.motion.speed;
  if (speed === 0) return; // detenido: nada que mover

  const railAt = railAtFor(dimension);
  const direction = speed > 0 ? 1 : -1;
  const contact = findContact(railAt, consist.head, consist.cars.length, direction, Math.abs(speed), carPointsNear(consist));
  const result = moveConsist(railAt, consist.head, consist.cars.length, contact ? direction * contact.allowed : speed);
  consist.head = result.center;
  if (result.blocked || contact) consist.motion = { ...consist.motion, speed: 0 };
  if (result.moved !== 0) {
    refreshPoses(consist);
    playRollSound(consist);
  }
  if (contact) join(consist, contact.car, direction);
}

/** Sonido del carrito sobre la vía en cada vagón, repetido mientras el tren se mueve. */
function playRollSound(consist: Consist): void {
  if (system.currentTick - consist.soundTick < ROLL_SOUND_TICKS) return;
  const sound = rollSound(consist.motion.speed);
  if (!sound) return;
  consist.soundTick = system.currentTick;
  for (const car of consist.cars) car.dimension.playSound(ROLL_SOUND, car.location, sound);
}

/**
 * Recalcula los centros y mueve cada vagón a su lugar sobre la vía. La inclinación va en la rotación X
 * de la entidad (negativa = frente hacia arriba) y el RP la lee con `query.body_x_rotation`.
 */
function refreshPoses(consist: Consist): void {
  const railAt = railAtFor(consist.cars[0]!.dimension);
  consist.centers = carCenters(railAt, consist.head, consist.cars.length);
  consist.points = consist.centers.map((c) => pointAt(c));
  consist.cars.forEach((car, k) => {
    const pose = poseOf(railAt, consist.centers[k]!);
    car.teleport(pose.position, { rotation: { x: -pose.pitch, y: pose.yaw } });
    consist.pitches[k] = pose.pitch;
  });
}

/** El riel con más efecto bajo el centro de cualquier vagón: boost gana sobre brake, y brake sobre normal. */
function strongestEffect(consist: Consist): RailEffect {
  const dimension = consist.cars[0]!.dimension;
  let effect: RailEffect = "normal";
  for (const c of consist.centers) {
    const here = railEffectAt(dimension, c.x, c.y, c.z);
    if (here === "boost") return "boost";
    if (here === "brake") effect = "brake";
  }
  return effect;
}

/** El conductor es el primer jugador montado en la cabeza (su asiento de la cabina). */
function driverOf(head: Entity): Player | undefined {
  const first = head.getComponent(EntityRideableComponent.componentId)?.getRiders()[0];
  return first instanceof Player && first.isValid ? first : undefined;
}

/** Vagones de otros trenes de la misma dimensión que podrían alcanzarse. */
function carPointsNear(consist: Consist): CarPoint<Consist>[] {
  const dimensionId = consist.cars[0]!.dimension.id;
  const origin = consist.points[0] ?? pointAt(consist.head);
  const reach = (consist.cars.length + MAX_CARS + 1) * CAR_SPACING;
  const result: CarPoint<Consist>[] = [];
  for (const other of consists.values()) {
    if (other === consist || other.cars[0]?.dimension.id !== dimensionId) continue;
    other.points.forEach((point, index) => {
      if (Math.abs(point.x - origin.x) <= reach && Math.abs(point.z - origin.z) <= reach) {
        result.push({ consist: other, index, count: other.cars.length, point });
      }
    });
  }
  return result;
}

// ---------- Enganchar y desenganchar ----------

/** Une `mine` con el tren del vagón tocado, si caben. El tren unido conserva el id de `mine`. */
function join(mine: Consist, hit: CarPoint<Consist>, direction: 1 | -1): void {
  const other = hit.consist;
  const joined = joinOrder(mine.cars, other.cars, hit.index, direction);
  if (!joined) return; // pasaría de 4 vagones: se quedan tocándose, cada uno por su lado
  const railAt = railAtFor(mine.cars[0]!.dimension);
  dropConsist(other);
  dropConsist(mine);
  const head = advance(railAt, mine.head, direction * joined.headShift).cursor;
  const consist = createConsist(joined.order, head, mine.id);
  refreshPoses(consist);
}

/** Desengancha el vagón de lo que tiene delante: el tren se parte en dos. */
function uncouple(car: Entity): void {
  const consist = carConsist.get(car.id);
  if (!consist || consist.cars.length < 2) return;
  const index = Math.max(1, consist.cars.indexOf(car));
  splitAround(consist, index, false);
}

/** Parte el tren antes del vagón `index` (y lo saca del tren si `remove`). */
function splitAround(consist: Consist, index: number, remove: boolean): void {
  const railAt = railAtFor(consist.cars[0]!.dimension);
  dropConsist(consist);
  const front = consist.cars.slice(0, index);
  const back = consist.cars.slice(remove ? index + 1 : index);
  const backHead = advance(railAt, consist.head, -(remove ? index + 1 : index) * CAR_SPACING).cursor;
  if (front.length > 0) {
    const a = createConsist(front, consist.head, consist.id);
    a.motion = consist.motion;
    refreshPoses(a);
  }
  if (back.length > 0) {
    const b = createConsist(back, backHead, newId(back[0]!));
    b.motion = consist.motion;
    refreshPoses(b);
  }
}

// ---------- Quitar a golpes ----------

function onHit(player: Player, entity: Entity): void {
  const rideable = entity.getComponent(EntityRideableComponent.componentId);
  // Un pasajero que golpea por dentro no quita el vagón.
  if (rideable?.getRiders().some((rider) => rider.id === player.id)) return;

  const key = `${player.id}|${entity.id}`;
  const now = system.currentTick;
  const previous = hits.get(key);
  const count = previous && now - previous.tick <= HIT_WINDOW_TICKS ? previous.count + 1 : 1;
  // Limpia golpes viejos para que el mapa no crezca.
  for (const [k, h] of hits) if (now - h.tick > HIT_WINDOW_TICKS) hits.delete(k);
  if (count < HITS_TO_REMOVE) {
    hits.set(key, { count, tick: now });
    return;
  }
  hits.delete(key);

  // Saca el vagón de su tren: los vagones de cada lado quedan como trenes separados.
  const consist = carConsist.get(entity.id);
  if (consist) splitAround(consist, consist.cars.indexOf(entity), true);
  carConsist.delete(entity.id);

  const { dimension, location } = entity;
  rideable?.ejectRiders();
  entity.remove();
  const mode = player.getGameMode();
  if (mode === GameMode.Creative || mode === GameMode.Spectator) return;
  const leftover = player.getComponent(EntityInventoryComponent.componentId)?.container.addItem(new ItemStack(METRO_CAR_ID));
  if (leftover) dimension.spawnItem(leftover, location);
}
