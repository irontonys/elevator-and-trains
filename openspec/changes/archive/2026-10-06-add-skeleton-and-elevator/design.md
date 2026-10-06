# Design

## Context

El repo solo tiene `CLAUDE.md`, `.claude/` y `openspec/`. No hay código ni `package.json`. La
motivación está en proposal.md (Why) y los requisitos en los specs `addon-packaging`,
`script-bootstrap` y `elevator`.

`../civiles` ya validó en el iPad el mismo stack: estructura `packs/` + `src/` → `dist/`, build con
esbuild + fflate, versión única en `package.json` y manifest `format_version: 2`. Aquí se copia ese
patrón y se adapta. Es una decisión del proyecto (`decisiones.md`, 2026-10-06); el código no se
comparte entre proyectos.

Versiones al 2026-10-06 (`npm view ... dist-tags`):

| Paquete | `latest` | Siguiente (no se usa) |
|---|---|---|
| `@minecraft/server` | 2.10.0 | 2.11.0-rc / 2.12.0-beta (1.26.60-preview) |
| `@minecraft/server-ui` | 2.2.0 | 2.3.0-rc / 2.4.0-beta |

El preview ya va en 1.26.60, así que la línea estable es **1.26.50**: `min_engine_version = [1, 26, 50]`.

Lo que se revisó en los tipos de `@minecraft/server` 2.10.0 (estable) para el elevador:
- Sí existen: `world.afterEvents.playerButtonInput`, con filtro `InputEventOptions { buttons, state }`
  y los enums `InputButton.Jump` / `InputButton.Sneak` y `ButtonState.Pressed`. También
  `Block.isAir`, `Block.isLiquid`, `Entity.isOnGround`, `isInWater`, `isSwimming`, `isClimbing`,
  `Player.isFlying`, `isGliding`, `Player.playSound` y `Dimension.heightRange`.
- No existe en estable: `Block.isSolid`.

## Goals / Non-Goals

**Goals:**
- Que `npm run build` deje un `.mcaddon` instalable con un solo comando.
- Que el elevador reaccione en el mismo tick que el botón, sin polling por jugador en cada tick.
- Que la lógica de pisos se pueda probar en la Mac sin el juego.

**Non-Goals:**
- Trenes (siguiente change).
- Animación de cabina, puertas o subida suave. El movimiento es un teleport instantáneo.
- Elegir un piso de destino con un menú (`server-ui`). Se puede agregar después.
- Linter, CI o deploy automático a `com.mojang`.

## Decisions

### 1. Estructura y build: igual que civiles
```
packs/BP/manifest.json, texts/, blocks/elevator_block.json, recipes/elevator_block.json
packs/RP/manifest.json, texts/, textures/terrain_texture.json, textures/blocks/eleytren_elevator_block.png
src/main.ts, src/globals.d.ts, src/elevator/{floors.ts,elevator.ts}
tools/build.mjs
dist/eleytren_BP/, dist/eleytren_RP/, dist/elevadores-trenes.mcaddon   (ignorado en git)
```
El build hace typecheck → copia `packs/*` → estampa la versión de `package.json` en el header, los
módulos y las dependencias BP↔RP → bundle de esbuild (`external @minecraft/*`, `define __DEV__` /
`__VERSION__`, `minify` solo en release) → zip con fflate a un temporal que se renombra al final.
Si el typecheck o esbuild fallan, el build sale con código ≠ 0 y no deja un `.mcaddon` a medias.
- *Descartado:* compilar dentro de `packs/`, Regolith y el `zip` de macOS (mismas razones que en civiles).
- Se generan 5 UUIDs una sola vez (header BP, `data` y `script` del BP, header RP, `resources` del RP)
  y se escriben literal en `packs/*/manifest.json`. El build nunca los toca.
- Manifest `format_version: 2`. Al implementar se vuelve a revisar en Microsoft Learn si la v3 sigue en
  preview. Las dependencias de script se declaran como string `"2.10.0"`.

### 2. Bloque `eleytren:elevator_block`
- `format_version` del bloque: 1.26.50. Lleva `minecraft:geometry.full_block` (en civiles se aprendió
  que `material_instances` sin `geometry` falla), `material_instances` con la textura
  `eleytren_elevator_block`, `destructible_by_mining`, `destructible_by_explosion`, `map_color` y
  `menu_category: construction`.
- **Sin custom component ni `tick`:** el bloque es solo un marcador. Toda la lógica vive en el evento
  de input del jugador, así que no hay costo por bloque colocado.
- Textura: un PNG de 16×16 hecho a mano (metálico, con flechas arriba/abajo), generado una vez y
  versionado en `packs/RP`.
- **Receta (supuesto, se puede cambiar):** crafteo con forma, 8 lingotes de hierro alrededor de 1
  polvo de redstone, que da 2 bloques (siempre se usan en par). Se desbloquea al tener un lingote de
  hierro. El formato de la receta se copia de un archivo de bedrock-samples 1.26.50.

### 3. Entrada: `playerButtonInput` filtrado
```ts
world.afterEvents.playerButtonInput.subscribe(onInput, {
  buttons: [InputButton.Jump, InputButton.Sneak],
  state: ButtonState.Pressed,
});
```
El evento solo se dispara cuando el botón **cambia** a presionado. Con eso, mantener el salto o
quedarse agachado no repite el movimiento.
- Además hay un cooldown en memoria por jugador (`Map<playerId, tick>`, ~8 ticks). Así, un salto justo
  después de llegar al piso no encadena otro movimiento por un rebote de input, y en touch el
  sneak/salto no se duplica. Se limpia en `playerLeave`.
- *Alternativa descartada:* hacer polling de `isJumping`/`isSneaking` cada tick para cada jugador.
  Gasta más y exige detectar el flanco a mano.

### 4. Detección de pisos (`src/elevator/floors.ts`, sin importar `@minecraft/server`)
La lógica pura recibe una función `kindAt(y): "air" | "liquid" | "elevator" | "other"` de la columna,
más los límites de altura de la dimensión. Así se prueba con mocks en la Mac.
- **Piso:** `kindAt(y)` es `elevator` u `other`, y `kindAt(y+1)` y `kindAt(y+2)` son `air`.
- **Subir desde el piso `f`:** se busca hacia arriba el primer bloque `elevator` con `y > f` (el
  límite del tramo). Si no hay, no se mueve. Si hay, el destino es el primer piso con `f < y ≤ límite`.
- **Bajar desde `f`:** simétrico hacia abajo. El tope es el primer `elevator` con `y < f`. El destino
  es el primer piso con `inicio ≤ y < f`, buscando hacia abajo.
- **Requisito de estar dentro:** para subir también tiene que haber un `elevator` en `y ≤ f` (el
  inicio, que puede ser el mismo `f`). Para bajar tiene que haber uno en `y ≥ f`. Con esta regla, un
  bloque suelto no hace nada y una columna de 3 o más bloques encadena tramos sola, porque el bloque
  intermedio es a la vez límite de uno e inicio del otro.
- **Alcance:** toda la altura de la dimensión (`heightRange`). Son cientos de `getBlock` como máximo y
  solo cuando alguien presiona un botón. La columna siempre está cargada porque el jugador está en ella.
- **"Sólido" sin `isSolid`:** un bloque cuenta como piso si no es aire ni líquido. Para el espacio de
  la cabeza se exige aire estricto, no "no sólido". Esto evita meter al jugador en un bloque.
  *Supuesto aceptado:* una antorcha, una alfombra o un cartel en la columna puede contar como piso, o
  tapar un piso. Se documenta en la descripción del add-on.

### 5. Movimiento (`src/elevator/elevator.ts`)
- **Piso actual:** el bloque bajo los pies del jugador (`floor(y - 0.01)`, en su X/Z). En el salto el
  evento puede llegar cuando el jugador ya despegó, así que se acepta si está a menos de 1.25 bloques
  sobre el tope de un bloque no-aire de su columna. No se usa `isOnGround` para el salto. Para el
  sneak sí se exige `isOnGround`.
- No se activa si el jugador está `isFlying`, `isGliding`, `isSwimming`, `isInWater` o `isClimbing`.
- Teleport a `{x: bx + 0.5, y: destino + 1, z: bz + 0.5}`, conservando la rotación
  (`keepVelocity: false`, sin `facingLocation`). Se ejecuta directo en el after event; no hace falta
  `system.run` porque los after events ya permiten escribir.
- Sonido vanilla para el jugador (`random.orb` o similar, que solo se reproduce; no se sobrescribe).
  Se elige al implementar un id que exista en `sound_definitions` de 1.26.50.

### 6. Indicador de piso (`src/elevator/indicator.ts`)
- **Numeración:** `elevatorFloors(column, current)` (puro, en `floors.ts`) regresa los pisos de toda la
  cadena de la columna, desde el bloque de elevador más bajo hasta el más alto. El índice 0 es "PB" y
  los demás son 1..n. Solo se calcula al moverse (una lectura de la columna por cada movimiento).
- **Al llegar:** `onScreenDisplay.setTitle` con `RawMessage` traducible (`eleytren.elevator.*`) y fades
  cortos (~1 s visible).
- **Action bar mientras sigue en el piso:** un `Map<playerId, {x, z, floorY, texto}>` de jugadores
  activos. Un `system.runInterval` de 10 ticks existe **solo mientras el mapa no está vacío**: se crea
  con el primer jugador activo y se cancela (`clearRun`) cuando se vacía. Cada vuelta solo compara la
  posición del jugador (misma X/Z de bloque y pies a menos de 1.5 del piso). Si sigue ahí, refresca la
  action bar; si no, lo saca del mapa. No lee bloques. También se saca en `playerLeave`.
- Los textos van en `texts/*.lang` del RP; el cliente los resuelve en su idioma.
- *Descartado:* revisar a todos los jugadores cada tick para mostrar el piso apenas pisan la columna
  (cuesta aunque nadie use el elevador). También un display físico por piso (texto flotante o un
  letrero que cambia): deja entidades o modifica bloques, y rompe la regla de desinstalación.
- *Supuesto aceptado:* al pararse en el elevador sin haberlo usado todavía, no se muestra el piso hasta
  el primer movimiento.

### 7. Arranque (`src/main.ts`)
Igual que civiles: `system.beforeEvents.startup` (vacío, comentado) y `world.afterEvents.worldLoad`,
donde se suscribe el elevador y, solo en `__DEV__`, se manda el mensaje con la versión.

## Risks / Trade-offs

- [El salto vanilla empieza antes del teleport] → El teleport lo cancela (`keepVelocity: false`). Si en
  el iPad se ve un brinquito, se acepta; no hay forma estable de cancelar el salto.
- [Agacharse en touch también se usa para no caerse de las orillas] → Solo se activa si el bloque bajo
  los pies es piso de un elevador, o sea, sobre la columna. Fuera de ella el sneak es normal.
- [Decoraciones contando como piso, ver §4] → Riesgo aceptado y documentado. Si molesta, un change
  futuro puede usar una lista de bloques permitidos.
- [Que 2.10.0 no corresponda exactamente a 1.26.50] → Mismo riesgo que en civiles, donde ya se
  comprobó en el iPad. Si el Content Log marca un error de versión, se ajusta y se anota.
- [Bloques desconocidos al desinstalar] → Inherente a un bloque custom, ya señalado en proposal.md.
- [Sin juego en la Mac] → La lógica de pisos se prueba con mocks. El resto lo valida Daniel en el iPad
  con una checklist.

## Migration Plan

No aplica: no hay versión publicada. Los UUIDs que se generen aquí son los definitivos.
