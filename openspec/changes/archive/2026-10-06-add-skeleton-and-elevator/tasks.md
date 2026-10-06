# Tasks

## 1. Proyecto Node/TypeScript

- [x] 1.1 Volver a correr `npm view @minecraft/server dist-tags` y `npm view @minecraft/server-ui dist-tags`, y confirmar que `latest` sigue en 2.10.0 / 2.2.0. Si cambió, actualizar design.md y usar las nuevas. Verificar: versiones anotadas en design.md.
- [x] 1.2 Crear `package.json` (`name: elevadores-trenes`, `version: 0.1.0`, `private: true`, `type: module`) con scripts `typecheck`, `test`, `build` y `build:release`. Instalar `@minecraft/server@2.10.0` y `@minecraft/server-ui@2.2.0` con `--save-exact`, y `typescript`, `esbuild` y `fflate` como devDependencies. Verificar: `npm ls` sin errores.
- [x] 1.3 Crear `tsconfig.json` estricto (igual que civiles: ES2022, `moduleResolution: bundler`, `noEmit`, `include: ["src"]`) y `src/globals.d.ts` con `__DEV__`, `__VERSION__` y `console`. Verificar: `npm run typecheck` pasa.
- [x] 1.4 Agregar `node_modules/` y `dist/` a `.gitignore`. Verificar: `git status` no lista esas carpetas después del build.

## 2. Packs y manifests

- [x] 2.1 Revisar en Microsoft Learn si el manifest `format_version: 3` sigue en preview y confirmar la 2. Verificar: decisión y enlace anotados en `.claude/context/decisiones.md`.
- [x] 2.2 Generar 5 UUIDs v4 una sola vez y crear `packs/BP/manifest.json` (módulos `data` + `script` con entrada `scripts/main.js`, dependencias `@minecraft/server`, `@minecraft/server-ui` y el RP) y `packs/RP/manifest.json` (módulo `resources`, dependencia del BP), con `min_engine_version` [1, 26, 50] y `pack.name` / `pack.description`. Verificar: ambos son JSON válidos y los UUIDs cruzados coinciden.
- [x] 2.3 Crear `texts/languages.json`, `en_US.lang` y `es_MX.lang` en ambos packs con `pack.name` y `pack.description`, y en el RP también `tile.eleytren:elevator_block.name`. Verificar: cada `.lang` tiene todas las claves y `languages.json` lista los dos idiomas.

## 3. Script de arranque

- [x] 3.1 Escribir `src/main.ts` con la fase de registro (`system.beforeEvents.startup`, vacía y comentada) y la fase de mundo (`world.afterEvents.worldLoad`), que en `__DEV__` manda `world.sendMessage` con nombre y `__VERSION__`. Verificar: `npm run typecheck` pasa y nada toca `world` fuera de `worldLoad`.

## 4. Build y empaquetado

- [x] 4.1 Escribir `tools/build.mjs` siguiendo design §1: typecheck (sale ≠ 0 si falla), copiar `packs/*` a `dist/eleytren_BP` y `dist/eleytren_RP` sin `.DS_Store`, estampar la versión y bundlear con esbuild a `dist/eleytren_BP/scripts/main.js`. Verificar: `npm run build` deja ambos packs en `dist/` con `main.js`.
- [x] 4.2 Agregar el zip con fflate a un temporal y renombrarlo a `dist/elevadores-trenes.mcaddon`. Verificar: `unzip -l` muestra `eleytren_BP/manifest.json`, `eleytren_BP/scripts/main.js` y `eleytren_RP/manifest.json`.
- [x] 4.3 Probar los casos borde del build: (a) con un error de tipos temporal, el build sale ≠ 0 y no genera `.mcaddon`; (b) con la versión en 0.2.0, los manifests generados dicen [0, 2, 0] en header y dependencias, con los mismos UUIDs; (c) con `npm run build:release`, `grep` confirma que `main.js` no contiene el texto del aviso. Revertir los cambios temporales.

## 5. Bloque de elevador

- [x] 5.1 Crear `packs/BP/blocks/elevator_block.json` según design §2 (`format_version` 1.26.50, geometry full_block, material_instances, destructible, map_color y menu_category construction). Antes de entregar, comparar cada componente contra los bloques de bedrock-samples 1.26.50. Verificar: JSON válido y todos los componentes aparecen en samples con ese formato o uno más nuevo.
- [x] 5.2 Crear la textura 16×16 `packs/RP/textures/blocks/eleytren_elevator_block.png` y `packs/RP/textures/terrain_texture.json` con la clave `eleytren_elevator_block`. Verificar: el PNG abre, mide 16×16 y la clave coincide con `material_instances`.
- [x] 5.3 Crear `packs/BP/recipes/elevator_block.json` (receta con forma: 8 lingotes de hierro + 1 redstone → 2 bloques, que se desbloquea con un lingote de hierro), copiando el formato de una receta de bedrock-samples 1.26.50. Verificar: JSON válido y mismo `format_version`/estructura que la receta de referencia.

## 6. Lógica del elevador

- [x] 6.1 Escribir `src/elevator/floors.ts` (sin importar `@minecraft/server`) con `isFloor`, `nextFloorUp` y `nextFloorDown` según design §4, recibiendo `kindAt(y)` y el rango de altura. Verificar: `npm run typecheck` pasa.
- [x] 6.2 Agregar pruebas con mocks de columna (`npm run test`: esbuild bundlea `src/**/*.test.ts` y corre `node --test`) que cubran todos los escenarios del spec `elevator`: dos bloques, bloque suelto, tres bloques encadenados, pisos irregulares (64/69/81/90), suelo sin espacio para la cabeza, ya en el límite, ya en el inicio, límite sin espacio para la cabeza y los bordes de `heightRange`. Verificar: `npm run test` pasa.
- [x] 6.3 Escribir `src/elevator/elevator.ts` según design §3 y §5: suscripción filtrada a `playerButtonInput`, cooldown por jugador limpiado en `playerLeave`, detección del piso actual (tolerancia de 1.25 en el salto, `isOnGround` en el sneak), exclusiones (volar, planear, nadar, agua, escalar), teleport centrado conservando la rotación y sonido vanilla (id verificado en `sound_definitions` 1.26.50). Engancharlo desde `worldLoad` en `main.ts`. Verificar: `npm run typecheck` y `npm run build` pasan, y el `main.js` de release no importa nada fuera de `@minecraft/server` / `@minecraft/server-ui`.

- [x] 6.4 Agregar `elevatorFloors` a `floors.ts` (design §6) con pruebas: PB en el bloque más bajo, numeración a través de 3+ bloques encadenados, pisos irregulares y jugador fuera de la cadena. Verificar: `npm run test` pasa.
- [x] 6.5 Escribir `src/elevator/indicator.ts` (design §6): título al llegar, action bar mientras sigue en el piso, intervalo que solo existe con jugadores activos y limpieza en `playerLeave`. Agregar las claves `eleytren.elevator.*` en `es_MX`/`en_US` del RP. Verificar: `npm run typecheck` y `npm run build` pasan y el intervalo solo se crea con jugadores activos.

## 7. Documentación y verificación en el iPad

- [x] 7.1 Actualizar `CLAUDE.md` (Estructura, Cómo correrlo, Estado y quitar los TODO resueltos) y anotar en `decisiones.md` la estructura, el input por `playerButtonInput`, la regla de piso sin `isSolid` y la receta. Verificar: no queda ningún TODO que este change haya resuelto.
- [x] 7.2 Generar el `.mcaddon` de desarrollo y pedirle a Daniel que lo pruebe en el iPad, en un mundo sin experimentales: importar, activar solo el BP (el RP debe agregarse solo), ver nombres en español, el mensaje con la versión, el bloque en creativo, craftearlo en supervivencia, armar un elevador de 3+ pisos irregulares, subir un piso por salto, bajar un piso al agacharse, mantener presionados ambos botones (un solo piso), tope en límite e inicio, bloque suelto sin efecto, indicador de piso (título al llegar con PB/1/2…, action bar mientras sigues en el piso que desaparece al salir), y `/reload` y el Content Log sin errores ni warnings. Verificar: Daniel confirma cada punto.
- [x] 7.3 Pedirle a Daniel que quite ambos packs de ese mundo y lo vuelva a abrir. Verificar: carga sin errores, `/scoreboard objectives list` no muestra nada del add-on y solo quedan como bloque desconocido los bloques de elevador que se colocaron.
