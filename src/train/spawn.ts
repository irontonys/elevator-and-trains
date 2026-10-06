// Item del vagón: al usarlo sobre un riel vanilla aparece un vagón alineado con la vía.
import { EntityInventoryComponent, GameMode, ItemComponentRegistry, ItemComponentUseOnEvent, Player, system, world } from "@minecraft/server";
import { fits, poseOf } from "./bogies";
import { METRO_CAR_ID, METRO_SPAWNER_COMPONENT, SPAWN_COOLDOWN_TICKS } from "./config";
import { railAtFor } from "./rails";
import { cursorAt, headingOf, reverse } from "./track";
import { placeCar } from "./train";

const lastUseTick = new Map<string, number>();

/** Fase de registro: el custom component del item. */
export function registerSpawner(registry: ItemComponentRegistry): void {
  registry.registerCustomComponent(METRO_SPAWNER_COMPONENT, { onUseOn });
}

/** Fase de mundo: limpia el cooldown de quien sale. */
export function setupSpawner(): void {
  world.afterEvents.playerLeave.subscribe(({ playerId }) => lastUseTick.delete(playerId));
}

function onUseOn({ source, block }: ItemComponentUseOnEvent): void {
  if (!(source instanceof Player)) return;
  const player = source;
  const last = lastUseTick.get(player.id);
  if (last !== undefined && system.currentTick - last < SPAWN_COOLDOWN_TICKS) return;

  const railAt = railAtFor(block.dimension);
  let center = cursorAt(railAt, block.x, block.y, block.z);
  if (!center) return; // no es un riel: no aparece nada y no se gasta el item
  lastUseTick.set(player.id, system.currentTick);

  // El frente del vagón ve hacia el sentido de la vía más parecido a donde mira el jugador.
  const view = player.getViewDirection();
  const heading = headingOf(center);
  if (heading.x * view.x + heading.z * view.z < 0) center = reverse(center);

  if (!fits(railAt, center)) {
    player.onScreenDisplay.setActionBar({ translate: "eleytren.train.no_track" });
    return;
  }

  // Los callbacks de custom components pueden correr en modo de solo lectura: se escribe en el siguiente tick.
  const placed = center;
  system.run(() => {
    if (!player.isValid) return;
    const { position, yaw } = poseOf(railAt, placed);
    const entity = block.dimension.spawnEntity(METRO_CAR_ID, position, { initialRotation: yaw });
    placeCar(entity, placed);
    if (player.getGameMode() !== GameMode.Creative) consumeSelected(player);
  });
}

function consumeSelected(player: Player): void {
  const container = player.getComponent(EntityInventoryComponent.componentId)?.container;
  if (!container) return;
  const item = container.getItem(player.selectedSlotIndex);
  if (!item) return;
  if (item.amount > 1) {
    item.amount -= 1;
    container.setItem(player.selectedSlotIndex, item);
  } else {
    container.setItem(player.selectedSlotIndex, undefined);
  }
}
