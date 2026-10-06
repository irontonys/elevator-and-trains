# Tasks

## 1. Inclinación sin propiedad

- [x] 1.1 En `train.ts`, mandar `rotation: { x: -pose.pitch, y: pose.yaw }` en el teleport de `refreshPoses`, quitar `setProperty` y el parámetro `force`, y seguir guardando `consist.pitches` para el HUD. Quitar `PITCH_PROPERTY` y `PITCH_EPSILON` de `config.ts`. Verificar: `npm run typecheck` y `npm run test` pasan, y `grep -rn setProperty src` no encuentra nada.
- [x] 1.2 Quitar `properties` de `packs/BP/entities/metro_car.json` y rotar `body` con `query.body_x_rotation` en `metro_car.animation.json`. Verificar: `grep -rn "eleytren:pitch" packs src` no encuentra nada.

## 2. Build e iPad

- [x] 2.1 Subir a 0.3.2 y correr `npm run build`. Verificar: el build pasa.
- [x] 2.2 Pedirle a Daniel que pruebe en el iPad: el pack aparece como "Elevator & Trains" con ícono, el metro sube y baja una pendiente con la carrocería inclinada hacia el lado correcto, los pasajeros miran bien, y el Content Log queda sin errores del add-on. Verificar: Daniel lo confirma.
