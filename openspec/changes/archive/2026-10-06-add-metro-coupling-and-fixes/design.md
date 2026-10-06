# Design

## Context

Retroalimentación de la 0.2.0 en el iPad (proposal.md). Código actual:
- **Elevador:** `src/elevator/floors.ts` (puro), `elevator.ts` e `indicator.ts`.
- **Metro:** `src/train/track.ts`, `bogies.ts` y `physics.ts` (puros), y `train.ts`, `spawn.ts` y
  `rails.ts`.

Lo que se revisó al planear:
- **Inclinación:** la lógica calcula bien el pitch (pruebas de `poseOf` en pendiente), pero la client
  entity del metro está en `format_version` 1.10.0 y su animación lee `query.property`.
  - En `civiles`, la misma query funciona con una client entity 1.26.0, y vanilla 1.26.50 ya tiene 7
    client entities en 1.26.0.
  - Causa probable: el formato viejo.
- **IDs de bloques** (`@minecraft/vanilla-data` 1.26.52):
  - Alfombras: `*_carpet`, incluidas `moss_carpet` y `pale_moss_carpet`.
  - Carteles: `standing_sign`, `wall_sign`, `*_standing_sign`, `*_wall_sign` y `*_hanging_sign`.
  - Antorchas: `torch`, `soul_torch`, `redstone_torch`, `unlit_redstone_torch`, `underwater_torch`,
    `copper_torch` y `colored_torch_*`.
  - Cuidado: `torchflower` y `torchflower_crop` **no** son antorchas.
- **Rieles propulsores:** `minecraft:golden_rail` con `rail_data_bit` (encendido = `true`).

## Goals / Non-Goals

**Goals:**
- Que cada tick de un tren en movimiento haga pocas lecturas de bloques, aunque tenga 4 vagones.
- Que la lógica de los propulsores y de los trenes unidos sea pura y se pueda probar con mocks.

**Non-Goals:**
- Cambiar de cabina (sigue pendiente de decidir con Daniel).
- Trenes de más de 4 vagones, modo automático y estaciones con nombre.
- Mover el metro cada 2 ticks: se vería a saltos. Se queda en cada tick y se baja el costo de cada uno.

## Decisions

### 1. Elevador: bloques "como aire"
- En `elevator.ts`, `columnAt` regresa `"air"` para los bloques de la lista de arriba.
- La regla vive en una función pura `isPassable(typeId)` en `floors.ts`, con pruebas que incluyen
  `torchflower`, que no debe contar.
- *Descartado:* tratar como aire cualquier bloque sin colisión. No hay API estable para saber eso
  (`isSolid` no es estable).

### 2. Indicador: solo action bar y PH
- Se quita `setTitle`.
- Etiquetas: índice 0 = `PB`, el último = `PH` y los demás son su número.
- Textos traducibles: `eleytren.elevator.bar` ("Piso %s / %s"), `bar_ground` ("PB / %s") y `bar_top`
  ("PH / %s"). En inglés: "Floor %s / %s", "G / %s" y "PH / %s".
- Con solo 2 pisos (PB y el siguiente), el de arriba es PH.

### 3. Lectura de rieles con caché (`src/train/rails.ts`)
- `railAtFor(dimension)` pasa a regresar un lector con caché: un `Map` por dimensión de
  `"x,y,z" → { dir, powered, isGolden } | null` que se borra cada 20 ticks. Así se notan los cambios
  de la vía (romper rieles o encender propulsores) en ≤1 s, y en cada tick casi no se llama a
  `getBlock`.
- `RailAt` sigue regresando solo `dir` para la geometría. Una segunda función `railInfoAt` da
  `powered` / `isGolden` para la física.

### 4. Física con propulsores (`src/train/physics.ts`, puro)
`nextSpeed(speed, input, rail)` con `rail: "normal" | "boost" | "brake"`, según el riel bajo el centro
de **cualquier** vagón del tren:
- `boost` gana sobre `brake`, y `brake` sobre `normal`.

| Situación | Efecto |
|---|---|
| `boost` | Acelera hasta `BOOST_MAX_SPEED` = 1.0 bloques/tick (20 bloques/s) con `BOOST_ACCELERATION` = 0.04, en el sentido del movimiento. Si está detenido, hacia el frente. Ignora el input del conductor. |
| `brake` | Frena con `BRAKE` hasta 0, aunque el conductor mantenga "adelante". Al llegar a 0 se marca `departing`. |
| `departing` | El tren ignora `brake` hasta que ningún vagón esté sobre un propulsor apagado; ahí el conductor puede arrancar. |
| `normal` | Máximo del conductor `MAX_SPEED` = 0.6 (12 bloques/s, antes 0.5). Si `|speed|` es mayor (por venir de un propulsor), baja con `COAST_DRAG` aunque haya "adelante". Reversa máxima sin cambio (0.15). |

- `departing` vive en el estado del tren (memoria) y se pasa a la función pura.
- A 20 bloques/s el tren avanza 1 bloque por tick. `moveAlong` ya recorre varios bloques por llamada y
  la caché del §3 absorbe las lecturas.

### 5. Inclinación
- La client entity sube a `format_version` "1.26.0" (como civiles y las 7 de vanilla). La animación
  sigue rotando `body` con `query.property('eleytren:pitch')`.
- **Diagnóstico en el iPad:** solo en `__DEV__`, el conductor ve en la action bar "v=12.0 b/s ·
  pitch=14°". Si el pitch cambia y la carrocería no, el problema es del RP; si el pitch no cambia, es
  del script.
- Si el formato no lo arregla, plan B: rotar con `query.target_x_rotation`, poniendo el pitch en la
  rotación x del `teleport`. Se decide con el diagnóstico, sin cambiar el spec.

### 6. Trenes unidos (`src/train/consist.ts` puro + `train.ts`)
- **Modelo:** un tren (`Consist`) es una lista ordenada de vagones `[cabeza, …, cola]` y un solo cursor
  en el centro de la cabeza, cuyo sentido de avance es el frente del tren.
  - El vagón `k` está en `advance(cabeza, −k × SPACING)`, con `SPACING` = 6.25 (6 de largo + 0.25 de
    holgura).
  - El pose de cada vagón se calcula con `poseOf` en su propio cursor, así que cada uno gira por su
    cuenta en las curvas.
- **Mover:** se usa `moveAlong` con un margen extendido.
  - Hacia adelante limita el bogie delantero de la cabeza.
  - En reversa limita el bogie trasero de la cola, a `−(n−1) × SPACING − 2` del cursor.
  - Se generaliza `moveAlong(railAt, center, d, aheadMargin, behindMargin)`.
- **Conductor:** el primer jugador del asiento 0 de la cabeza. Los asientos 0 de los demás vagones
  son de pasajeros.
- **Enganchar:**
  - *Al colocar:* con el vagón nuevo en la vía, se busca otro vagón que esté sobre la misma vía a
    `SPACING ± 0.75` hacia adelante o hacia atrás. Se compara el cursor avanzado con la posición de los
    trenes registrados en la misma dimensión. Si existe y el tren resultante no pasa de 4 vagones, se
    unen y la cabeza queda en el extremo hacia donde mira el jugador.
  - *Al chocar:* después de mover un tren, si el punto a `SPACING` delante de la cabeza (o detrás de la
    cola en reversa) queda a ≤0.75 del centro de un vagón de otro tren, el tren se detiene ahí y, si
    caben, se unen.
  - Con más de 4 vagones, el tren se detiene sin unirse.
- **Desenganchar:** `world.afterEvents.playerInteractWithEntity` con el jugador agachado
  (`isSneaking`). El rideable ya tiene `crouching_skip_interact`, así que no se monta. El tren se parte
  justo antes de ese vagón.
- **Quitar a golpes:** se parte el tren y los dos lados quedan como trenes separados.
- **Guardar:** cada vagón lleva la dynamic property `eleytren:consist` con un JSON
  `{ id, index }`.
  - Al cargar, se agrupan los vagones con el mismo `id` y se ordenan por `index`. La cabeza se ajusta
    a la vía y los demás se recalculan desde ella.
  - Si falta un vagón (chunk sin cargar), el tren no se mueve hasta que estén todos.
  - Las dynamic properties viven en la entidad: se van con ella al quitar el add-on.
- **Lógica pura en `consist.ts`:** posiciones de los vagones, límites de avance, partir y unir listas,
  y detectar el choque con mocks.

### 7. Costo por tick
Un tren detenido sin conductor y sin propulsor debajo no hace teleport ni lee bloques nuevos (caché).
Un tren en movimiento con `n` vagones hace:
- `n` teleports (inevitable para que se vea fluido).
- Unas `4n` lecturas de rieles, casi todas desde la caché.
- `setProperty` solo cuando el pitch cambia más de 0.5°.

## Risks / Trade-offs

- [20 bloques/s cruzando chunks sin cargar] → La vía sin cargar sigue siendo fin de vía y el tren se
  detiene. Se documenta que las vías rápidas deben estar en zonas cargadas.
- [Choque a mucha velocidad] → El tren se detiene en seco al tocar al otro. Sin daño ni rebote, para
  no complicarlo.
- [El formato no arregla la inclinación] → Diagnóstico de dev y plan B en §5.
- [Orden de carga de los vagones de un tren] → Se espera a tener todos. Si un vagón se borró por fuera
  (por ejemplo con `/kill`), el tren con un hueco se reagrupa al cargar: se vuelve a numerar en orden.

## Migration Plan

Los vagones de la 0.2.0 no tienen `eleytren:consist`: al cargar quedan como trenes de un vagón. No hay
datos que migrar.

## Open Questions

- Cambiar de cabina en los trenes unidos (se puede agregar después sin cambiar este diseño).
