// Punto de entrada del add-on. Ciclo de vida de Scripting V2: registro → mundo cargado.
import { system, world } from "@minecraft/server";
import { setupElevator } from "./elevator/elevator";
import { registerSpawner, setupSpawner } from "./train/spawn";
import { setupTrains } from "./train/train";

// Fase de registro: corre antes de que exista el mundo. Aquí van los custom components
// (blockComponentRegistry / itemComponentRegistry). No se puede leer ni escribir el mundo.
system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
  registerSpawner(itemComponentRegistry);
});

// Fase de mundo: el mundo ya cargó y se puede leer y escribir.
world.afterEvents.worldLoad.subscribe(() => {
  setupElevator();
  setupSpawner();
  setupTrains();
  if (__DEV__) world.sendMessage(`§a[Elevadores y Trenes]§r v${__VERSION__} cargado (dev)`);
});
