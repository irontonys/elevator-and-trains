# Design

## Context

Vanilla silencia los pasos del carrito en `sounds.json` (`"minecart": { "events": { "step": "" } }`) y
lo hace sonar con un loop del cliente (`minecart.base`, en `sound_definitions` 1.26.50.4) que el Script
API no puede arrancar. El `.fsb` de `minecart.base` dura ~1.9 s (64 256 muestras a 33 182 Hz, según su
encabezado).

## Goals / Non-Goals

**Goals:** sin pasos; sonido de rieles mientras se mueve, más fuerte con más velocidad.

**Non-Goals:** `minecart.inside` para los pasajeros y sonidos propios (bocina, puertas).

## Decisions

1. **`sounds.json` en el RP** con `entity_sounds.entities["eleytren:metro_car"].events` = `step: ""` y
   `heavy.step: ""`. El juego une el `sounds.json` de cada pack, y la llave es nuestra, así que no
   reemplaza nada de vanilla.
2. **`dimension.playSound("minecart.base", posición del vagón, { volume, pitch })`** cada
   `ROLL_SOUND_TICKS = 36` ticks (1.8 s, un poco menos que el sonido, para que no queden huecos) por
   tren, en cada vagón, solo si el tren se movió en ese tick. El primer sonido sale apenas arranca.
3. **Volumen y tono puros** en `physics.ts` (`rollSound(speed)`): como el carrito de Java, el volumen
   sube de 0 a 0.7 hasta 10 b/s (0.5 b/tick); el tono va de 0.8 detenido a 1.2 a 20 b/s. Por debajo de
   0.02 b/tick no suena.

## Risks / Trade-offs

- [Se nota el corte cada 1.8 s] → Se ajusta `ROLL_SOUND_TICKS` después de escucharlo en el iPad.
- [Si `step: ""` no apaga los pasos en una entidad custom] → Plan B: `minecraft:movement_sound_distance_offset`
  grande en el BP.
