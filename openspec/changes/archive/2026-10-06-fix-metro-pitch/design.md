# Design

## Context

`refreshPoses` mueve cada vagón con `teleport(position, { rotation: { x: 0, y: yaw } })` y, si el pitch
cambió más de 0.5°, llama `setProperty("eleytren:pitch")`. En el iPad esa llamada lanza
`InvalidArgumentError` en cada tick porque el juego no registra la propiedad, aunque la definición se
ve correcta (`float`, rango [-45, 45], `client_sync`). No hay Minecraft en la Mac para encontrar la
causa en el log de carga.

## Goals / Non-Goals

**Goals:** Content Log sin errores al mover el metro; inclinación visible en pendientes.

**Non-Goals:** averiguar por qué no se registra la propiedad.

## Decisions

1. **Pitch en la rotación de la entidad.** `teleport` ya recibe `rotation: { x, y }`: se manda
   `x = -pose.pitch` (en Minecraft, X negativo = mirar hacia arriba, y `pose.pitch` es positivo de
   subida). La API estable lo acepta para cualquier entidad, así que no hay nada que pueda fallar.
2. **El RP lee `query.body_x_rotation`**, que devuelve el pitch del actor. La animación rota `body` con
   ese valor: `rotation: ["query.body_x_rotation", 0, 0]`. Antes se rotaba con `-pitch`, y ahora el
   valor ya llega negado, así que el signo de la carrocería no cambia.
3. **Sin umbral.** El teleport ya se hace en cada paso del tren, así que el pitch se manda siempre y se
   borran `PITCH_EPSILON` y el parámetro `force` de `refreshPoses`, que solo existían para no llamar
   `setProperty` de más. `consist.pitches` se queda para el HUD de dev.

## Risks / Trade-offs

- [El cliente no aplica la rotación X a una entidad que no es mob] → La carrocería no se inclina, pero
  el log queda limpio. El HUD de dev muestra el pitch calculado para distinguir este caso.
- [El signo queda invertido] → Se ve en la primera pendiente y se corrige el signo en la animación.
- [La rotación X cambia la vista de los pasajeros] → `rotate_rider_by` solo usa el yaw. Se revisa en el
  iPad.
