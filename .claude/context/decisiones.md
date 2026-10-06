# Bitácora de decisiones

Formato: fecha — decisión — por qué — alternativas descartadas.

## 2026-10-06 — Arranque del proyecto
- **Decisión:** mismo enfoque que `../civiles`: TypeScript + Script API estable + esbuild +
  OpenSpec, namespace propio (`eleytren:`), solo APIs estables, última versión estable de Mojang.
- **Por qué:** se publicará abiertamente en MCPDL y debe sobrevivir a las actualizaciones; Daniel
  ya validó ese flujo en `civiles` y quiere replicarlo aquí.
- **Descartado:** nada todavía — es la primera decisión del proyecto.

## 2026-10-06 — Mecánica del elevador
- **Decisión:** el rango del elevador lo marcan dos bloques custom iguales (inicio y límite). El
  script detecta los pisos por **suelo real** entre ambos bloques (no por una altura fija cada N
  bloques). Saltar dentro del elevador sube **un piso por salto**.
- **Por qué:** lo pidió Daniel explícitamente.
- **Descartado:** subir directo al bloque límite en un solo salto; detección de piso por altura
  fija.

## 2026-10-06 — Mecánica del tren
- **Decisión:** trenes de metro que corren sobre los rieles vanilla existentes, con un modelo de
  al menos ~6 bloques de largo (más grande que el carrito vanilla).
- **Por qué:** lo pidió Daniel; busca un tren de metro, no el carrito estándar.
- **Descartado:** riel propio o pieza de vía custom (no se ha discutido, se usa el riel vanilla).

## 2026-10-06 — Bajar en el elevador
- **Decisión:** agacharse (sneak) baja **un piso** por cada vez que el jugador se agacha, hasta el
  bloque de inicio. Mantenerse agachado no baja más pisos.
- **Por qué:** lo eligió Daniel. Es el control más común en los add-ons de elevador y complementa el
  salto para subir.
- **Descartado:** bajar directo al bloque de inicio y bajar con un menú.

## 2026-10-06 — Primer change: esqueleto + elevador
- **Decisión:** el primer change (`add-skeleton-and-elevator`) junta el scaffolding y el elevador. El
  tren va en un change aparte.
- **Por qué:** el primer `.mcaddon` ya trae algo jugable para probar en el iPad. El tren es la parte
  más riesgosa (modelo grande sobre rieles vanilla) y conviene investigarlo por separado.

## 2026-10-06 — Manifest `format_version: 2`
- **Decisión:** los manifests de BP y RP usan `format_version: 2` (versiones como array `[x, y, z]`;
  las dependencias de módulos de script, como string `"2.10.0"`).
- **Por qué:** Microsoft Learn sigue documentando la versión 3 como *preview*
  ("Version 3 is a new update of the manifest currently in preview").
  Fuente: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest
  (página actualizada el 2026-04-21, revisada el 2026-10-06).
- **Revisar:** al empezar cada change. El formato de las versiones vive solo en `tools/build.mjs`.

## 2026-10-06 — Implementación del elevador (change `add-skeleton-and-elevator`)
- **Estructura:** igual que civiles: `packs/` + `src/` → `dist/`, versión única en `package.json`,
  `.mcaddon` con fflate y aviso de dev detrás de `__DEV__`. Pruebas de lógica pura con
  `npm run test` (esbuild + `node --test`; los `*.test.ts` se excluyen del typecheck del add-on).
- **Input:** `world.afterEvents.playerButtonInput` (estable en 2.10.0) filtrado a Jump/Sneak en
  `Pressed`. Solo dispara al presionar, así que mantener el botón no repite. Además hay un cooldown en
  memoria de 8 ticks por jugador. *Descartado:* polling de `isJumping`/`isSneaking`.
- **Piso sin `isSolid`:** `Block.isSolid` no es estable. Piso = bloque que no es aire ni líquido con
  2 bloques de **aire** encima. Una antorcha o alfombra en la columna cuenta como suelo o tapa un piso
  (riesgo aceptado). Un bloque sin cargar se trata como sólido para no meter al jugador en un bloque.
- **Tramos:** cada par consecutivo de bloques de elevador en la columna es un tramo; el intermedio
  es piso de ambos, así que una columna con 3+ bloques se recorre entera.
- **Receta:** 8 lingotes de hierro alrededor de 1 redstone → 2 bloques (se desbloquea con el
  lingote). Formato copiado de `compass.json` de bedrock-samples 1.26.50.4.
- **Sonido:** `random.orb` (existe en `sound_definitions` 1.26.50), solo para el jugador que se mueve.

## 2026-10-06 — Alcance del tren (antes del change)
- **Decisión:** lo maneja un jugador (acelerar, frenar, reversa); 1 solo vagón fijo de ~6 bloques;
  aparece al usar un item sobre un riel vanilla (en creativo y con receta); todos los rieles vanilla
  cuentan igual (propulsor/detector/activador no hacen nada especial).
- **Enfoque técnico propuesto:** entidad propia movida por script (teleport) siguiendo el trazo de
  los rieles leído de su estado de dirección, como los carros de civiles. No se usa
  `minecraft:rail_movement`, porque trata al vehículo como un punto y un modelo largo se sale de la
  vía en las curvas. No se colocan ni modifican rieles.
- **Por qué:** lo eligió Daniel. Es el alcance mínimo para validar lo riesgoso (seguir la vía en
  curvas con un modelo largo).
- **Descartado por ahora:** modo automático entre estaciones, varios vagones, vagones configurables
  y rieles propulsores como límite de velocidad.

## 2026-10-06 — Diseño del tren: vagón de metro inspirado en Metrorrey
- **Decisión:** el modelo es un vagón de metro (no un tren genérico), con los colores de Metrorrey
  (Monterrey) pero **sin logos ni marcas oficiales**. El conductor va en una cabina al frente y los
  pasajeros sentados dentro del vagón, visibles por las ventanas.
- **Por qué:** lo pidió Daniel; el add-on es para un metro.
- **Pendiente al diseñar:** confirmar con fotos de referencia la paleta y la forma del vagón, y
  cuántos asientos de pasajero caben en ~6 bloques.
- **Descartado:** metro genérico y estilo Metro CDMX.

## 2026-10-06 — Indicador de piso del elevador
- **Decisión:** al llegar a un piso se muestra un título ("Piso 3" / "de 5") y, mientras el jugador
  sigue en ese piso, la action bar ("Piso 3 / 5"). Los pisos se numeran desde el bloque de elevador
  más bajo de la columna: ese es **PB** (planta baja) y los de arriba son 1, 2, 3… Los textos son
  traducibles (`eleytren.elevator.*` en el RP).
- **Recursos:** se calcula solo al moverse. La action bar se refresca cada 10 ticks solo para los
  jugadores que acaban de usar el elevador, comparando su posición sin leer bloques. El intervalo
  existe solo mientras hay alguien activo y se cancela al vaciarse. No se guarda nada en el mundo.
- **Por qué:** lo pidió Daniel ("que no consuma recursos" y "que nada se rompa si quito el addon").
- **Supuesto aceptado:** al pararse en el elevador sin usarlo no se muestra el piso hasta el primer
  movimiento.
- **Descartado:** revisar a todos los jugadores cada tick y los displays físicos por piso (entidades o
  letreros que se modifican).

## 2026-10-06 — Tabla de `rail_direction` (Bedrock)
- 0 recto N–S · 1 recto E–O · 2/3/4/5 pendiente que sube hacia E/O/N/S · 6 curva S–E · 7 curva S–O ·
  8 curva N–O · 9 curva N–E. Los rieles propulsor, detector y activador usan solo 0–5 (vanilla-data
  1.26.52: `rail_direction` + `rail_data_bit`).
- Fuente: https://minecraft.wiki/w/Rail (Data values, Bedrock), revisada el 2026-10-06. Coincide con
  design §1 de `add-metro-train`.

## 2026-10-06 — Implementación del vagón de metro (change `add-metro-train`, 0.2.0)
- **Vía:** geometría por bloque (recta largo 1, pendiente √2, curva = cuarto de círculo de radio 0.5).
  El vecino se busca en Y+1, Y y Y−1, y solo conecta si su riel tiene ese lado a la misma altura. Sin
  riel o sin cargar = fin de vía. 30 pruebas con mocks (curvas 6–9, pendientes 2–5, escalera
  diagonal con yaw gradual ≤15° por 0.1, S, óvalo y fin de vía).
- **Bogies:** a ±2 del centro sobre la vía; posición = punto medio, yaw/pitch = de un bogie al otro.
- **Física:** 10 bloques/s adelante, 3 en reversa (constantes en `src/train/config.ts`). El intervalo
  de 1 tick existe solo mientras hay vagones cargados; un vagón detenido sin conductor casi no
  cuesta (no lee bloques ni hace teleport).
- **Render controller propio** (`controller.render.eleytren.metro_car`) en lugar de referenciar
  `controller.render.default`: es lo que hace civiles y no depende de un archivo vanilla.
- **Formatos:** entidad 1.26.30 (componentes revisados contra vanilla ≥1.26.30; `custom_hit_test`
  solo está en hoglin/zoglin 1.26.20). Item 1.26.30 (como `apple.json`). Propiedad `float` para
  el pitch: documentada como estable en Microsoft Learn, aunque vanilla no la usa.
- **Cabina en los dos extremos** (pedido de Daniel): mampara, tablero y asiento idénticos en ambos
  lados, así que no importa hacia dónde quede el frente del modelo en el juego. El asiento del
  conductor se define en el espacio de la entidad (+Z = hacia donde avanza), así que siempre queda en
  la cabina delantera.
- **Por confirmar en el iPad:** el signo del pitch en pendientes, hacia dónde miran los pasajeros (`rotate_rider_by`
  ±90), la altura de los asientos, que `getRiders()[0]` sea el del asiento de la cabina y que
  `entityHitEntity` llegue aunque `damage_sensor` cancele el daño.

## 2026-10-06 — Retroalimentación de la 0.2.0 (change `add-metro-coupling-and-fixes`)
- **Elevador:** sin título grande (tapaba la vista), solo la action bar. El último piso se llama
  **PH**, como en los tableros de elevador de México y EE. UU. Alfombras, carteles y antorchas
  cuentan como aire.
- **Propulsores:** encendido = acelera solo hasta 20 b/s; apagado = frena hasta detenerse (estación,
  como en vanilla) y luego el conductor puede salir. Detector y activador siguen siendo rieles
  normales.
- **Velocidad:** el conductor llega a 12 b/s (el carrito vanilla ~8). Daniel pidió no gastar más
  ticks: se sigue moviendo cada tick (moverlo cada 2 se ve a saltos) y se baja el costo con una caché
  de rieles. "Se traba" fue una recomendación, no una falla observada.
- **Inclinación:** en el iPad nunca se inclinó. Causa probable: client entity en 1.10.0 leyendo
  `query.property`; se sube a 1.26.0 y se agrega un HUD de dev para diagnosticar.
- **Vagones unidos:** se pidieron en este mismo change. Máximo 4, enganche al colocar o chocar,
  desenganche al interactuar agachado; el enganche se guarda en dynamic properties del vagón.

## 2026-10-06 — Implementación de `add-metro-coupling-and-fixes` (0.3.0)
- **Trenes:** un tren es una lista de vagones + el cursor de la cabeza; cada vagón va a 6.25 sobre la
  vía del anterior. Se guarda en la dynamic property `eleytren:consist` (`{id, index, count}`). Si un
  tren guardado no termina de cargar en 10 s, se rearma con los vagones presentes (los que lleguen
  después quedan como trenes de uno).
- **Choques:** antes de mover se busca, en pasos de 0.25 a lo largo de la vía, dónde quedaría un
  vagón más delante de la cabeza (o detrás de la cola); el tren avanza justo hasta tocar y se une si
  caben (máx. 4). Al colocar, se busca un vecino a ±1.5 de la distancia exacta y el vagón nuevo se
  acomoda.
- **Desenganchar:** `world.beforeEvents.playerInteractWithEntity` con el jugador agachado (el
  rideable tiene `crouching_skip_interact`, así que no se monta). **Por confirmar en el iPad** que el
  evento llegue en ese caso.
- **Propulsores:** el efecto es el más fuerte bajo el centro de cualquier vagón. La caché de rieles
  se borra cada 20 ticks, así que encender un propulsor se nota en ≤1 s.
- **Inclinación:** client entity en 1.26.0; HUD de dev para el conductor (`v`, `pitch` y efecto del
  riel) para diagnosticar en el iPad.
