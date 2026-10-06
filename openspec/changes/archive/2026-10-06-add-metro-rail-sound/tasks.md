# Tasks

## 1. Sonido

- [x] 1.1 Crear `packs/RP/sounds.json` con `step` y `heavy.step` vacíos para `eleytren:metro_car`. Verificar: el `.mcaddon` trae `eleytren_RP/sounds.json`.
- [x] 1.2 Agregar `rollSound(speed)` a `physics.ts` y `ROLL_SOUND`, `ROLL_SOUND_TICKS` y `ROLL_SOUND_MIN_SPEED` a `config.ts`, con una prueba (callado detenido, más fuerte y agudo con más velocidad, igual en reversa). Verificar: `npm run test` pasa.
- [x] 1.3 En `train.ts`, reproducir `minecart.base` en cada vagón cada `ROLL_SOUND_TICKS` mientras el tren se mueve. Verificar: `npm run typecheck` pasa.

## 2. Build e iPad

- [x] 2.1 Subir a 0.3.3 y correr `npm run build:release`. Verificar: el build pasa.
- [x] 2.2 Pedirle a Daniel que pruebe en el iPad: ya no se oyen pasos, el tren suena como un carrito sobre la vía, suena más fuerte con propulsores, se calla detenido y el Content Log queda limpio. Verificar: Daniel lo confirma.
