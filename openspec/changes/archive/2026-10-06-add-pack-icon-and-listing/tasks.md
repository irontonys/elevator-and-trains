# Tasks

## 1. Arte

- [x] 1.1 Escribir `tools/gen-art.mjs`: render isométrico del modelo y las texturas de `packs/RP`, con escenario procedural. Salida: `packs/BP/pack_icon.png`, `packs/RP/pack_icon.png` (256 × 256), `publish/avatar.png` (400 × 400) y `publish/cover.png` (1280 × 720). Verificar: `node tools/gen-art.mjs` corre sin errores y las imágenes se ven bien.

## 2. Packs

- [x] 2.1 Cambiar `pack.name` a "Elevator & Trains (BP|RP)" en los `.lang` de los dos packs. Verificar: `grep pack.name packs/*/texts/*.lang`.
- [x] 2.2 Subir a 0.3.1 y correr `npm run test`, `npm run build` y `npm run build:release`. Verificar: el `.mcaddon` contiene `pack_icon.png` en la raíz de cada pack.

## 3. Publicación

- [x] 3.1 Escribir `publish/listing.md`: nombre, resumen, descripción (inglés primero y luego español, sin mencionar ciudades ni marcas), instalación, recetas y pasos para subirlo por CurseForge. Verificar: cumple las reglas de moderación de CurseForge y MCPEDL.
- [x] 3.2 Actualizar `CLAUDE.md` (estructura: `gen-art.mjs`, `publish/`). Verificar: sin datos desactualizados.

## 4. iPad

- [x] 4.1 Pedirle a Daniel que importe el `.mcaddon`: los packs muestran el ícono y el nombre nuevo, y el Content Log queda limpio. Verificar: Daniel lo confirma.
