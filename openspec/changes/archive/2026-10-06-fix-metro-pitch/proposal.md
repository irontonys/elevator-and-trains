# Proposal

## Why

En el iPad, el Content Log se llena de errores en cada tick mientras el metro se mueve:
`Property "eleytren:pitch" does not exist on Entity of type "eleytren:metro_car"` (al hacer
`setProperty`), y en el cliente `query.property called on an actor without a property component`. La
propiedad sí está definida en `packs/BP/entities/metro_car.json`, pero el juego carga la entidad sin
ella. Por eso la carrocería nunca se inclinó en las pendientes, y el add-on no se puede publicar con
el log sucio.

## What Changes

- La inclinación deja de usar una propiedad de entidad. El script pone el pitch en la **rotación X de la
  propia entidad** en el mismo `teleport` con el que ya la mueve cada tick, y la animación del RP rota
  la carrocería con `query.body_x_rotation`. Era el plan B de `add-metro-coupling-and-fixes` (design §5).
- Se quita la propiedad `eleytren:pitch` del BP y las constantes `PITCH_PROPERTY` y `PITCH_EPSILON`.
  Sin `setProperty` no hay ninguna llamada que pueda fallar por tick: el log queda limpio aunque la
  inclinación no se vea.
- El HUD de dev sigue mostrando el pitch calculado, para comparar con lo que se ve en el iPad.
- Versión 0.3.2.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `metro-train`: la inclinación en pendientes no debe dejar errores en el Content Log.

## Impact

- `src/train/train.ts`, `src/train/config.ts`, `packs/BP/entities/metro_car.json`,
  `packs/RP/animations/metro_car.animation.json`.
- Sin dependencias nuevas. Los vagones guardados con la propiedad vieja cargan sin problema: el juego
  descarta el valor de una propiedad que ya no está en la definición.
