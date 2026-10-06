# Design

## Context

Este change se monta sobre el esqueleto de `add-skeleton-and-elevator` (packs, `tools/build.mjs`,
`src/main.ts`). La motivación está en proposal.md y los requisitos en el spec `metro-train`.

Lo que se revisó en `@minecraft/server` 2.10.0 (estable) y en bedrock-samples 1.26.50.4:
- **Input del conductor:** `Player.inputInfo.getMovementVector()` (estable).
- **Asientos:** `EntityRideableComponent.getRiders()`, `addRider()` y `ejectRider()`. En civiles ya
  se probó que mover con `teleport` (con rotación) una entidad con jinetes funciona.
- **Ciclo de vida de las entidades:** `world.afterEvents.entityLoad`, `entitySpawn`, `entityRemove`,
  `entityHitEntity` y `entityHurt`. Además `Entity.setProperty` para las propiedades de entidad.
- **Item:** custom component de item con `onUseOn` (`block`, `itemStack`, `source`), que se
  registra en `system.beforeEvents.startup`. Para avisar al jugador:
  `onScreenDisplay.setActionBar`.
- **Rieles:** `@minecraft/vanilla-data` 1.26.52 confirma que `minecraft:rail` tiene
  `rail_direction`, y que `golden_rail`, `detector_rail` y `activator_rail` tienen `rail_direction` +
  `rail_data_bit`.
- **Hitbox:** `minecraft:custom_hit_test` existe en vanilla (hoglin y zoglin).
- **Formatos:** las entidades vanilla usan `format_version` 1.26.30, las client entities 1.10.0 y los
  items de vanilla con componentes usan 1.21.x.

Restricciones: sin beta, sin tocar `minecraft:*` y sin JSON UI. No hay juego en la Mac, así que todo
lo que dependa de la vía se prueba con mocks.

## Goals / Non-Goals

**Goals:**
- Que la lógica de la vía sea pura y se pueda probar: curvas, pendientes, escaleras diagonales y fin
  de vía.
- Que el modelo y la textura salgan de un generador versionado, para cambiar la paleta en un solo lugar
  cuando lleguen las fotos de referencia.

**Non-Goals:**
- Varios vagones, modo automático, estaciones y rieles propulsores con efecto (ya decidido en
  `decisiones.md`).
- Detectar obstáculos, atropellar o empujar mobs: el vagón los atraviesa.
- Sonidos de motor y puertas animadas. Pueden ir en un change aparte.
- Manejar desde la otra cabina: las dos cabinas se ven iguales, pero el conductor siempre va en la
  del frente y la reversa es más lenta.

## Decisions

### 1. Vía: geometría por bloque a partir de `rail_direction` (`src/train/track.ts`, puro)
Cada riel une dos lados de su bloque (N/S/E/W). La tabla de Bedrock es la siguiente. Se verifica en
minecraft.wiki al implementar, porque Microsoft Learn no la documenta:

| `rail_direction` | Une | Forma |
|---|---|---|
| 0 / 1 | N–S / E–O | recta |
| 2 / 3 / 4 / 5 | sube hacia E / O / N / S | pendiente (+1 en Y del lado alto) |
| 6 / 7 / 8 / 9 | S–E / S–O / N–O / N–E | curva (solo `minecraft:rail`) |

- **Recorrido dentro de un bloque:** recta de punto medio de un lado al punto medio del otro (largo 1),
  pendiente igual pero subiendo 1, y curva como un cuarto de círculo de radio 0.5 alrededor de la
  esquina compartida (largo π/4).
- **Pasar al siguiente bloque:** se sale por un lado. El vecino se busca en la misma Y; si se salió
  por el lado alto de una pendiente, en Y+1; y si no hay riel a la misma altura, en Y−1 (una pendiente
  que baja). El vecino solo cuenta si su riel también tiene ese lado. Si no, ahí se acaba la vía.
- **Cursor:** `{ bloque, lado de entrada, avance 0..largo }`. `advance(cursor, d)` regresa el nuevo
  cursor y la distancia que realmente pudo avanzar (menos si se acabó la vía). `pointAt(cursor)` da la
  posición 3D.
- La lógica recibe `railAt(x, y, z): number | undefined`, igual que `kindAt` en el elevador. Un bloque
  sin cargar regresa `undefined`, o sea, fin de vía.
- *Descartado:* `minecraft:rail_movement` (física del carrito). Trata al vehículo como un punto, así
  que un modelo de 6 bloques se sale de la vía en las curvas. Además no deja controlar la velocidad
  por script.

### 2. Dos bogies sobre la vía
- El estado del vagón es un cursor en su **centro** sobre la vía. Los bogies se calculan avanzando
  ±2 bloques sobre la vía desde el centro (distancia entre bogies de 4).
- La posición de la entidad es el punto medio entre los dos bogies. El **yaw** sale de la recta del
  bogie trasero al delantero y el **pitch**, de su diferencia de altura. Así una curva o una escalera
  diagonal de curvas se ve como un giro gradual. El cuerpo sobresale ~1 bloque fuera de los bogies,
  como un vagón real.
- Si al avanzar cualquiera de los dos bogies llegaría al fin de la vía, el centro solo avanza lo que
  quepa y la velocidad queda en 0.

### 3. Entidad `eleytren:metro_car` (BP, `format_version` 1.26.30)
- `minecraft:physics` sin gravedad ni colisión. El script es el único que lo mueve, con `teleport` en
  cada tick que cambia la posición.
- Sin `pushable_by_entity` / `pushable_by_block`: en civiles se comprobó que sin ellos no se empuja.
  También `knockback_resistance` 1.
- `damage_sensor` que cancela todo el daño, más `persistent` y `type_family`
  `["eleytren_metro", "inanimate"]`.
- `collision_box` de 2 × 2.8. Las cajas son cuadradas y no giran con el yaw, así que una de 6 de largo
  bloquearía de lado. `custom_hit_test` con una caja de 3 × 3 en el centro, para golpear y subir por la
  zona de las puertas.
- `rideable` con 7 asientos (`family_types: ["player"]`, `pull_in_entities: false`): el asiento 0 en la
  cabina y 6 de pasajeros en dos bancas laterales viendo hacia adentro.
- Propiedad `eleytren:pitch` (float, `client_sync`) para inclinar la carrocería en las pendientes.
  `is_spawnable: false`, `is_summonable: true`.

### 4. Manejo (`src/train/train.ts`)
- **Registro de vagones:** un `Map<entityId, TrainState>`. Se llena con `entityLoad`/`entitySpawn` y con
  un barrido inicial en `worldLoad`, y se limpia con `entityRemove`. Un `system.runInterval` de 1 tick
  mueve cada vagón.
- **Conductor:** el primer `Player` de `getRiders()`. Se supone que el orden es el de los asientos; si
  en el iPad resulta que no, se ajusta y se anota. Se lee `inputInfo.getMovementVector().y`.
- **Física** (constantes en `src/train/config.ts`):

  | Concepto | Valor |
  |---|---|
  | Velocidad máxima adelante | 0.5 bloques/tick (10 bloques/s) |
  | Velocidad máxima en reversa | 0.15 bloques/tick |
  | Aceleración | 0.01 |
  | Frenado con "atrás" | 0.03 |
  | Frenado sin input | 0.004 |
  | Frenado sin conductor | 0.02 |

- **Al cargar:** el centro se ajusta al riel bajo la entidad (o uno abajo), en el punto del bloque más
  cercano, y el sentido "adelante" se toma del más parecido al yaw de la entidad. La velocidad empieza
  en 0. No se guarda nada en el mundo.
- `setProperty("eleytren:pitch")` solo cuando cambia más de 0.5°.

### 5. Item y aparición (`src/train/spawn.ts`)
- Item `eleytren:metro_car`, con el custom component `eleytren:metro_spawner` registrado en `startup`.
  `onUseOn` hace lo siguiente:
  1. Si el bloque no es un riel, no hace nada.
  2. Arma el cursor en el centro del riel y elige el sentido más parecido al que mira el jugador.
  3. Comprueba que caben los dos bogies. Si no caben, avisa en la action bar y termina.
  4. Si caben, hace `spawnEntity` con la posición y la rotación calculadas y, si el jugador no está en
     creativo, le quita 1 item de la mano.
- Cooldown de 10 ticks por jugador, porque `onUseOn` se puede repetir al mantener presionado en
  touch.
- **Receta (supuesto):** con forma, `GGG / IMI / IRI` (vidrio, hierro, carrito y redstone) → 1 vagón.

### 6. Quitarlo
- `entityHitEntity` con un jugador como atacante y el vagón como objetivo. Se cuentan 3 golpes del
  mismo jugador en 40 ticks y entonces se hace `ejectRiders()` y `remove()`. Si el jugador está en
  supervivencia o aventura, recibe el item (si su inventario está lleno, se suelta en el piso).
- **Riesgo:** con `damage_sensor` cancelando el daño, `entityHitEntity` podría no dispararse. Si pasa,
  se cambia a un `damage_sensor` que solo deje pasar el daño de jugadores, con `entityHurt`, y se
  restaura la vida. Se anota en `decisiones.md` lo que funcione.

### 7. Modelo y textura generados (`tools/gen-metro.mjs`)
- El script genera `packs/RP/models/entity/eleytren_metro_car.geo.json` y
  `packs/RP/textures/entity/eleytren_metro_car.png`. Se corre a mano y su salida se versiona, así que
  el build no cambia.
- La geometría se arma con cubos en un mapa UV propio:
  - Huesos: `root` > `body` (pivote al centro, para el pitch) > `shell`, `cabin`, `seats` y `bogies`.
  - Carrocería de ~6 × 2 × 2.75 bloques, con ventanas corridas y una cabina con parabrisas.
  - Puertas dobles en cada lado, bancas adentro y dos bogies con ruedas.
  - Cabina idéntica en los dos extremos (frente, mampara, tablero y asiento), para que el vagón se vea
    bien sin importar hacia qué lado quede el frente del modelo.
  - `visible_bounds` de 8 × 4, para que el vagón no deje de dibujarse cuando su centro sale de la
    pantalla.
- **Ventanas:** píxeles transparentes con el material `entity_alphatest`, para ver a los pasajeros.
- **Paleta:** una constante `PALETTE` al inicio del generador. Mientras Daniel no pase fotos, es un
  placeholder (carrocería clara, franja de color y faldón oscuro), sin logos ni texto.
- El generador también saca vistas previas (lado, frente y arriba) en PNG, para revisar la forma antes
  de mandar el build al iPad.
- Client entity (1.10.0) con `controller.render.default` (se referencia, no se sobrescribe) y la
  animación `animation.eleytren.metro_car.pitch`, que rota `body` con
  `query.property('eleytren:pitch')`.

## Risks / Trade-offs

- [Curva cerrada de un bloque con un vagón de 6] → El cuerpo sobresale mucho en curvas de 90° de un
  solo riel. Es inherente al tamaño. Se recomienda en la descripción usar curvas abiertas (escalera de
  curvas) y túneles de 3 de ancho.
- [El orden de `getRiders()` no es el de los asientos] → Se verifica en el iPad; si falla, el
  conductor se marca con una dynamic property del jugador al subir.
- [Velocidad 10 bloques/s con chunks sin cargar] → La vía sin cargar cuenta como fin de vía y el vagón
  se detiene. No se cargan chunks a la fuerza.
- [Mapeo de `rail_direction` equivocado] → Una tarea lo verifica con fuente, y las pruebas con mocks
  incluyen cada valor.
- [Golpes cancelados por `damage_sensor`] → Plan B descrito en §6.
- [Paleta aproximada] → Se aísla en `PALETTE` y se ajusta con las fotos de Daniel.

## Migration Plan

No aplica: no hay nada publicado. Sube la versión menor del add-on (0.2.0).
