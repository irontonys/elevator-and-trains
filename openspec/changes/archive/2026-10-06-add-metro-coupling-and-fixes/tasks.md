# Tasks

## 1. Preparación

- [x] 1.1 Volver a correr `npm view @minecraft/server dist-tags` / `server-ui` y confirmar que `latest` sigue en 2.10.0 / 2.2.0. Verificar: anotado en design.md si cambió.
- [x] 1.2 Confirmar que `add-skeleton-and-elevator` y `add-metro-train` se archivaron antes de archivar este change (sus specs deben existir en `openspec/specs/`). Verificar: `openspec list --specs` muestra `elevator` y `metro-train` antes del archive de este change.

## 2. Elevador

- [x] 2.1 Agregar `isPassable(typeId)` a `floors.ts` (alfombras, carteles y antorchas, sin `torchflower`) y usarla en `columnAt`. Pruebas con alfombra sobre un piso, antorcha y cartel de pared en el espacio de la cabeza, cartel colgante en la columna y `torchflower` (sí estorba). Verificar: `npm run test` pasa.
- [x] 2.2 Quitar el título de `indicator.ts` y agregar la etiqueta PH para el piso más alto (`bar_top`), con los textos `es_MX`/`en_US` y quitando las claves que ya no se usan. Verificar: `npm run typecheck` pasa y `grep setTitle src` no encuentra nada.

## 3. Rieles y física

- [x] 3.1 Caché de lecturas de rieles en `rails.ts` (design §3) con `railInfoAt` (`powered`, `isGolden`), borrada cada 20 ticks. Verificar: `npm run typecheck` pasa.
- [x] 3.2 Extender `physics.ts` con propulsores (design §4): `boost`, `brake`, `departing`, nuevas velocidades y bajada de velocidad por encima del máximo del conductor. Pruebas: el boost llega a 20 b/s solo, al salir del tramo baja hasta 12 con "adelante", el propulsor apagado frena con "adelante", sale de la estación tras detenerse, arranca solo detenido sobre un boost, y el metro supera los 8 b/s del carrito. Verificar: `npm run test` pasa.

## 4. Trenes unidos

- [x] 4.1 Escribir `src/train/consist.ts` (puro, design §6): posiciones de los vagones desde la cabeza, `moveAlong` con márgenes delante y detrás, unir (máximo 4), partir y detectar el choque. Generalizar `moveAlong` en `bogies.ts` sin romper sus pruebas. Pruebas: tren de 3 en curva (distancia constante sobre la vía), reversa limitada por la cola, fin de vía para la cabeza, unir 2+2, rechazar 4+1 y partir 3 en 1+2. Verificar: `npm run test` pasa.
- [x] 4.2 Reescribir el registro de `train.ts` por trenes: dynamic property `eleytren:consist`, agrupar al cargar, esperar vagones sin cargar, conductor en la cabeza, propulsores bajo cualquier vagón, choque y unión, desenganche agachado y partir al quitar a golpes. Verificar: `npm run typecheck` y `npm run build` pasan.
- [x] 4.3 Enganchar al colocar en `spawn.ts` (design §6). Verificar: `npm run typecheck` pasa.

## 5. Inclinación y diagnóstico

- [x] 5.1 Subir `packs/RP/entity/metro_car.entity.json` a `format_version` "1.26.0" y agregar el HUD de dev del conductor (velocidad y pitch) detrás de `__DEV__`. Verificar: `npm run build:release` y `grep` confirman que el HUD no está en release.

## 6. Build, documentación e iPad

- [x] 6.1 Subir a 0.3.0 y correr `npm run test`, `npm run build` y `npm run build:release`. Verificar: todo pasa y el `main.js` de release solo importa `@minecraft/server` / `@minecraft/server-ui`.
- [x] 6.2 Actualizar `CLAUDE.md` y `decisiones.md` (propulsores, velocidades, caché, trenes unidos, PH y bloques como aire). Verificar: sin datos desactualizados.
- [x] 6.3 Pedirle a Daniel que pruebe en el iPad:
  - Elevador: solo action bar, PB/1/…/PH, alfombras, antorchas y carteles sin estorbar.
  - Metro: propulsores encendidos (acelera solo a 20 b/s) y apagados (estación: frena y luego sale), más rápido que un carrito, inclinación de subida y de bajada (con el HUD de dev).
  - Vagones: colocar pegados, chocar, curva con 3 vagones, límite de 4, desenganchar agachado, quitar un vagón de en medio, y guardar y reabrir.
  - Content Log limpio.

  Verificar: Daniel confirma cada punto.
