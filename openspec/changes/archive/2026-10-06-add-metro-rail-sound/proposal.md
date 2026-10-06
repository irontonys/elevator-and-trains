# Proposal

## Why

En el iPad, el metro en movimiento suena como si alguien fuera corriendo: el juego le pone al vagón los
pasos del bloque que pisa (`heavy.step`), igual que a un mob. Daniel quiere que suene como un carrito
vanilla sobre la vía.

## What Changes

- **Sin pasos:** `packs/RP/sounds.json` declara para `eleytren:metro_car` los eventos `step` y
  `heavy.step` vacíos, como hace vanilla con `minecart`.
- **Sonido de rieles:** mientras el tren avanza, cada vagón reproduce `minecart.base` (el sonido vanilla
  del carrito sobre la vía) cada 36 ticks, con volumen según la velocidad y un tono un poco más agudo
  cuando va más rápido. Detenido, no suena.
- Versión 0.3.3.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `metro-train`: el vagón en movimiento suena como un carrito sobre la vía y no hace sonidos de pasos.

## Impact

- Nuevo `packs/RP/sounds.json` (solo la entrada de `eleytren:metro_car`; no toca entidades vanilla).
- `src/train/physics.ts` (función pura del volumen y el tono, con pruebas), `src/train/train.ts`,
  `src/train/config.ts`.
- Sin sonidos nuevos en el pack: se usa `minecart.base` de vanilla.
