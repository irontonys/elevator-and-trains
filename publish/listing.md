# Publicación: Elevator & Trains

Textos e imágenes para el proyecto en CurseForge (se sincroniza a MCPEDL). Las imágenes de esta carpeta
salen de `node tools/gen-art.mjs`; las capturas del juego las toma Daniel en el iPad.

## Checklist para subirlo

1. Cuenta de autor en https://authors.curseforge.com y, en el perfil de MCPEDL, **Connected Accounts** →
   ligar CurseForge.
2. Authors Console → **Create Project** → juego **Minecraft Bedrock** → tipo **Addons**.
3. Nombre: `Elevator & Trains`. Slug: `elevator-and-trains` (debe coincidir con el link de MCPEDL).
4. Avatar: `publish/avatar.png` (400 × 400).
5. Resumen y descripción: copiar de abajo.
6. Imágenes: `publish/cover.png` con la etiqueta **MCPEDL**, más las capturas del iPad (mínimo 3).
7. Activar **third-party sharing** (y el **Reward Program** si se quiere ganar con las descargas).
8. Archivo: `dist/elevadores-trenes.mcaddon` de `npm run build:release`, como **Release**, versión del
   juego 1.26.50, con el changelog de abajo.
9. Mandar a revisión.

Capturas sugeridas: el elevador por fuera (bloques de inicio y límite) y por dentro con el indicador de
piso; el vagón sobre la vía; la cabina con el conductor; un tren de 3 o 4 vagones en una curva; un tramo
con rieles propulsores.

## Nombre

Elevator & Trains

## Resumen (una oración)

Building elevators that detect real floors, and drivable subway cars that run on vanilla rails and
couple into trains.

## Descripción

### Elevators

Place two **Elevator Blocks** in the same column: the bottom one is the start and the top one is the
limit. Everything in between becomes an elevator.

- **Jump** to go up one floor, **sneak** to go down one floor.
- Floors are detected from the actual building: any solid block with two blocks of air above it is a
  floor, so your floors can have any height. Carpets, signs and torches don't get in the way.
- The current floor is shown in the action bar: G, 1, 2, 3… and PH for the top floor.
- Stack more blocks in the same column to build longer elevators.

### Subway trains

A ~6-block-long subway car with a cab at each end, side windows, doors and seats for passengers.

- Use the **Subway Car** item on any vanilla rail with enough track (at least 5 connected rail blocks).
- The first player to get in is the driver: move **forward** to accelerate (up to 12 blocks/s) and
  **back** to brake or reverse. Other players ride as passengers.
- **Powered rails** speed the train up on their own (up to 20 blocks/s). **Unpowered rails** stop it:
  use them for stations.
- **Couple up to 4 cars** by placing them next to each other or bumping them together. Sneak and
  interact with a car to uncouple it.
- Hit a car a few times to pick it up. It can't be destroyed by mobs, fire or explosions, and players
  can't push it.

### Crafting

- **Elevator Block (×2):** 8 iron ingots around 1 redstone dust.
- **Subway Car:** 3 glass panes on top; iron ingot, minecart, iron ingot in the middle; iron ingot,
  redstone dust, iron ingot at the bottom.

Both items are also in the creative inventory.

### Installation

1. Download the `.mcaddon` and open it: Minecraft imports both packs.
2. In your world settings, activate **Elevator & Trains (BP)**. The resource pack is added
   automatically.
3. No experimental toggles needed. Requires Minecraft Bedrock 1.26.50 or newer.

Safe to remove: the add-on doesn't change vanilla blocks or rails, and doesn't leave scoreboards or
commands in your world.

---

### Español

**Elevadores:** coloca dos **bloques de elevador** en la misma columna (inicio abajo, límite arriba).
**Salta** para subir un piso y **agáchate** para bajar uno. Los pisos se detectan por el suelo real del
edificio, así que pueden tener cualquier altura. Las alfombras, los carteles y las antorchas no
estorban. El piso actual se ve en la barra de acción: PB, 1, 2, 3… y PH en el último.

**Metro:** usa el item **Vagón de metro** sobre cualquier riel vanilla. El primero que sube maneja
(adelante para acelerar, atrás para frenar o ir en reversa) y los demás van de pasajeros. Los rieles
propulsores encendidos lo aceleran solos y los apagados lo detienen, para hacer estaciones. Puedes unir
hasta 4 vagones poniéndolos juntos o chocándolos. Para desenganchar uno, interactúa con él agachado.

**Instalación:** abre el `.mcaddon` y activa **Elevator & Trains (BP)** en tu mundo. No necesita
experimentales. Requiere Minecraft Bedrock 1.26.50 o más nuevo.

## Changelog 0.3.3

- First public release: elevators, subway cars, powered-rail boosters and coupled trains.
- Pack icons.
