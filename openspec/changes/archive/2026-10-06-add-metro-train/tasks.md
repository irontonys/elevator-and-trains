# Tasks

## 1. Preparación

- [x] 1.1 Volver a correr `npm view @minecraft/server dist-tags` / `server-ui` y confirmar que `latest` sigue en 2.10.0 / 2.2.0; si cambió, actualizar ambos changes. Verificar: versiones anotadas en design.md.
- [x] 1.2 Confirmar en minecraft.wiki la tabla de `rail_direction` (0–9) de Bedrock y corregir design §1 si difiere. Verificar: tabla y enlace anotados en `.claude/context/decisiones.md`.

## 2. Lógica de la vía (pura)

- [x] 2.1 Escribir `src/train/track.ts` según design §1: geometría por bloque (recta, pendiente y curva), conexión con el vecino (misma Y, Y+1 o Y−1), cursor, `advance` y `pointAt`, recibiendo `railAt`. Verificar: `npm run typecheck` pasa.
- [x] 2.2 Escribir `src/train/bogies.ts` según design §2: bogies a ±2 del centro, posición, yaw y pitch, y avance limitado por el fin de la vía. Verificar: `npm run typecheck` pasa.
- [x] 2.3 Pruebas con mocks (`src/train/*.test.ts`): recta en N–S y E–O, cada curva 6–9, cada pendiente 2–5 de subida y de bajada, escalera diagonal de curvas (el yaw cambia como máximo 15° por cada 0.1 de avance), S de curvas, óvalo cerrado (da la vuelta completa y regresa al inicio), fin de vía en ambos sentidos, riel vecino que no conecta y bloque sin cargar. Verificar: `npm run test` pasa.

## 3. Entidad, item y recursos

- [x] 3.1 Escribir `tools/gen-metro.mjs` según design §7 (geometría con huesos `root`/`body`/`shell`/`cabin`/`seats`/`bogies`, textura con ventanas transparentes y `PALETTE` aislada, y vistas previas). Generar y versionar el `.geo.json` y el `.png`. Verificar: el geo es JSON válido con `visible_bounds` 8 × 4, la textura no tiene logos ni texto y las vistas previas se ven como un vagón de metro (revisarlas y mostrárselas a Daniel).
- [x] 3.2 Crear `packs/BP/entities/metro_car.json` según design §3 y comparar cada componente con las entidades de bedrock-samples 1.26.50 que tengan el mismo `format_version` o uno más nuevo. Verificar: JSON válido y todos los componentes y campos aparecen en vanilla.
- [x] 3.3 Crear la client entity, el render controller (referencia a `controller.render.default`), la animación del pitch y `packs/RP/textures/item_texture.json` con el ícono del item. Verificar: JSON válido e identificadores de geometría, textura y animación consistentes entre archivos.
- [x] 3.4 Crear `packs/BP/items/metro_car.json` (con el componente `eleytren:metro_spawner`, el ícono y `menu_category` `items`), la receta (design §5) y los textos `es_MX`/`en_US` del item y de la entidad. Verificar: JSON válido, formato igual al de un item vanilla 1.21.x con componentes y todas las claves de idioma presentes.

## 4. Script del tren

- [x] 4.1 Escribir `src/train/spawn.ts` (design §5) y registrar el custom component en `startup` desde `main.ts`. Verificar: `npm run typecheck` pasa.
- [x] 4.2 Escribir `src/train/config.ts` y `src/train/train.ts` (design §4): registro de vagones, tick de movimiento, conductor e input, física, ajuste a la vía al cargar y pitch. Arrancarlo en `worldLoad`. Verificar: `npm run typecheck` y `npm run build` pasan.
- [x] 4.3 Agregar la forma de quitarlo (design §6): 3 golpes en 40 ticks, expulsar a los jinetes, `remove` y devolver el item en supervivencia o aventura. Verificar: `npm run typecheck` pasa y `main.js` de release solo importa `@minecraft/server` / `@minecraft/server-ui`.
- [x] 4.4 Subir `package.json` a 0.2.0 y correr `npm run test`, `npm run build` y `npm run build:release`. Verificar: todo pasa y `unzip -l` del `.mcaddon` muestra la entidad, el item, la geometría y la textura.

## 5. Documentación y verificación en el iPad

- [x] 5.1 Actualizar `CLAUDE.md` (Estado y Estructura con `src/train/` y `tools/gen-metro.mjs`) y anotar en `decisiones.md` lo implementado (vía por geometría, bogies, física y quitar con golpes). Verificar: no quedan datos desactualizados en `CLAUDE.md`.
- [x] 5.2 Pedirle a Daniel que pruebe en el iPad, en un mundo sin experimentales: obtener y craftear el item, colocarlo sobre una vía recta y fallar fuera del riel o con vía corta, subir como conductor y como pasajeros (se ven por las ventanas), acelerar, frenar y reversa, curvas (de un riel y en escalera), pendientes (la carrocería se inclina), fin de vía, rieles propulsores sin efecto, bajarse en movimiento (el vagón frena), empujarlo (no se mueve), quitarlo con golpes (devuelve el item) y explosión cercana (no le pasa nada). El Content Log debe quedar sin errores ni warnings. Verificar: Daniel confirma cada punto.
- [x] 5.3 Pedirle a Daniel que quite el add-on de ese mundo y lo vuelva a abrir. Verificar: carga sin errores, no hay vagones y los rieles siguen en su lugar.
