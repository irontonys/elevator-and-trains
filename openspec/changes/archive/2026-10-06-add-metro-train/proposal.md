# Proposal

## Why

El add-on es para construir un metro, y Bedrock solo tiene el carrito vanilla: es de un bloque, no
lleva pasajeros adentro y no parece un metro. Este change agrega un vagón de metro grande, manejado por
un jugador, que corre sobre los rieles vanilla que ya existen en el mundo. Depende del esqueleto del
change `add-skeleton-and-elevator` (packs, build y arranque).

## What Changes

- Se agrega la entidad `eleytren:metro_car`: un solo vagón de metro de ~6 bloques de largo, con el
  estilo de Metrorrey (colores, ventanas corridas, puertas y cabina), **sin logos ni marcas
  oficiales**. Lleva un asiento de conductor en la cabina y asientos de pasajeros adentro, visibles
  por las ventanas.
- Se agrega el item `eleytren:metro_car` (en creativo y con receta). Al usarlo sobre un riel vanilla,
  el vagón aparece alineado con la vía.
- **Movimiento:** el vagón sigue el trazo de cualquier riel vanilla (normal, propulsor, detector y
  activador, todos iguales), incluidas curvas y pendientes. Los dos extremos del vagón siguen la vía
  por separado, así que en las curvas gira como un vagón de verdad.
- **Manejo:** el jugador del asiento de conductor acelera con "adelante", frena y da reversa con
  "atrás". Sin conductor, el vagón frena hasta detenerse. Al final de la vía se detiene.
- **Quitarlo:** un jugador lo golpea varias veces seguidas. En supervivencia regresa el item.
- No se colocan, quitan ni cambian rieles ni ningún otro bloque.

## Capabilities

### New Capabilities
- `metro-train`: el vagón de metro (apariencia, asientos), cómo aparece y se quita, cómo sigue los
  rieles vanilla y cómo lo maneja el conductor.

### Modified Capabilities
<!-- Ninguna. `addon-packaging` y `script-bootstrap` no cambian de requisitos. -->

## Impact

- Archivos nuevos en `packs/BP` (entidad, item, receta y textos), en `packs/RP` (client entity,
  geometría, textura, render controller, animación y textos) y en `src/train/`. También un generador
  del modelo y la textura en `tools/`.
- `src/main.ts`: registra el custom component del item en la fase de registro y arranca el tren en la
  fase de mundo.
- Sin dependencias nuevas.
- Al quitar el add-on, los vagones desaparecen como cualquier entidad de un pack quitado. Los rieles
  quedan intactos.
