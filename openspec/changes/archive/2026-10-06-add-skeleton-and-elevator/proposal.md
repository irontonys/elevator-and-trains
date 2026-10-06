# Proposal

## Why

El proyecto todavía no tiene código: no hay Behavior Pack, Resource Pack, `package.json` ni build. Este
primer change crea la base (que compile, que se empaquete como `.mcaddon` para mandarlo al iPad y que
cargue en la última versión estable de Bedrock) y entrega la primera feature jugable, el elevador. Así
el primer `.mcaddon` ya sirve para probar algo real. El tren de metro queda para un change aparte
porque es la parte técnicamente más riesgosa (un modelo grande siguiendo rieles vanilla).

## What Changes

- Se agregan un Behavior Pack y un Resource Pack propios (`elevadores-trenes BP` / `RP`), cada uno con
  su manifest, UUIDs nuevos y permanentes, y dependencia mutua. Apuntan a la versión estable 1.26.50
  (`@minecraft/server` 2.10.0, `@minecraft/server-ui` 2.2.0).
- Se agrega el proyecto TypeScript (`package.json`, `tsconfig.json`) con un build de esbuild que genera
  un solo `scripts/main.js` dentro del BP y empaqueta ambos packs en `dist/elevadores-trenes.mcaddon`.
  La versión se toma de `package.json`. Sigue el mismo patrón que `../civiles`.
- Se agrega un arranque mínimo con el ciclo de vida de Scripting V2. En el build de desarrollo avisa
  en el chat que el add-on cargó; en release no manda nada.
- Se agrega el bloque `eleytren:elevator_block` (con textura, nombre en `es_MX`/`en_US` y receta de
  crafteo). Dos de estos bloques en la misma columna marcan un elevador: el de abajo es el inicio y el
  de arriba es el límite.
- **Elevador:** si el jugador está parado en un piso dentro de un elevador:
  - **Saltar** lo sube al siguiente piso, uno por salto, hasta el piso del bloque límite.
  - **Agacharse** lo baja al piso anterior, uno por cada vez que se agacha, hasta el bloque de inicio.
  - Los pisos se detectan por el suelo real que hay en esa columna, no por una altura fija.
- Todavía no hay trenes ni UI.

## Capabilities

### New Capabilities
- `addon-packaging`: estructura de los packs, manifests (versiones, UUIDs y dependencias) y el build
  que produce el `.mcaddon` instalable.
- `script-bootstrap`: punto de entrada del script, ciclo de vida de arranque y aviso de carga solo en
  desarrollo.
- `elevator`: bloque de elevador, cómo se define un elevador con dos bloques, detección de pisos y
  movimiento entre pisos al saltar o agacharse.

### Modified Capabilities
<!-- Ninguna: no hay specs existentes. -->

## Impact

- Archivos nuevos: `package.json`, `package-lock.json`, `tsconfig.json`, `src/`, `packs/BP/`,
  `packs/RP/`, `tools/build.mjs` y cambios en `.gitignore` (`node_modules/`, `dist/`).
- Dependencias: `@minecraft/server@2.10.0` y `@minecraft/server-ui@2.2.0` (exactas, tag `latest`); en
  desarrollo: `typescript`, `esbuild` y `fflate`.
- `CLAUDE.md`: se llenan "Estructura" y "Cómo correrlo" y se resuelven sus TODO.
- No se toca nada vanilla. Al quitar el add-on, los bloques de elevador que el jugador haya colocado
  quedan como "bloque desconocido". Es inevitable en cualquier bloque custom y es parte de lo que se
  pidió. El add-on no cambia ningún otro bloque ni deja scoreboards.
