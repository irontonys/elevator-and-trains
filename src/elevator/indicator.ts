// Indicador de piso: action bar al llegar y mientras el jugador sigue en ese piso (sin título: tapaba la vista).
// Solo UI temporal del cliente: no se guarda nada en el mundo.
import { Player, RawMessage, system, world } from "@minecraft/server";

/** Cada cuánto se refresca la action bar de los jugadores activos (la action bar dura ~3 s). */
const REFRESH_TICKS = 10;
/** Distancia máxima de los pies al piso para seguir "en el piso". */
const MAX_FEET_DISTANCE = 1.5;

interface ActiveFloor {
  player: Player;
  x: number;
  z: number;
  floorY: number;
  bar: RawMessage;
}

/** Jugadores que llegaron a un piso y siguen ahí. Vacío = no hay ningún intervalo corriendo. */
const active = new Map<string, ActiveFloor>();
let intervalId: number | undefined;

export function setupIndicator(): void {
  world.afterEvents.playerLeave.subscribe(({ playerId }) => deactivate(playerId));
}

/** Muestra el piso al que llegó el jugador. `index` 0 es la planta baja (PB) y `top` es el último (PH). */
export function showFloor(player: Player, x: number, z: number, floorY: number, index: number, top: number): void {
  const total = String(top);
  const bar: RawMessage =
    index === 0
      ? { translate: "eleytren.elevator.bar_ground", with: [total] }
      : index === top
        ? { translate: "eleytren.elevator.bar_top", with: [total] }
        : { translate: "eleytren.elevator.bar", with: [String(index), total] };
  player.onScreenDisplay.setActionBar(bar);
  active.set(player.id, { player, x, z, floorY, bar });
  intervalId ??= system.runInterval(refresh, REFRESH_TICKS);
}

/** Refresca la action bar de quien sigue en su piso y suelta a los demás. Solo compara posiciones. */
function refresh(): void {
  for (const [id, entry] of active) {
    const { player } = entry;
    if (!player.isValid) {
      deactivate(id);
      continue;
    }
    const { x, y, z } = player.location;
    const onFloor = Math.floor(x) === entry.x && Math.floor(z) === entry.z && Math.abs(y - (entry.floorY + 1)) < MAX_FEET_DISTANCE;
    if (onFloor) {
      player.onScreenDisplay.setActionBar(entry.bar);
    } else {
      // Borra la action bar ya, en lugar de esperar a que se desvanezca sola (~3 s).
      player.onScreenDisplay.setActionBar("");
      deactivate(id);
    }
  }
}

function deactivate(playerId: string): void {
  active.delete(playerId);
  if (active.size === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}
