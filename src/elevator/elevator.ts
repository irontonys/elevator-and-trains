// Elevador: saltar sube un piso y agacharse baja un piso dentro de una columna con bloques de elevador.
import { ButtonState, Dimension, InputButton, Player, PlayerButtonInputAfterEvent, system, world } from "@minecraft/server";
import { elevatorFloors, isPassable, nextFloorDown, nextFloorUp, type BlockKind, type Column } from "./floors";
import { setupIndicator, showFloor } from "./indicator";

const ELEVATOR_BLOCK = "eleytren:elevator_block";
/** Ticks mínimos entre dos movimientos del mismo jugador (evita rebotes del input en touch). */
const COOLDOWN_TICKS = 8;
/** Al saltar, el evento puede llegar cuando el jugador ya despegó: se acepta hasta esta altura sobre el suelo. */
const JUMP_TOLERANCE = 1.25;
/** Al agacharse, el jugador está en el suelo: solo se tolera el error de redondeo. */
const SNEAK_TOLERANCE = 0.1;
const MOVE_SOUND = "random.orb";

/** Último tick en que se movió cada jugador. Solo vive en memoria; no se guarda en el mundo. */
const lastMoveTick = new Map<string, number>();

export function setupElevator(): void {
  world.afterEvents.playerButtonInput.subscribe(onButtonInput, {
    buttons: [InputButton.Jump, InputButton.Sneak],
    state: ButtonState.Pressed,
  });
  world.afterEvents.playerLeave.subscribe(({ playerId }) => lastMoveTick.delete(playerId));
  setupIndicator();
}

function onButtonInput({ player, button }: PlayerButtonInputAfterEvent): void {
  if (!player.isValid) return;
  const last = lastMoveTick.get(player.id);
  if (last !== undefined && system.currentTick - last < COOLDOWN_TICKS) return;
  if (player.isFlying || player.isGliding || player.isSwimming || player.isInWater || player.isClimbing) return;

  const up = button === InputButton.Jump;
  if (!up && !player.isOnGround) return;

  const { x, y, z } = player.location;
  const bx = Math.floor(x);
  const bz = Math.floor(z);
  const column = columnAt(player.dimension, bx, bz);
  const current = floorUnder(column, y, up ? JUMP_TOLERANCE : SNEAK_TOLERANCE);
  if (current === undefined) return;

  const target = up ? nextFloorUp(column, current) : nextFloorDown(column, current);
  if (target === undefined) return;

  moveTo(player, bx, target, bz);
  lastMoveTick.set(player.id, system.currentTick);

  const floors = elevatorFloors(column, target);
  if (floors) showFloor(player, bx, bz, target, floors.indexOf(target), floors.length - 1);
}

/** Vista de la columna X/Z para la lógica de pisos. */
function columnAt(dimension: Dimension, x: number, z: number): Column {
  const { min, max } = dimension.heightRange;
  return {
    minY: min,
    maxY: max,
    kindAt(y: number): BlockKind {
      let block;
      try {
        block = dimension.getBlock({ x, y, z });
      } catch {
        block = undefined;
      }
      // Sin bloque (no cargado o fuera del mundo) se trata como sólido: nunca deja espacio para la cabeza.
      if (!block) return "other";
      if (block.typeId === ELEVATOR_BLOCK) return "elevator";
      if (block.isAir || isPassable(block.typeId)) return "air";
      if (block.isLiquid) return "liquid";
      return "other";
    },
  };
}

/** Bloque sobre el que está parado el jugador (o del que acaba de despegar), si no es aire ni líquido. */
function floorUnder(column: Column, feetY: number, tolerance: number): number | undefined {
  for (let y = Math.floor(feetY - 0.01); y >= column.minY && feetY - (y + 1) < tolerance; y--) {
    const kind = column.kindAt(y);
    if (kind === "air") continue;
    return kind === "liquid" ? undefined : y;
  }
  return undefined;
}

function moveTo(player: Player, x: number, floorY: number, z: number): void {
  // Sin `rotation`: el jugador sigue mirando hacia donde miraba.
  player.teleport({ x: x + 0.5, y: floorY + 1, z: z + 0.5 }, { keepVelocity: false });
  player.playSound(MOVE_SOUND, { volume: 0.6 });
}
